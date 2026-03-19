import os
from pathlib import Path

os.environ["DATABASE_URL"] = "sqlite:///./test_ai_plan.db"
os.environ["TZ"] = "Asia/Seoul"

import sys
sys.path.append(str(Path(__file__).resolve().parents[2] / "apps/backend"))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def _admin_token():
    return client.post('/api/auth/login', json={"username": "admin_ops", "password": "pw"}).json()["access_token"]


def _token() -> str:
    r = client.post('/api/auth/login', json={"username": "planner", "password": "pw1234"})
    return r.json()["access_token"]


def test_ai_plan_submit_and_approve_queues_orders():
    token = _token()
    h = {"Authorization": f"Bearer {token}"}
    client.post('/api/sim/reset')
    client.post('/api/instruments/seed')
    client.post('/api/market/admin/session-state', headers={"Authorization": f"Bearer {_admin_token()}"}, json={"state":"open"})
    client.post('/api/quotes', json={"ticker":"005930","last":70000,"bid1":69990,"ask1":70000})

    s = client.post('/api/ai/plan/submit', json={
        "as_of_kst": "2026-03-19",
        "market_regime": "sideways",
        "portfolio_targets": [{"ticker": "005930", "target_weight_pct": 5}],
        "trade_plan": [{"ticker": "005930", "side": "buy", "target_weight_pct": 5, "confidence": 0.9}],
    })
    assert s.status_code == 200
    plan_id = s.json()["id"]

    a = client.post(f'/api/ai/plan/{plan_id}/approve', headers=h)
    assert a.status_code == 200
    body = a.json()
    assert body["approval_status"] == "approved"
    assert "queued_orders" in body
