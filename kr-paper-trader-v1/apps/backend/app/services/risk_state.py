BANNED_TICKERS: set[str] = set()
BLOCK_WARNING_FLAGS = {"halt", "warning", "danger", "managed"}


def set_banned(tickers: list[str]):
    BANNED_TICKERS.clear()
    for t in tickers:
        BANNED_TICKERS.add(t)


def is_banned(ticker: str) -> bool:
    return ticker in BANNED_TICKERS
