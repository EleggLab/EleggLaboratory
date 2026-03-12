from __future__ import annotations

import sys
import tempfile
import time
from pathlib import Path
import unittest


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SRC_PATH = PROJECT_ROOT / "src"
if str(SRC_PATH) not in sys.path:
    sys.path.insert(0, str(SRC_PATH))

from crimson_wasteland.web_runtime import SessionRegistry  # noqa: E402


class WebRuntimeTests(unittest.TestCase):
    def _wait_until(self, predicate, timeout_seconds: float = 4.0, step: float = 0.02) -> bool:
        started = time.time()
        while time.time() - started < timeout_seconds:
            if predicate():
                return True
            time.sleep(step)
        return False

    def test_web_session_runs_to_completion_with_inputs(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            registry = SessionRegistry(project_root=Path(tmp))
            session = registry.create()
            inputs = ["1", "1", "1", "1", "Web", "F", "1", "8", "n"]

            for value in inputs:
                ready = self._wait_until(
                    lambda: bool(session.poll(0)["waiting_prompt"]) or session.poll(0)["finished"]
                )
                self.assertTrue(ready)
                snapshot = session.poll(0)
                self.assertFalse(snapshot["finished"])
                submit_result = session.submit_input(value)
                self.assertTrue(submit_result.accepted)

            finished = self._wait_until(lambda: session.poll(0)["finished"])
            self.assertTrue(finished)
            final_state = session.poll(0)
            self.assertEqual(final_state["return_code"], 0)
            self.assertFalse(final_state["error"])

            late_submit = session.submit_input("1")
            self.assertFalse(late_submit.accepted)
            self.assertEqual(late_submit.reason, "session_finished")


if __name__ == "__main__":
    unittest.main()
