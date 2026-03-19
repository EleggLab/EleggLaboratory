import os
from pathlib import Path

os.environ["DATABASE_URL"] = "sqlite:///./test_boundary.db"
os.environ["TZ"] = "Asia/Seoul"
os.environ["ALLOW_INTERNAL_AI_GENERATE"] = "false"

import sys
sys.path.append(str(Path(__file__).resolve().parents[2] / "apps/backend"))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def _admin_token():
    return client.post('/api/auth/login', json={"username": "admin_ops", "password": "pw"}).json()["access_token"]


def _token():
    return client.post('/api/auth/login', json={"username": "boundary", "password": "pw"}).json()["access_token"]


def test_generate_disabled_in_ops_mode():
    r = client.post('/api/ai/plan/generate', json={})
    assert r.status_code == 403


def test_rejected_plan_cannot_be_approved():
    tk = _token()
    h = {"Authorization": f"Bearer {tk}"}
    client.post('/api/instruments/seed')
    client.post('/api/quotes', json={"ticker":"005930","last":70000,"bid1":69990,"ask1":70000})

    s = client.post('/api/ai/plan/submit', json={
      "as_of_kst":"2026-03-19",
      "market_regime":"sideways",
      "trade_plan":[{"ticker":"005930","side":"buy","target_weight_pct":40}]
    })
    assert s.status_code == 200
    plan_id = s.json()["id"]
    assert s.json()["approval_status"] == "rejected"

    a = client.post(f'/api/ai/plan/{plan_id}/approve', headers=h)
    assert a.status_code == 400
