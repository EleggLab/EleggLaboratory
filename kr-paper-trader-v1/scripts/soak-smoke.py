#!/usr/bin/env python3
"""Lightweight soak smoke for worker/order/quote loop.
Runs in-process without external services.
"""
import os
import time
from pathlib import Path

os.environ.setdefault("DATABASE_URL", "sqlite:///./soak.db")
os.environ.setdefault("TZ", "Asia/Seoul")
os.environ.setdefault("ALLOW_INTERNAL_AI_GENERATE", "false")

import sys
sys.path.append(str(Path(__file__).resolve().parents[1] / "apps/backend"))


def main():
    try:
        from fastapi.testclient import TestClient
        from app.main import app
    except Exception as e:
        print({"error": "fastapi test deps not installed", "detail": str(e)})
        return

    c = TestClient(app)
    tk = c.post('/api/auth/login', json={"username": "soak", "password": "pw"}).json()["access_token"]
    h = {"Authorization": f"Bearer {tk}"}

    c.post('/api/sim/reset')
    c.post('/api/instruments/seed')
    c.post('/api/market/admin/session-state', json={"state": "open"})

    start = time.time()
    n = 0
    while time.time() - start < 15:  # 15s smoke, can increase in CI/nightly
        p = 70000 + (n % 10) * 10
        c.post('/api/quotes', json={"ticker":"005930","last":p,"bid1":p-5,"ask1":p})
        if n % 3 == 0:
            c.post('/api/orders', headers=h, json={
                "source":"manual","ticker":"005930","side":"buy","intent":"enter",
                "target_weight_pct":3,"order_type":"market","trigger_type":"none","requested_qty":1
            })
        n += 1
        time.sleep(0.2)

    orders = c.get('/api/orders').json()
    fills = c.get('/api/fills').json()
    dash = c.get('/api/dashboard').json()

    print({
        "orders": len(orders),
        "fills": len(fills),
        "total_asset": dash.get("total_asset"),
        "cash_weight_pct": dash.get("cash_weight_pct"),
        "duration_sec": round(time.time() - start, 2),
    })


if __name__ == "__main__":
    main()
