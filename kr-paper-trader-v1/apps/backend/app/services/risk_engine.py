from app.core.config import settings
from app.schemas.common import OrderSchema
from app.services.risk_state import is_banned


class RiskResult:
    def __init__(self, ok: bool, reason: str = ""):
        self.ok = ok
        self.reason = reason


def validate_order(order: OrderSchema, stale_data: bool = False) -> RiskResult:
    if is_banned(order.ticker):
        return RiskResult(False, "banned ticker")
    if stale_data and order.side == "buy":
        return RiskResult(False, "stale data blocks new buy")
    if order.target_weight_pct > settings.max_single_position_pct and order.side == "buy":
        return RiskResult(False, "max single position exceeded")
    if order.execution_safety.review_required and order.source == "ai":
        return RiskResult(False, "ai order must be approved before queue")
    return RiskResult(True)
