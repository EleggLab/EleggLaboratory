from datetime import datetime, time
from zoneinfo import ZoneInfo

KST = ZoneInfo("Asia/Seoul")

SESSION_STATE = {
    "manual_override": None,  # pre/open/after/closed
    "stale_quote_seconds": 60,
}


def infer_market_state() -> str:
    if SESSION_STATE["manual_override"]:
        return SESSION_STATE["manual_override"]
    now = datetime.now(KST).time()
    if time(8, 0) <= now < time(9, 0):
        return "pre"
    if time(9, 0) <= now < time(15, 30):
        return "open"
    if time(15, 30) <= now < time(18, 0):
        return "after"
    return "closed"


def set_manual_state(state: str | None):
    SESSION_STATE["manual_override"] = state


def get_session_info() -> dict:
    return {
        "market_state": infer_market_state(),
        "manual_override": SESSION_STATE["manual_override"],
        "stale_quote_seconds": SESSION_STATE["stale_quote_seconds"],
        "tz": "Asia/Seoul",
    }
