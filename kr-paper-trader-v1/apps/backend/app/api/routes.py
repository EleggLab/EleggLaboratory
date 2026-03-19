from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.schemas.common import OrderSchema
from app.schemas.ai import PlanGenerateRequest, DailyPlanResponse
from app.schemas.auth import LoginRequest, LoginResponse
from app.services import paper_execution as ex
from app.services.risk_engine import validate_order
from app.core.db import get_db
from app.models.entities import Instrument, RiskRule, AuditLog

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


@router.post("/auth/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    # v1 mock auth; replace with proper JWT in phase 2
    if not payload.username or not payload.password:
        raise HTTPException(400, "invalid credentials")
    return LoginResponse(access_token=f"dev-token-{payload.username}")


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
def create_order(order: OrderSchema, db: Session = Depends(get_db)):
    rr = validate_order(order)
    if not rr.ok:
        raise HTTPException(400, rr.reason)
    created = ex.create_order(order.model_dump())
    _audit(db, "user", "order", created["id"], "created", after=created)
    return created


@router.post("/orders/{order_id}/cancel")
def cancel_order(order_id: str, db: Session = Depends(get_db)):
    row = ex.cancel_order(order_id)
    if "error" in row:
        raise HTTPException(404, row["error"])
    _audit(db, "user", "order", order_id, "cancelled", after=row)
    return row


@router.post("/orders/{order_id}/replace")
def replace_order(order_id: str, order: OrderSchema, db: Session = Depends(get_db)):
    row = ex.replace_order(order_id, order.model_dump())
    if "error" in row:
        raise HTTPException(404, row["error"])
    _audit(db, "user", "order", order_id, "replaced", after=row)
    return row


@router.get("/orders")
def get_orders():
    return list(ex.ORDER_DB.values())


@router.get("/fills")
def get_fills():
    return ex.FILL_DB


@router.get("/positions")
def get_positions():
    return []


@router.get("/dashboard")
def get_dashboard():
    return DASHBOARD


@router.get("/market/status")
def market_status():
    return {"status": "정규장", "tz": "Asia/Seoul"}


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
def patch_risk_settings(payload: dict, db: Session = Depends(get_db)):
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
    return {"ok": True}


@router.post("/sim/replay/start")
def sim_replay_start(payload: dict):
    return {"ok": True, "seed": payload.get("seed", 42)}


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
