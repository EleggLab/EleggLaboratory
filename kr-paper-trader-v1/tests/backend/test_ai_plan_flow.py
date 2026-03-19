import os
from pathlib import Path

os.environ["DATABASE_URL"] = "sqlite:///./test_ai_plan.db"
os.environ["TZ"] = "Asia/Seoul"

import sys
sys.path.append(str(Path(__file__).resolve().parents[2] / "apps/backend"))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def _token() -> str:
    r = client.post('/api/auth/login', json={"username": "planner", "password": "pw1234"})
    return r.json()["access_token"]


def test_ai_plan_generate_and_approve_queues_orders():
    token = _token()
    h = {"Authorization": f"Bearer {token}"}
    client.post('/api/instruments/seed')
    client.post('/api/quotes', json={"ticker":"005930","last":70000,"bid1":69990,"ask1":70000})

    g = client.post('/api/ai/plan/generate', json={})
    assert g.status_code == 200
    plan_id = g.json()["id"]

    a = client.post(f'/api/ai/plan/{plan_id}/approve', headers=h)
    assert a.status_code == 200
    body = a.json()
    assert body["approval_status"] == "approved"
    assert "queued_orders" in body
