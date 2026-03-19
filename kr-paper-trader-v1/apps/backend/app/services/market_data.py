from datetime import datetime
from zoneinfo import ZoneInfo

KST = ZoneInfo("Asia/Seoul")

QUOTE_DB: dict[str, dict] = {}


def upsert_quote(ticker: str, last: float, bid1: float | None = None, ask1: float | None = None, volume: int = 0, source: str = "mock"):
    QUOTE_DB[ticker] = {
        "ticker": ticker,
        "ts": datetime.now(KST).isoformat(),
        "last": last,
        "bid1": bid1 if bid1 is not None else last,
        "ask1": ask1 if ask1 is not None else last,
        "volume": volume,
        "source": source,
    }
    return QUOTE_DB[ticker]


def get_quote(ticker: str):
    return QUOTE_DB.get(ticker)


def all_quotes():
    return list(QUOTE_DB.values())
