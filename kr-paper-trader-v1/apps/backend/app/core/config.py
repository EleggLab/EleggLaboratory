from pydantic import BaseModel
import os

class Settings(BaseModel):
    tz: str = os.getenv("TZ", "Asia/Seoul")
    allow_internal_ai_generate: bool = os.getenv("ALLOW_INTERNAL_AI_GENERATE", "false").lower() == "true"
    risk_reserve_cash_pct: float = 20.0
    max_positions: int = 5
    max_single_position_pct: float = 15.0
    max_sector_exposure_pct: float = 30.0
    max_daily_new_buy_pct: float = 30.0
    default_stop_loss_pct: float = 4.0
    default_take_profit_pct: float = 7.0
    default_trailing_stop_pct: float = 2.0
    default_time_stop_days: int = 5

settings = Settings()
