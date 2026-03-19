import os
from pathlib import Path

os.environ["DATABASE_URL"] = "sqlite:///./test_gaps.db"
os.environ["TZ"] = "Asia/Seoul"
os.environ["ALLOW_INTERNAL_AI_GENERATE"] = "false"

import sys
sys.path.append(str(Path(__file__).resolve().parents[2] / "apps/backend"))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def _admin_headers():
    tk = client.post('/api/auth/login', json={"username": "admin_ops", "password": "pw"}).json()["access_token"]
    return {"Authorization": f"Bearer {tk}"}


def _trader_headers():
    tk = client.post('/api/auth/login', json={"username": "trader1", "password": "pw"}).json()["access_token"]
    return {"Authorization": f"Bearer {tk}"}


def _seed_open_with_quote(price=70000):
    client.post('/api/sim/reset')
    client.post('/api/instruments/seed')
    client.post('/api/market/admin/session-state', headers=_admin_headers(), json={"state": "open"})
    client.post('/api/quotes', json={"ticker": "005930", "last": price, "bid1": price-10, "ask1": price})


def test_halt_flag_blocks_order():
    _seed_open_with_quote()
    client.patch('/api/market/admin/instruments/005930/flags', headers=_admin_headers(), json={"warning_flags": {"halt": True}})
    r = client.post('/api/orders', headers=_trader_headers(), json={
        "source":"manual","ticker":"005930","side":"buy","intent":"enter",
        "target_weight_pct":3,"order_type":"market","trigger_type":"none"
    })
    assert r.status_code == 400


def test_stop_loss_triggers_auto_exit():
    _seed_open_with_quote(70000)
    client.post('/api/orders', headers=_trader_headers(), json={
        "source":"manual","ticker":"005930","side":"buy","intent":"enter",
        "target_weight_pct":3,"order_type":"market","trigger_type":"none","requested_qty":1,
        "exit_rules": {"stop_loss_pct": 1}
    })
    # 1% drop
    client.post('/api/quotes', json={"ticker": "005930", "last": 69200, "bid1": 69190, "ask1": 69200})
    rows = client.get('/api/orders').json()
    assert any(o.get('side') == 'sell' and o.get('intent') == 'exit' for o in rows)


def test_trailing_stop_triggers_on_pullback():
    _seed_open_with_quote(70000)
    client.post('/api/orders', headers=_trader_headers(), json={
        "source":"manual","ticker":"005930","side":"buy","intent":"enter",
        "target_weight_pct":3,"order_type":"market","trigger_type":"none","requested_qty":1,
        "exit_rules": {"trailing_stop_pct": 1}
    })
    # move up then pullback >1%
    client.post('/api/quotes', json={"ticker": "005930", "last": 72000, "bid1": 71990, "ask1": 72000})
    client.post('/api/quotes', json={"ticker": "005930", "last": 71200, "bid1": 71190, "ask1": 71200})
    rows = client.get('/api/orders').json()
    assert any(o.get('side') == 'sell' and o.get('intent') == 'exit' for o in rows)


def test_fee_tax_affect_cash_ledger():
    _seed_open_with_quote(70000)
    before = client.get('/api/cash-ledger').json()[-1]['balance_after']
    # buy then sell to incur fee+tax
    client.post('/api/orders', headers=_trader_headers(), json={
        "source":"manual","ticker":"005930","side":"buy","intent":"enter",
        "target_weight_pct":3,"order_type":"market","trigger_type":"none","requested_qty":1
    })
    client.post('/api/orders', headers=_trader_headers(), json={
        "source":"manual","ticker":"005930","side":"sell","intent":"exit",
        "target_weight_pct":0,"order_type":"market","trigger_type":"none","requested_qty":1
    })
    ledger = client.get('/api/cash-ledger').json()
    costs = [x for x in ledger if x.get('type') == 'cost']
    assert len(costs) >= 1
    after = ledger[-1]['balance_after']
    assert after <= before + 1000  # fees/taxes ensure no unrealistic positive jump
