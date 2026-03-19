from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.schemas.common import OrderSchema
from app.schemas.ai import PlanGenerateRequest, DailyPlanResponse
from app.schemas.auth import LoginRequest, LoginResponse
from app.api.deps import get_current_user
from app.services import paper_execution as ex
from app.services.risk_engine import validate_order
from app.services.market_data import upsert_quote, all_quotes, QUOTE_DB, is_stale
from app.services.portfolio import POSITIONS, CASH_LEDGER, refresh_market_values, cash_balance
from app.services.session_service import get_session_info, set_manual_state, SESSION_STATE
from app.services.risk_state import set_banned, BANNED_TICKERS
from app.services.state_store import save_state
from app.services.corporate_actions_service import apply_actions_for_today
from app.core.db import get_db
from app.core.security import create_access_token, verify_password, hash_password
from app.models.entities import Instrument, RiskRule, AuditLog, SessionCalendar, CorporateAction, User

router = APIRouter(prefix="/api")

DASHBOARD = {
    "total_asset": 100000000,
    "cash_weight_pct": 100,
    "daily_pnl": 0,
    "cum_pnl": 0,
    "risk_warnings": [],
    "market_state": "정규장",
}

AI_PLANS = {}


def _get_or_create_risk_rule(db: Session) -> RiskRule:
    row = db.query(RiskRule).filter(RiskRule.is_active.is_(True)).first()
    if row:
        return row
    row = RiskRule()
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def _audit(db: Session, actor: str, entity: str, entity_id: str, action: str, before=None, after=None):
    db.add(AuditLog(actor=actor, entity_type=entity, entity_id=entity_id, action=action, before_json=before, after_json=after))
    db.commit()


def _validate_instrument_tradability(db: Session, ticker: str):
    inst = db.query(Instrument).filter(Instrument.ticker == ticker).first()
    if not inst:
        raise HTTPException(400, "unknown instrument")
    if not inst.tradable:
        raise HTTPException(400, "instrument not tradable")
    flags = set((inst.warning_flags or {}).keys())
    blocked = {"halt", "warning", "danger", "managed"}
    if flags.intersection(blocked):
        raise HTTPException(400, f"instrument blocked by warning flags: {sorted(flags.intersection(blocked))}")
    if (inst.liquidity_class or "NORMAL").upper() in ("LOW", "ILLIQUID"):
        raise HTTPException(400, "instrument blocked by liquidity filter")


