import asyncio
from app.services.exit_engine import process_exit_rules
from app.services.state_store import save_state
from app.services import paper_execution as ex


async def run_worker_loop(stop_event: asyncio.Event):
    while not stop_event.is_set():
        ex.process_working_orders()
        process_exit_rules()
        save_state()
        await asyncio.sleep(1.0)
