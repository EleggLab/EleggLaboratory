import asyncio
from app.services.exit_engine import process_exit_rules
from app.services.state_store import save_state


async def run_worker_loop(stop_event: asyncio.Event):
    while not stop_event.is_set():
        process_exit_rules()
        save_state()
        await asyncio.sleep(1.0)
