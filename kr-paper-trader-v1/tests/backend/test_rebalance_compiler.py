import os
from pathlib import Path

os.environ["DATABASE_URL"] = "sqlite:///./test_compiler.db"
os.environ["TZ"] = "Asia/Seoul"
os.environ["ALLOW_INTERNAL_AI_GENERATE"] = "false"

import sys
sys.path.append(str(Path(__file__).resolve().parents[2] / "apps/backend"))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def _token():
    return client.post('/api/auth/login', json={"username": "compiler", "password": "pw"}).json()["access_token"]


def test_compile_target_weight_generates_orders():
    tk = _token()
    h = {"Authorization": f"Bearer {tk}"}
    client.post('/api/sim/reset')
    client.post('/api/instruments/seed')
    client.post('/api/market/admin/session-state', json={"state":"open"})
    client.post('/api/quotes', json={"ticker":"005930","last":70000,"bid1":69990,"ask1":70000})

    r = client.post('/api/orders/compile', headers=h, json={
      "targets": [{"ticker":"005930", "target_weight_pct": 10}],
      "reserve_cash_pct": 20
    })
    assert r.status_code == 200
    body = r.json()
    assert body["summary"]["generated_orders"] >= 1
    assert body["orders"][0]["target_weight_pct"] == 10


def test_compile_and_queue_executes_compiled_orders():
    tk = _token()
    h = {"Authorization": f"Bearer {tk}"}
    client.post('/api/sim/reset')
    client.post('/api/instruments/seed')
    client.post('/api/market/admin/session-state', json={"state":"open"})
    client.post('/api/quotes', json={"ticker":"005930","last":70000,"bid1":69990,"ask1":70000})

    r = client.post('/api/orders/compile-and-queue', headers=h, json={
      "targets": [{"ticker":"005930", "target_weight_pct": 10}],
      "source": "manual"
    })
    assert r.status_code == 200
    assert len(r.json()["queued"]) >= 1
