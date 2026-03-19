import os
from pathlib import Path

os.environ["DATABASE_URL"] = "sqlite:///./test_phase.db"
os.environ["TZ"] = "Asia/Seoul"

import sys
sys.path.append(str(Path(__file__).resolve().parents[2] / "apps/backend"))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_limit_buy_waits_until_price_reached():
    client.post('/api/sim/reset')
    client.post('/api/instruments/seed')
    r = client.post('/api/orders', json={
        "source":"manual","ticker":"005930","side":"buy","intent":"enter",
        "target_weight_pct":10,"order_type":"limit","order_price":70000,
        "trigger_type":"none","requested_qty":2
    })
    assert r.status_code == 200
    # no quote yet => working/queued
    rows = client.get('/api/orders').json()
    assert rows[0]['status'] in ('queued','working')

    client.post('/api/quotes', json={"ticker":"005930","last":69900,"bid1":69890,"ask1":69900})
    rows = client.get('/api/orders').json()
    assert rows[0]['status'] in ('partially_filled','filled')


def test_banned_ticker_blocked():
    client.post('/api/instruments/seed')
    client.patch('/api/risk/banned-tickers', json={"banned_tickers":["000660"]})
    r = client.post('/api/orders', json={
        "source":"manual","ticker":"000660","side":"buy","intent":"enter",
        "target_weight_pct":5,"order_type":"market","trigger_type":"none"
    })
    assert r.status_code == 400


def test_split_order_creates_tranches():
    client.post('/api/sim/reset')
    client.post('/api/instruments/seed')
    client.post('/api/quotes', json={"ticker":"005930","last":71000,"bid1":70990,"ask1":71000})
    r = client.post('/api/orders', json={
        "source":"manual","ticker":"005930","side":"buy","intent":"enter",
        "target_weight_pct":12,"order_type":"market","trigger_type":"none",
        "requested_qty":6,"split_count":3
    })
    assert r.status_code == 200
    body = r.json()
    assert "split" in body and len(body["split"]) == 3


def test_warning_flag_blocks_order():
    client.post('/api/sim/reset')
    client.post('/api/instruments/seed')
    client.post('/api/quotes', json={"ticker":"005930","last":71000,"bid1":70990,"ask1":71000})
    client.patch('/api/market/admin/instruments/005930/flags', json={"warning_flags": {"warning": True}})
    r = client.post('/api/orders', json={
        "source":"manual","ticker":"005930","side":"buy","intent":"enter",
        "target_weight_pct":5,"order_type":"market","trigger_type":"none"
    })
    assert r.status_code == 400


def test_duplicate_live_order_rejected():
    client.post('/api/sim/reset')
    client.post('/api/instruments/seed')
    # no quote -> first order stays queued/working
    r1 = client.post('/api/orders', json={
        "source":"manual","ticker":"035420","side":"buy","intent":"enter",
        "target_weight_pct":5,"order_type":"limit","order_price":1000,"trigger_type":"none"
    })
    assert r1.status_code == 200
    r2 = client.post('/api/orders', json={
        "source":"manual","ticker":"035420","side":"buy","intent":"enter",
        "target_weight_pct":3,"order_type":"limit","order_price":900,"trigger_type":"none"
    })
    assert r2.status_code == 400
