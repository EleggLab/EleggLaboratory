import os
from pathlib import Path

os.environ["DATABASE_URL"] = "sqlite:///./test_auth.db"
os.environ["TZ"] = "Asia/Seoul"

import sys
sys.path.append(str(Path(__file__).resolve().parents[2] / "apps/backend"))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def _token() -> str:
    r = client.post('/api/auth/login', json={"username": "dev", "password": "pass1234"})
    assert r.status_code == 200
    return r.json()["access_token"]


def test_protected_order_requires_token():
    client.post('/api/instruments/seed')
    r = client.post('/api/orders', json={
        "source": "manual", "ticker": "005930", "side": "buy", "intent": "enter",
        "target_weight_pct": 5, "order_type": "market", "trigger_type": "none"
    })
    assert r.status_code == 401


def test_corporate_action_split_apply():
    tk = _token()
    h = {"Authorization": f"Bearer {tk}"}

    client.post('/api/sim/reset')
    client.post('/api/instruments/seed')
    client.post('/api/quotes', json={"ticker": "005930", "last": 70000, "bid1": 69990, "ask1": 70000})

    # create position
    r = client.post('/api/orders', headers=h, json={
        "source": "manual", "ticker": "005930", "side": "buy", "intent": "enter",
        "target_weight_pct": 5, "order_type": "market", "trigger_type": "none", "requested_qty": 2
    })
    assert r.status_code == 200

    # today split 2:1
    from datetime import datetime
    today = datetime.utcnow().strftime('%Y-%m-%d')
    r = client.post('/api/corporate-actions', headers=h, json={
        "ticker": "005930", "action_type": "split", "ex_date": today, "ratio": 2.0
    })
    assert r.status_code == 200

    r = client.post('/api/corporate-actions/apply-today', headers=h)
    assert r.status_code == 200
    assert r.json()["ok"] is True
