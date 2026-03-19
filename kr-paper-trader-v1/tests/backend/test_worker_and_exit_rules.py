import os
from pathlib import Path

os.environ["DATABASE_URL"] = "sqlite:///./test_worker.db"
os.environ["TZ"] = "Asia/Seoul"

import sys
sys.path.append(str(Path(__file__).resolve().parents[2] / "apps/backend"))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def _admin_token():
    return client.post('/api/auth/login', json={"username": "admin_ops", "password": "pw"}).json()["access_token"]


def _token():
    return client.post('/api/auth/login', json={"username": "worker", "password": "pw"}).json()["access_token"]


def test_market_open_trigger_waits_until_open():
    tk = _token()
    h = {"Authorization": f"Bearer {tk}"}
    client.post('/api/sim/reset')
    client.post('/api/instruments/seed')
    client.post('/api/market/admin/session-state', headers={"Authorization": f"Bearer {_admin_token()}"}, json={"state":"closed"})
    client.post('/api/quotes', json={"ticker":"005930","last":70000,"bid1":69990,"ask1":70000})

    r = client.post('/api/orders', headers=h, json={
      "source":"manual","ticker":"005930","side":"buy","intent":"enter",
      "target_weight_pct":5,"order_type":"market","trigger_type":"market_open","requested_qty":1
    })
    assert r.status_code == 200

    rows = client.get('/api/orders').json()
    assert rows[-1]['status'] in ('queued','working')

    client.post('/api/market/admin/session-state', headers={"Authorization": f"Bearer {_admin_token()}"}, json={"state":"open"})
    client.post('/api/quotes', json={"ticker":"005930","last":70000,"bid1":69990,"ask1":70000})
    rows = client.get('/api/orders').json()
    assert rows[-1]['status'] in ('partially_filled','filled')


def test_exit_rule_take_profit_auto_exit_order_created():
    tk = _token()
    h = {"Authorization": f"Bearer {tk}"}
    client.post('/api/sim/reset')
    client.post('/api/instruments/seed')
    client.post('/api/market/admin/session-state', headers={"Authorization": f"Bearer {_admin_token()}"}, json={"state":"open"})

    client.post('/api/quotes', json={"ticker":"000660","last":120000,"bid1":119990,"ask1":120000})
    r = client.post('/api/orders', headers=h, json={
      "source":"manual","ticker":"000660","side":"buy","intent":"enter",
      "target_weight_pct":5,"order_type":"market","trigger_type":"none","requested_qty":1,
      "exit_rules": {"take_profit_pct": 1}
    })
    assert r.status_code == 200

    # raise quote to trigger take profit
    client.post('/api/quotes', json={"ticker":"000660","last":121500,"bid1":121490,"ask1":121500})
    rows = client.get('/api/orders').json()
    # should contain at least one auto-generated sell order
    assert any(o.get('side') == 'sell' and o.get('intent') == 'exit' for o in rows)
