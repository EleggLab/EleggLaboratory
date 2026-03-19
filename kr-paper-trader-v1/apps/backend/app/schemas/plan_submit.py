from pydantic import BaseModel
from typing import Any, Dict, List


class PlanSubmitRequest(BaseModel):
    as_of_kst: str
    market_regime: str
    portfolio_policy: Dict[str, Any] = {}
    portfolio_targets: List[Dict[str, Any]] = []
    trade_plan: List[Dict[str, Any]] = []
    watchlist: List[str] = []
    risk_summary: Dict[str, Any] = {}
    data_quality: Dict[str, Any] = {}
    user_summary: str = ""
    final_verdict: str = "REVIEW_REQUIRED"
