from datetime import datetime
from zoneinfo import ZoneInfo

KST = ZoneInfo("Asia/Seoul")

POSITIONS: dict[str, dict] = {}
CASH_LEDGER: list[dict] = [{"type":"init","amount":100000000,"balance_after":100000000,"reason":"seed","occurred_at":datetime.now(KST).isoformat()}]


def cash_balance() -> float:
    return float(CASH_LEDGER[-1]["balance_after"]) if CASH_LEDGER else 0.0


def append_cash(type_: str, amount: float, reason: str):
    bal = cash_balance() + amount
    row = {
        "type": type_,
        "amount": amount,
        "balance_after": bal,
        "reason": reason,
        "occurred_at": datetime.now(KST).isoformat(),
    }
    CASH_LEDGER.append(row)
    return row


def apply_fill(ticker: str, side: str, qty: int, price: float):
    if qty <= 0:
        return
    p = POSITIONS.get(ticker, {"ticker": ticker, "quantity": 0, "avg_price": 0.0, "market_value": 0.0, "weight_pct": 0.0, "unrealized_pnl": 0.0, "realized_pnl": 0.0})
    if side == "buy":
        total_cost = p["avg_price"] * p["quantity"] + price * qty
        new_qty = p["quantity"] + qty
        p["quantity"] = new_qty
        p["avg_price"] = total_cost / new_qty if new_qty else 0.0
        append_cash("buy", -price * qty, f"buy {ticker}")
    else:
        sell_qty = min(qty, p["quantity"])
        if sell_qty <= 0:
            return
        p["quantity"] -= sell_qty
        p["realized_pnl"] += (price - p["avg_price"]) * sell_qty
        append_cash("sell", price * sell_qty, f"sell {ticker}")
        if p["quantity"] == 0:
            p["avg_price"] = 0.0
    POSITIONS[ticker] = p


def refresh_market_values(quotes: dict[str, dict]):
    total_asset = cash_balance()
    for t, p in POSITIONS.items():
        q = quotes.get(t)
        last = q["last"] if q else p["avg_price"]
        p["market_value"] = last * p["quantity"]
        total_asset += p["market_value"]
    for p in POSITIONS.values():
        p["weight_pct"] = (p["market_value"] / total_asset * 100) if total_asset > 0 else 0
    return total_asset
