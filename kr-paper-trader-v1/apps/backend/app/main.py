import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from app.api.routes import router
from app.core.db import Base, engine
from app import models  # noqa: F401
from app.services.state_store import load_state, save_state
from app.services.ws_hub import hub, run_broadcast_loop

app = FastAPI(title="KR Paper Trader v1", version="0.3.0")
app.include_router(router)

_stop_event = asyncio.Event()
_broadcast_task: asyncio.Task | None = None


@app.on_event("startup")
async def on_startup():
    global _broadcast_task
    Base.metadata.create_all(bind=engine)
    load_state()
    _broadcast_task = asyncio.create_task(run_broadcast_loop(_stop_event))


@app.on_event("shutdown")
async def on_shutdown():
    _stop_event.set()
    if _broadcast_task:
        _broadcast_task.cancel()
    save_state()


@app.websocket("/ws/quotes")
async def ws_quotes(ws: WebSocket):
    await hub.add("quotes", ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        hub.remove("quotes", ws)


@app.websocket("/ws/orders")
async def ws_orders(ws: WebSocket):
    await hub.add("orders", ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        hub.remove("orders", ws)


@app.websocket("/ws/positions")
async def ws_positions(ws: WebSocket):
    await hub.add("positions", ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        hub.remove("positions", ws)


@app.get("/health")
def health():
    return {"ok": True, "service": "backend"}
