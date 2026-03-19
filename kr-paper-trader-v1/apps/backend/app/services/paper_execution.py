from datetime import datetime
from zoneinfo import ZoneInfo
from app.services.market_data import get_quote
from app.services.portfolio import apply_fill

KST = ZoneInfo("Asia/Seoul")

ORDER_DB = {}
FILL_DB = []


def now_kst_iso() -> str:
    return datetime.now(KST).isoformat()


def _try_fill(order: dict):
    q = get_quote(order["ticker"])
    if not q:
        order["status"] = "working"
        return
    side = order["side"]
    px = q["ask1"] if side == "buy" else q["bid1"]
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

    req_qty = int(order.get("requested_qty") or 0)
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
        "fill_model": "quote_based",
        "filled_at": now_kst_iso(),
    }
    FILL_DB.append(fill)
    apply_fill(order["ticker"], side, fill_qty, float(px))

    order["remaining_qty"] = max(0, req_qty - fill_qty)
    if order["remaining_qty"] > 0:
        order["status"] = "partially_filled"
    else:
        order["status"] = "filled"


def create_order(payload: dict) -> dict:
    order_id = f"ord_{len(ORDER_DB)+1:06d}"
    req_qty = int(payload.get("requested_qty") or 0)
    row = {
        "id": order_id,
        "status": "queued",
        "created_at": now_kst_iso(),
        "remaining_qty": req_qty,
        **payload,
    }
    ORDER_DB[order_id] = row
    _try_fill(row)
    return row


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
