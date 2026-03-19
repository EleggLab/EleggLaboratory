from datetime import datetime
from zoneinfo import ZoneInfo

KST = ZoneInfo("Asia/Seoul")

ORDER_DB = {}
FILL_DB = []


def now_kst_iso() -> str:
    return datetime.now(KST).isoformat()


def create_order(payload: dict) -> dict:
    order_id = f"ord_{len(ORDER_DB)+1:06d}"
    row = {
        "id": order_id,
        "status": "queued",
        "created_at": now_kst_iso(),
        **payload,
    }
    ORDER_DB[order_id] = row
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
    return row
