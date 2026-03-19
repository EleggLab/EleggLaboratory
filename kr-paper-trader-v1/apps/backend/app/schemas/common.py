from pydantic import BaseModel, Field
from typing import Optional, Literal, Dict, Any

Source = Literal["manual", "ai"]
Side = Literal["buy", "sell"]
Intent = Literal["enter", "add", "reduce", "exit"]
TriggerType = Literal["limit_now", "market_open", "price_below", "price_above", "none"]
OrderType = Literal["limit", "market"]

class ExitRules(BaseModel):
    take_profit_pct: Optional[float] = None
    stop_loss_pct: Optional[float] = None
    trailing_stop_pct: Optional[float] = None
    time_stop_days: Optional[int] = None

class ExecutionSafety(BaseModel):
    review_required: bool = True
    max_slippage_bps: Optional[int] = 20

class OrderSchema(BaseModel):
    source: Source = "manual"
    ticker: str = Field(..., min_length=1)
    side: Side
    intent: Intent
    target_weight_pct: float = Field(..., ge=0, le=100)
    trigger_type: TriggerType = "none"
    trigger_price: Optional[float] = None
    order_type: OrderType = "market"
    order_price: Optional[float] = None
    exit_rules: Optional[ExitRules] = None
    execution_safety: ExecutionSafety = ExecutionSafety()
    metadata: Dict[str, Any] = {}
