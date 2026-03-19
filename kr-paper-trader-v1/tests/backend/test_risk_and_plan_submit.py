import os
from pathlib import Path

os.environ["DATABASE_URL"] = "sqlite:///./test_risk_plan.db"
os.environ["TZ"] = "Asia/Seoul"

import sys
sys.path.append(str(Path(__file__).resolve().parents[2] / "apps/backend"))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def _token() -> str:
    return client.post('/api/auth/login', json={"username": "risk", "password": "pw"}).json()["access_token"]


def test_stale_quote_blocks_new_buy():
    token = _token()
    h = {"Authorization": f"Bearer {token}"}
    client.post('/api/sim/reset')
    client.post('/api/instruments/seed')
    client.post('/api/market/admin/session-state', json={"state":"open", "stale_quote_seconds": 0})
    client.post('/api/quotes', json={"ticker":"005930","last":70000,"bid1":69990,"ask1":70000})

    import time
    time.sleep(1)

    r = client.post('/api/orders', headers=h, json={
      "source":"manual","ticker":"005930","side":"buy","intent":"enter",
      "target_weight_pct":4,"order_type":"market","trigger_type":"none"
    })
    assert r.status_code == 400


def test_ai_plan_submit_rejects_risk_violation():
    r = client.post('/api/ai/plan/submit', json={
      "as_of_kst":"2026-03-19",
      "market_regime":"sideways",
      "trade_plan":[{"ticker":"005930","side":"buy","target_weight_pct":30}]
    })
    assert r.status_code == 200
    body = r.json()
    assert body["approval_status"] == "rejected"
    assert body["risk_valid"] is False


def test_ai_plan_submit_pending_when_valid():
    r = client.post('/api/ai/plan/submit', json={
      "as_of_kst":"2026-03-19",
      "market_regime":"sideways",
      "trade_plan":[{"ticker":"005930","side":"buy","target_weight_pct":10}]
    })
    assert r.status_code == 200
    assert r.json()["approval_status"] == "pending"
