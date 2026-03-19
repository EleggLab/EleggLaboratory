from fastapi import APIRouter, HTTPException
from app.schemas.common import OrderSchema
from app.schemas.ai import PlanGenerateRequest, DailyPlanResponse
from app.services import paper_execution as ex
from app.services.risk_engine import validate_order

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
RISK_SETTINGS = {
    "reserve_cash_pct": 20,
    "max_positions": 5,
    "max_single_position_pct": 15,
    "max_sector_exposure_pct": 30,
    "max_daily_new_buy_pct": 30,
    "default_stop_loss_pct": 4,
    "default_take_profit_pct": 7,
    "default_trailing_stop_pct": 2,
    "default_time_stop_days": 5,
}

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
def create_order(order: OrderSchema):
    rr = validate_order(order)
    if not rr.ok:
        raise HTTPException(400, rr.reason)
    return ex.create_order(order.model_dump())

@router.post("/orders/{order_id}/cancel")
def cancel_order(order_id: str):
    row = ex.cancel_order(order_id)
    if "error" in row:
        raise HTTPException(404, row["error"])
    return row

@router.post("/orders/{order_id}/replace")
def replace_order(order_id: str, order: OrderSchema):
    row = ex.replace_order(order_id, order.model_dump())
    if "error" in row:
        raise HTTPException(404, row["error"])
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
def get_risk_settings():
    return RISK_SETTINGS

@router.patch("/settings/risk")
def patch_risk_settings(payload: dict):
    RISK_SETTINGS.update(payload)
    return RISK_SETTINGS

@router.post("/sim/reset")
def sim_reset():
    ex.ORDER_DB.clear()
    ex.FILL_DB.clear()
    return {"ok": True}

@router.post("/sim/replay/start")
def sim_replay_start(payload: dict):
    return {"ok": True, "seed": payload.get("seed", 42)}

@router.get("/audit-logs")
def get_audit_logs():
    return []
