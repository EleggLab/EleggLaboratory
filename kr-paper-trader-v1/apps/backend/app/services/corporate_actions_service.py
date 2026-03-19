from datetime import datetime
from app.models.entities import CorporateAction


def apply_actions_for_today(db, positions: dict[str, dict], today: str | None = None):
    if not today:
        today = datetime.utcnow().strftime('%Y-%m-%d')
    rows = db.query(CorporateAction).filter(CorporateAction.ex_date == today).all()
    applied = []
    for r in rows:
        p = positions.get(r.ticker)
        if not p:
            continue
        if r.action_type == "split" and r.ratio and r.ratio > 0:
            old_qty = p["quantity"]
            old_avg = p["avg_price"]
            p["quantity"] = int(old_qty * r.ratio)
            p["avg_price"] = float(old_avg / r.ratio)
            applied.append({"ticker": r.ticker, "type": "split", "ratio": r.ratio})
        elif r.action_type == "cash_dividend" and r.cash_amount:
            # cash credit logic can be connected to cash ledger in next step
            applied.append({"ticker": r.ticker, "type": "cash_dividend", "cash_amount": r.cash_amount})
    return applied
