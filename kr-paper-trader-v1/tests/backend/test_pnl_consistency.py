import os
from pathlib import Path

os.environ["DATABASE_URL"] = "sqlite:///./test_pnl.db"
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
    tk = client.post('/api/auth/login', json={"username": "pnl_user", "password": "pw"}).json()["access_token"]
    return {"Authorization": f"Bearer {tk}"}


def test_fee_tax_and_pnl_consistency_smoke():
    client.post('/api/sim/reset')
    client.post('/api/instruments/seed')
    client.post('/api/market/admin/session-state', headers=_admin_headers(), json={"state":"open"})

    # buy at 70,000
    client.post('/api/quotes', json={"ticker":"005930","last":70000,"bid1":69990,"ask1":70000})
    client.post('/api/orders', headers=_trader_headers(), json={
        "source":"manual","ticker":"005930","side":"buy","intent":"enter",
        "target_weight_pct":3,"order_type":"market","trigger_type":"none","requested_qty":1
    })

    # sell at 71,000
    client.post('/api/quotes', json={"ticker":"005930","last":71000,"bid1":71000,"ask1":71010})
    client.post('/api/orders', headers=_trader_headers(), json={
        "source":"manual","ticker":"005930","side":"sell","intent":"exit",
        "target_weight_pct":0,"order_type":"market","trigger_type":"none","requested_qty":1
    })

    pnl = client.get('/api/pnl').json()
    assert pnl["fees"] >= 0
    assert pnl["taxes"] >= 0

    # Net should not exceed gross realized move (1,000 KRW) by unrealistic margin
    assert pnl["net_pnl"] <= 1000
