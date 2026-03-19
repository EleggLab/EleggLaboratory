import asyncio
from fastapi import WebSocket
from app.services.market_data import all_quotes
from app.services import paper_execution as ex
from app.services.portfolio import POSITIONS


class Hub:
    def __init__(self):
        self.quotes: set[WebSocket] = set()
        self.orders: set[WebSocket] = set()
        self.positions: set[WebSocket] = set()

    async def add(self, channel: str, ws: WebSocket):
        await ws.accept()
        getattr(self, channel).add(ws)

    def remove(self, channel: str, ws: WebSocket):
        getattr(self, channel).discard(ws)

    async def _broadcast(self, conns: set[WebSocket], payload: dict):
        dead = []
        for ws in list(conns):
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            conns.discard(ws)

    async def tick(self):
        await self._broadcast(self.quotes, {"type": "quotes", "data": all_quotes()})
        await self._broadcast(self.orders, {"type": "orders", "data": list(ex.ORDER_DB.values())})
        await self._broadcast(self.positions, {"type": "positions", "data": list(POSITIONS.values())})

hub = Hub()


async def run_broadcast_loop(stop_event: asyncio.Event):
    while not stop_event.is_set():
        await hub.tick()
        await asyncio.sleep(1.0)
