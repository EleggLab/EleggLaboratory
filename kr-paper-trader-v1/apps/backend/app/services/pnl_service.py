from app.services.portfolio import POSITIONS


def calculate_pnl_summary(fills: list[dict], quotes: dict[str, dict]):
    realized = 0.0
    fees = 0.0
    taxes = 0.0
    for f in fills:
        fees += float(f.get("fee", 0.0))
        taxes += float(f.get("tax", 0.0))

    for p in POSITIONS.values():
        realized += float(p.get("realized_pnl", 0.0))

    unrealized = 0.0
    for t, p in POSITIONS.items():
        qty = float(p.get("quantity", 0))
        avg = float(p.get("avg_price", 0.0))
        q = quotes.get(t)
        last = float(q.get("last", avg)) if q else avg
        unrealized += (last - avg) * qty

    net = realized + unrealized - fees - taxes
    return {
        "realized_pnl": round(realized, 2),
        "unrealized_pnl": round(unrealized, 2),
        "fees": round(fees, 2),
        "taxes": round(taxes, 2),
        "net_pnl": round(net, 2),
    }
