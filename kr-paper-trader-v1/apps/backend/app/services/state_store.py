import json
from pathlib import Path
from app.services import paper_execution as ex
from app.services.portfolio import POSITIONS, CASH_LEDGER
from app.services.market_data import QUOTE_DB

STATE_PATH = Path("/app/runtime/state.json")


def save_state() -> None:
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "orders": ex.ORDER_DB,
        "fills": ex.FILL_DB,
        "positions": POSITIONS,
        "cash_ledger": CASH_LEDGER,
        "quotes": QUOTE_DB,
    }
    STATE_PATH.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")


def load_state() -> bool:
    if not STATE_PATH.exists():
        return False
    data = json.loads(STATE_PATH.read_text(encoding="utf-8"))
    ex.ORDER_DB.clear(); ex.ORDER_DB.update(data.get("orders", {}))
    ex.FILL_DB.clear(); ex.FILL_DB.extend(data.get("fills", []))
    POSITIONS.clear(); POSITIONS.update(data.get("positions", {}))
    CASH_LEDGER.clear(); CASH_LEDGER.extend(data.get("cash_ledger", []))
    QUOTE_DB.clear(); QUOTE_DB.update(data.get("quotes", {}))
    return True
