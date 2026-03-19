from datetime import datetime, timezone
from app.services.market_data import get_quote
from app.services import paper_execution as ex

ACTIVE_EXIT_RULES: dict[str, dict] = {}


def register_exit_rules(ticker: str, side: str, entry_price: float, qty: int, rules: dict | None):
    if not rules or side != "buy" or qty <= 0:
        return
    ACTIVE_EXIT_RULES[ticker] = {
        "entry_price": entry_price,
        "qty": qty,
        "take_profit_pct": rules.get("take_profit_pct"),
        "stop_loss_pct": rules.get("stop_loss_pct"),
        "trailing_stop_pct": rules.get("trailing_stop_pct"),
        "time_stop_days": rules.get("time_stop_days"),
        "armed_at": datetime.now(timezone.utc).isoformat(),
        "peak_price": entry_price,
    }


def process_exit_rules() -> list[dict]:
    triggered = []
    for ticker, r in list(ACTIVE_EXIT_RULES.items()):
        q = get_quote(ticker)
        if not q:
            continue
        last = float(q["last"])
        r["peak_price"] = max(r["peak_price"], last)

        tp = r.get("take_profit_pct")
        sl = r.get("stop_loss_pct")
        tr = r.get("trailing_stop_pct")
        tsd = r.get("time_stop_days")

        do_exit = False
        reason = None

        if tp is not None and last >= r["entry_price"] * (1 + float(tp) / 100):
            do_exit = True
            reason = "take_profit"
        if sl is not None and last <= r["entry_price"] * (1 - float(sl) / 100):
            do_exit = True
            reason = reason or "stop_loss"
        if tr is not None and last <= r["peak_price"] * (1 - float(tr) / 100):
            do_exit = True
            reason = reason or "trailing_stop"

        if tsd is not None:
            armed_at = datetime.fromisoformat(r["armed_at"])
            held_days = (datetime.now(timezone.utc) - armed_at).total_seconds() / 86400
            if held_days >= float(tsd):
                do_exit = True
                reason = reason or "time_stop"

        if do_exit:
            payload = {
                "source": "system",
                "ticker": ticker,
                "side": "sell",
                "intent": "exit",
                "target_weight_pct": 0,
                "trigger_type": "none",
                "order_type": "market",
                "requested_qty": int(r["qty"]),
                "metadata": {"auto_exit_reason": reason},
            }
            out = ex.create_order(payload)
            triggered.append({"ticker": ticker, "reason": reason, "order": out})
            ACTIVE_EXIT_RULES.pop(ticker, None)
    return triggered
