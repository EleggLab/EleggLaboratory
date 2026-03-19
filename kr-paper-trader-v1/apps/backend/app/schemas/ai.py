from pydantic import BaseModel
from typing import List, Dict, Any, Literal
from .common import OrderSchema

class PlanGenerateRequest(BaseModel):
    market_snapshot: Dict[str, Any] = {}
    news_digest: List[str] = []
    disclosure_digest: List[str] = []
    financial_snapshot: Dict[str, Any] = {}
    current_positions: List[Dict[str, Any]] = []
    risk_config: Dict[str, Any] = {}
    banned_tickers: List[str] = []
    allowed_universe: List[str] = []
    special_notes: str = ""

class DailyPlanResponse(BaseModel):
    as_of_kst: str
    market_regime: str
    portfolio_policy: Dict[str, Any]
    portfolio_targets: List[Dict[str, Any]]
    trade_plan: List[OrderSchema]
    watchlist: List[str] = []
    risk_summary: Dict[str, Any] = {}
    data_quality: Dict[str, Any] = {}
    user_summary: str = ""
    approval_required: bool = True
    final_verdict: Literal["REVIEW_REQUIRED", "NO_TRADE", "APPROVED"] = "REVIEW_REQUIRED"
