from datetime import datetime
from zoneinfo import ZoneInfo
from app.services.market_data import get_quote
from app.services.portfolio import apply_fill, append_cash
from app.services.exit_engine import register_exit_rules
from app.services.session_service import infer_market_state

KST = ZoneInfo("Asia/Seoul")

ORDER_DB = {}
FILL_DB = []


def now_kst_iso() -> str:
    return datetime.now(KST).isoformat()


def _trigger_ready(order: dict, px: float) -> bool:
    tt = order.get("trigger_type", "none")
    tp = order.get("trigger_price")
    side = order.get("side")
    mstate = infer_market_state()

    if tt in ("none", "limit_now"):
        return mstate == "open"
    if tt == "market_open":
        return mstate == "open"
    if tp is None:
        return False
    if tt == "price_below":
        return px <= float(tp)
    if tt == "price_above":
        return px >= float(tp)
    return False


def _try_fill(order: dict):
    q = get_quote(order["ticker"])
    if not q:
        order["status"] = "working"
        return
    side = order["side"]
    has_quote_book = q.get("bid1") is not None and q.get("ask1") is not None
    px = q["ask1"] if side == "buy" else q["bid1"]
    if px is None:
        px = q["last"]

    if not _trigger_ready(order, float(px)):
        order["status"] = "working"
        return

    order_price = order.get("order_price")
    order_type = order.get("order_type", "market")

    can_fill = False
    if order_type == "market":
        can_fill = True
    elif side == "buy" and order_price is not None and px <= order_price:
        can_fill = True
    elif side == "sell" and order_price is not None and px >= order_price:
        can_fill = True

    if not can_fill:
        order["status"] = "working"
        return

    req_qty = int(order.get("remaining_qty") or order.get("requested_qty") or 0)
    if req_qty <= 0:
        req_qty = 1
    fill_qty = max(1, req_qty // 2) if req_qty > 1 else 1  # conservative partial

    fill = {
        "order_id": order["id"],
        "fill_qty": fill_qty,
        "fill_price": float(px),
        "fee": float(px) * fill_qty * 0.00015,
        "tax": float(px) * fill_qty * (0.0018 if side == "sell" else 0.0),
        "slippage": 0.0,
        "fill_model": "quote_based" if has_quote_book else "bar_conservative",
        "filled_at": now_kst_iso(),
    }
    FILL_DB.append(fill)
    apply_fill(order["ticker"], side, fill_qty, float(px))
    # account for fee/tax explicitly in ledger
    total_costs = float(fill["fee"]) + float(fill["tax"])
    if total_costs > 0:
        append_cash("cost", -total_costs, f"fees/tax {order['id']}")

    if side == "buy" and order.get("exit_rules"):
        register_exit_rules(order["ticker"], side, float(px), fill_qty, order.get("exit_rules"))

    order["remaining_qty"] = max(0, req_qty - fill_qty)
    if order["remaining_qty"] > 0:
        order["status"] = "partially_filled"
    else:
        order["status"] = "filled"


def process_working_orders():
    for order in ORDER_DB.values():
        if order.get("status") in ("queued", "working", "partially_filled"):
            _try_fill(order)


def create_order(payload: dict):
    split_count = int(payload.get("split_count") or 1)
    split_count = max(1, split_count)
    created = []

    total_qty = int(payload.get("requested_qty") or 0)
    tranche_qty = max(1, total_qty // split_count) if total_qty > 0 else 1

    for i in range(split_count):
        order_id = f"ord_{len(ORDER_DB)+1:06d}"
        row = {
            "id": order_id,
            "status": "queued",
            "created_at": now_kst_iso(),
            "remaining_qty": tranche_qty,
            **payload,
            "requested_qty": tranche_qty,
            "tranche_index": i + 1,
            "tranche_total": split_count,
        }
        ORDER_DB[order_id] = row
        _try_fill(row)
        created.append(row)

    return created[0] if split_count == 1 else {"split": created}


def cancel_order(order_id: str) -> dict:
    row = ORDER_DB.get(order_id)
    if not row:
        return {"error": "not found"}
    row["status"] = "cancelled"
    row["cancelled_at"] = now_kst_iso()
    return row


def replace_order(order_id: str, payload: dict) -> dict:
    row = ORDER_DB.get(order_id)
    if not row:
        return {"error": "not found"}
    row.update(payload)
    row["status"] = "working"
    _try_fill(row)
    return row
