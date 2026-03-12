from __future__ import annotations

import json
import sys
import tempfile
from pathlib import Path
import unittest


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SRC_PATH = PROJECT_ROOT / "src"
if str(SRC_PATH) not in sys.path:
    sys.path.insert(0, str(SRC_PATH))

from crimson_wasteland.gameplay import SurvivalLoop  # noqa: E402
from crimson_wasteland.models import PlayerCharacter  # noqa: E402
from crimson_wasteland.state_bridge import LiveStateBridge  # noqa: E402


class _FakeIO:
    def __init__(self, inputs: list[str]) -> None:
        self.inputs = inputs
        self.index = 0
        self.outputs: list[str] = []

    def input(self, prompt: str) -> str:
        if self.index >= len(self.inputs):
            raise AssertionError(f"입력 부족: {prompt}")
        value = self.inputs[self.index]
        self.index += 1
        return value

    def output(self, text: str) -> None:
        self.outputs.append(text)


class LiveStateBridgeTests(unittest.TestCase):
    def test_publish_creates_live_state_json(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            player = PlayerCharacter(name="Watcher")
            bridge = LiveStateBridge(root)

            bridge.publish(
                player,
                day=3,
                ap=4,
                max_ap=6,
                balance_profile_key="standard",
                balance_profile_label="스탠다드",
                phase="turn_end",
            )

            path = root / "ui" / "state" / "live_state.json"
            self.assertTrue(path.exists())
            payload = json.loads(path.read_text(encoding="utf-8"))
            self.assertEqual(payload["meta"]["phase"], "turn_end")
            self.assertEqual(payload["meta"]["day"], 3)
            self.assertEqual(payload["meta"]["ap"], 4)
            self.assertEqual(payload["player"]["name"], "Watcher")

    def test_survival_loop_updates_live_state_phase(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            io = _FakeIO(["8"])
            player = PlayerCharacter(name="Runner")
            bridge = LiveStateBridge(root)
            loop = SurvivalLoop(
                player=player,
                input_fn=io.input,
                output_fn=io.output,
                live_state_bridge=bridge,
            )

            loop.run()

            path = root / "ui" / "state" / "live_state.json"
            payload = json.loads(path.read_text(encoding="utf-8"))
            self.assertEqual(payload["meta"]["phase"], "survival_loop_exit")
            self.assertEqual(payload["meta"]["day"], 1)
            self.assertEqual(payload["meta"]["ap"], 6)
            self.assertEqual(payload["player"]["name"], "Runner")

    def test_publish_swallows_write_failures(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            invalid_target = root / "ui" / "state" / "live_state.json"
            invalid_target.mkdir(parents=True, exist_ok=True)
            player = PlayerCharacter(name="Safe")
            bridge = LiveStateBridge(root)

            bridge.publish(player, phase="should_not_raise")

            # If the method reaches here without raising, error handling works.
            self.assertTrue(invalid_target.is_dir())


if __name__ == "__main__":
    unittest.main()