@router.post("/auth/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    if not payload.username or not payload.password:
        raise HTTPException(400, "invalid credentials")

    user = db.query(User).filter(User.username == payload.username).first()
    if not user:
        user = User(username=payload.username, password_hash=hash_password(payload.password))
        db.add(user)
        db.commit()
        db.refresh(user)

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(401, "invalid credentials")

    token = create_access_token(payload.username)
    return LoginResponse(access_token=token)


@router.get("/instruments")
def get_instruments(db: Session = Depends(get_db)):
    return [
        {
            "ticker": i.ticker,
            "name": i.name,
            "market": i.market,
            "venue": i.venue,
            "tradable": i.tradable,
            "warning_flags": i.warning_flags,
        }
        for i in db.query(Instrument).all()
    ]


@router.post("/instruments/seed")
def seed_instruments(db: Session = Depends(get_db)):
    seed = [
        ("005930", "삼성전자"),
        ("000660", "SK하이닉스"),
        ("035420", "NAVER"),
    ]
    for ticker, name in seed:
        if not db.query(Instrument).filter(Instrument.ticker == ticker).first():
            db.add(Instrument(ticker=ticker, name=name))
    db.commit()
    return {"ok": True, "count": len(seed)}


@router.patch("/market/admin/instruments/{ticker}/flags")
def patch_instrument_flags(ticker: str, payload: dict, db: Session = Depends(get_db)):
    row = db.query(Instrument).filter(Instrument.ticker == ticker).first()
    if not row:
        raise HTTPException(404, "instrument not found")
    wf = row.warning_flags or {}
    wf.update(payload.get("warning_flags", {}))
    row.warning_flags = wf
    if "tradable" in payload:
        row.tradable = bool(payload["tradable"])
    if "liquidity_class" in payload:
        row.liquidity_class = str(payload["liquidity_class"])
    db.commit()
    return {"ok": True, "ticker": ticker, "warning_flags": row.warning_flags, "tradable": row.tradable, "liquidity_class": row.liquidity_class}


@router.post("/market/admin/disclosure-sync/mock")
def disclosure_sync_mock(payload: dict, db: Session = Depends(get_db)):
    items = payload.get("items", [])
    updated = 0
    for it in items:
        ticker = it.get("ticker")
        if not ticker:
            continue
        row = db.query(Instrument).filter(Instrument.ticker == ticker).first()
        if not row:
            continue
        wf = row.warning_flags or {}
        wf.update(it.get("warning_flags", {}))
        row.warning_flags = wf
        if "tradable" in it:
            row.tradable = bool(it["tradable"])
        updated += 1
    db.commit()
    return {"ok": True, "updated": updated}


@router.post("/ai/plan/generate")
def ai_plan_generate(req: PlanGenerateRequest):
    plan_id = f"plan_{len(AI_PLANS)+1:06d}"
    plan = DailyPlanResponse(
        as_of_kst="2026-03-19",
        market_regime="sideways",
        portfolio_policy={"reserve_cash_pct": 20},
        portfolio_targets=[],
        trade_plan=[],
        final_verdict="REVIEW_REQUIRED",
    ).model_dump()
    plan["id"] = plan_id
    plan["approval_status"] = "pending"
    AI_PLANS[plan_id] = plan
    return plan


@router.post("/ai/plan/{plan_id}/approve")
def ai_plan_approve(plan_id: str):
    p = AI_PLANS.get(plan_id)
    if not p:
        raise HTTPException(404, "plan not found")
    p["approval_status"] = "approved"
    return p


@router.post("/ai/plan/{plan_id}/reject")
def ai_plan_reject(plan_id: str):
    p = AI_PLANS.get(plan_id)
    if not p:
        raise HTTPException(404, "plan not found")
    p["approval_status"] = "rejected"
    return p


@router.post("/orders")
def create_order(order: OrderSchema, db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    _validate_instrument_tradability(db, order.ticker)

    # duplicate order guard (same ticker with live working states)
    live_states = {"queued", "working", "partially_filled"}
    for o in ex.ORDER_DB.values():
        if o.get("ticker") == order.ticker and o.get("status") in live_states:
            raise HTTPException(400, "duplicate live order exists for ticker")

    session = get_session_info()
    stale = is_stale(order.ticker, session["stale_quote_seconds"])
    rr = validate_order(order, stale_data=stale)
    if not rr.ok:
        raise HTTPException(400, rr.reason)

    # session policy
    if session["market_state"] in ("closed", "pre", "after") and order.trigger_type != "market_open":
        raise HTTPException(400, f"market state={session['market_state']}: only market_open orders allowed")

    created = ex.create_order(order.model_dump())
    if isinstance(created, dict) and "split" in created:
        for c in created["split"]:
            _audit(db, "user", "order", c["id"], "created", after=c)
    else:
        _audit(db, "user", "order", created["id"], "created", after=created)
    save_state()
    return created


@router.post("/orders/{order_id}/cancel")
def cancel_order(order_id: str, db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    row = ex.cancel_order(order_id)
    if "error" in row:
        raise HTTPException(404, row["error"])
    _audit(db, "user", "order", order_id, "cancelled", after=row)
    save_state()
    return row


@router.post("/orders/{order_id}/replace")
def replace_order(order_id: str, order: OrderSchema, db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    row = ex.replace_order(order_id, order.model_dump())
    if "error" in row:
        raise HTTPException(404, row["error"])
    _audit(db, "user", "order", order_id, "replaced", after=row)
    save_state()
    return row


@router.get("/orders")
def get_orders():
    return list(ex.ORDER_DB.values())


@router.get("/fills")
def get_fills():
    return ex.FILL_DB


@router.post("/quotes")
def post_quote(payload: dict):
    ticker = payload.get("ticker")
    last = payload.get("last")
    if not ticker or last is None:
        raise HTTPException(400, "ticker and last are required")
    row = upsert_quote(
        ticker=ticker,
        last=float(last),
        bid1=float(payload.get("bid1", last)),
        ask1=float(payload.get("ask1", last)),
        volume=int(payload.get("volume", 0)),
        source=str(payload.get("source", "mock")),
    )
    ex.process_working_orders()
    save_state()
    return row


@router.get("/quotes")
def get_quotes():
    return all_quotes()


@router.get("/positions")
def get_positions():
    refresh_market_values(QUOTE_DB)
    return list(POSITIONS.values())


@router.get("/cash-ledger")
def get_cash_ledger():
    return CASH_LEDGER[-200:]


@router.get("/dashboard")
def get_dashboard():
    total_asset = refresh_market_values(QUOTE_DB)
    cash = cash_balance()
    return {
        **DASHBOARD,
        "total_asset": round(total_asset, 2),
        "cash_weight_pct": round((cash / total_asset * 100) if total_asset > 0 else 0, 2),
        "today_orders": len(ex.ORDER_DB),
        "today_fills": len(ex.FILL_DB),
        "positions": len(POSITIONS),
    }


@router.get("/market/status")
def market_status():
    return get_session_info()


@router.post("/market/admin/session-state")
def set_market_state(payload: dict):
    state = payload.get("state")
    if state not in (None, "pre", "open", "after", "closed"):
        raise HTTPException(400, "state must be one of pre/open/after/closed/null")
    set_manual_state(state)
    if "stale_quote_seconds" in payload:
        SESSION_STATE["stale_quote_seconds"] = int(payload["stale_quote_seconds"])
    return get_session_info()


@router.get("/market/calendar")
def get_market_calendar(db: Session = Depends(get_db)):
    rows = db.query(SessionCalendar).order_by(SessionCalendar.trade_date.asc()).limit(365).all()
    return [
        {
            "trade_date": r.trade_date,
            "market_state": r.market_state,
            "open_time": r.open_time,
            "close_time": r.close_time,
            "note": r.note,
        }
        for r in rows
    ]


@router.post("/market/calendar")
def upsert_market_calendar(payload: dict, db: Session = Depends(get_db)):
    trade_date = payload.get("trade_date")
    if not trade_date:
        raise HTTPException(400, "trade_date required")
    row = db.query(SessionCalendar).filter(SessionCalendar.trade_date == trade_date).first()
    if not row:
        row = SessionCalendar(trade_date=trade_date)
        db.add(row)
    for k in ("market_state", "open_time", "close_time", "note"):
        if k in payload:
            setattr(row, k, payload[k])
    db.commit()
    return {"ok": True}


@router.get("/corporate-actions")
def get_corporate_actions(db: Session = Depends(get_db)):
    rows = db.query(CorporateAction).order_by(CorporateAction.id.desc()).limit(200).all()
    return [
        {
            "id": r.id,
            "ticker": r.ticker,
            "action_type": r.action_type,
            "ex_date": r.ex_date,
            "ratio": r.ratio,
            "cash_amount": r.cash_amount,
        }
        for r in rows
    ]


@router.post("/corporate-actions")
def create_corporate_action(payload: dict, db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    required = ["ticker", "action_type", "ex_date"]
    if any(k not in payload for k in required):
        raise HTTPException(400, "ticker/action_type/ex_date required")
    row = CorporateAction(
        ticker=payload["ticker"],
        action_type=payload["action_type"],
        ex_date=payload["ex_date"],
        ratio=payload.get("ratio"),
        cash_amount=payload.get("cash_amount"),
        raw_payload=payload,
    )
    db.add(row)
    db.commit()
    return {"ok": True, "id": row.id}


@router.post("/corporate-actions/apply-today")
def apply_corporate_actions_today(db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    applied = apply_actions_for_today(db, POSITIONS)
    save_state()
    return {"ok": True, "applied": applied}


@router.get("/settings/risk")
def get_risk_settings(db: Session = Depends(get_db)):
    rr = _get_or_create_risk_rule(db)
    return {
        "reserve_cash_pct": rr.reserve_cash_pct,
        "max_positions": rr.max_positions,
        "max_single_position_pct": rr.max_single_position_pct,
        "max_sector_exposure_pct": rr.max_sector_exposure_pct,
        "max_daily_new_buy_pct": rr.max_daily_new_buy_pct,
        "default_stop_loss_pct": rr.stop_loss_pct,
        "default_take_profit_pct": rr.take_profit_pct,
        "default_trailing_stop_pct": rr.trailing_stop_pct,
        "default_time_stop_days": rr.time_stop_days,
    }


@router.patch("/settings/risk")
def patch_risk_settings(payload: dict, db: Session = Depends(get_db), user: str = Depends(get_current_user)):
    rr = _get_or_create_risk_rule(db)
    before = {
        "reserve_cash_pct": rr.reserve_cash_pct,
        "max_positions": rr.max_positions,
    }
    for k, v in payload.items():
        if hasattr(rr, k):
            setattr(rr, k, v)
    db.commit()
    db.refresh(rr)
    _audit(db, "user", "risk_rule", str(rr.id), "updated", before=before, after=payload)
    return get_risk_settings(db)


@router.post("/sim/reset")
def sim_reset():
    ex.ORDER_DB.clear()
    ex.FILL_DB.clear()
    POSITIONS.clear()
    CASH_LEDGER.clear()
    CASH_LEDGER.append({"type":"reset","amount":100000000,"balance_after":100000000,"reason":"sim_reset","occurred_at":"reset"})
    save_state()
    return {"ok": True}


@router.post("/sim/replay/start")
def sim_replay_start(payload: dict):
    import random
    seed = int(payload.get("seed", 42))
    random.seed(seed)
    path = [round(70000 + random.randint(-500, 500), 2) for _ in range(10)]
    return {"ok": True, "seed": seed, "preview_path": path}


@router.get("/risk/banned-tickers")
def get_banned_tickers():
    return {"banned_tickers": sorted(BANNED_TICKERS)}


@router.patch("/risk/banned-tickers")
def patch_banned_tickers(payload: dict, user: str = Depends(get_current_user)):
    tickers = payload.get("banned_tickers", [])
    if not isinstance(tickers, list):
        raise HTTPException(400, "banned_tickers must be list")
    set_banned([str(t) for t in tickers])
    return {"banned_tickers": sorted(BANNED_TICKERS)}


@router.get("/audit-logs")
def get_audit_logs(db: Session = Depends(get_db)):
    rows = db.query(AuditLog).order_by(AuditLog.id.desc()).limit(200).all()
    return [
        {
            "id": r.id,
            "actor": r.actor,
            "entity_type": r.entity_type,
            "entity_id": r.entity_id,
            "action": r.action,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]
