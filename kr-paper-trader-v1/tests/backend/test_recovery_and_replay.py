import os
from pathlib import Path

os.environ["DATABASE_URL"] = "sqlite:///./test_recovery.db"
os.environ["TZ"] = "Asia/Seoul"
os.environ["ALLOW_INTERNAL_AI_GENERATE"] = "false"

import sys
sys.path.append(str(Path(__file__).resolve().parents[2] / "apps/backend"))

from fastapi.testclient import TestClient
from app.main import app
from app.services.state_store import save_state, load_state
from app.services import paper_execution as ex
from app.api import routes as routes_module

client = TestClient(app)


def _token():
    return client.post('/api/auth/login', json={"username": "recovery", "password": "pw"}).json()["access_token"]


def test_replay_seed_is_deterministic():
    a = client.post('/api/sim/replay/start', json={"seed": 777}).json()
    b = client.post('/api/sim/replay/start', json={"seed": 777}).json()
    assert a["preview_path"] == b["preview_path"]


def test_state_snapshot_restores_orders_and_plans():
    tk = _token()
    h = {"Authorization": f"Bearer {tk}"}

    client.post('/api/sim/reset')
    client.post('/api/instruments/seed')
    client.post('/api/market/admin/session-state', json={"state":"open"})
    client.post('/api/quotes', json={"ticker":"005930","last":70000,"bid1":69990,"ask1":70000})

    client.post('/api/orders', headers=h, json={
      "source":"manual","ticker":"005930","side":"buy","intent":"enter",
      "target_weight_pct":5,"order_type":"market","trigger_type":"none","requested_qty":1
    })

    s = client.post('/api/ai/plan/submit', json={
      "as_of_kst":"2026-03-19",
      "market_regime":"sideways",
      "trade_plan":[{"ticker":"005930","side":"buy","target_weight_pct":5, "confidence": 0.9}]
    }).json()
    plan_id = s["id"]

    save_state({"ai_plans": routes_module.AI_PLANS})

    # clear in-memory then restore
    ex.ORDER_DB.clear()
    routes_module.AI_PLANS.clear()
    state = load_state()
    assert state is not None
    routes_module.AI_PLANS.update(state.get("ai_plans", {}))

    assert len(ex.ORDER_DB) >= 1
    assert plan_id in routes_module.AI_PLANS
