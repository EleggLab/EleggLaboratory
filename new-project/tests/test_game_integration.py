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

from crimson_wasteland.game import Game  # noqa: E402


class _FakeIO:
    def __init__(self, inputs: list[str]) -> None:
        self._inputs = inputs
        self._index = 0
        self.outputs: list[str] = []

    def input(self, prompt: str) -> str:
        if self._index >= len(self._inputs):
            raise AssertionError(f"입력이 부족합니다. 마지막 프롬프트: {prompt}")
        value = self._inputs[self._index]
        self._index += 1
        return value

    def output(self, text: str) -> None:
        self.outputs.append(text)


class GameIntegrationTests(unittest.TestCase):
    def test_full_run_with_save_creates_json(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            fake = _FakeIO(
                [
                    "3",  # opening
                    "2",  # betrayal bonus
                    "1",  # childhood
                    "3",  # style
                    "2",  # scars
                    "Rhea",
                    "F",
                    "1",  # appearance preset
                    "8",  # quit survival loop
                    "y",  # save
                ]
            )
            game = Game(
                project_root=Path(tmp),
                input_fn=fake.input,
                output_fn=fake.output,
            )

            result = game.run()
            self.assertEqual(result, 0)

            saves_dir = Path(tmp) / "saves"
            files = list(saves_dir.glob("*.json"))
            self.assertEqual(len(files), 1)

            payload = json.loads(files[0].read_text(encoding="utf-8"))
            self.assertEqual(payload["name"], "Rhea")
            self.assertIn("inventory", payload)
            self.assertGreaterEqual(len(payload["inventory"]), 1)

    def test_invalid_choice_is_reprompted(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            fake = _FakeIO(
                [
                    "10",  # invalid opening
                    "1",   # valid opening
                    "1",   # childhood
                    "1",   # style
                    "1",   # scars
                    "Nox",
                    "M",
                    "2",   # appearance
                    "8",   # quit survival loop
                    "n",   # do not save
                ]
            )
            game = Game(
                project_root=Path(tmp),
                input_fn=fake.input,
                output_fn=fake.output,
            )
            result = game.run()
            self.assertEqual(result, 0)

            joined = "\n".join(fake.outputs)
            self.assertIn("유효한 선택지를 입력하세요: 1, 2, 3", joined)

    def test_appearance_custom_text_path(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            fake = _FakeIO(
                [
                    "2",       # opening
                    "2",       # childhood
                    "2",       # style
                    "3",       # scars
                    "Mira",
                    "F",
                    "4",       # custom appearance
                    "old world mechanic with a scar",
                    "8",       # quit survival loop
                    "n",
                ]
            )
            game = Game(
                project_root=Path(tmp),
                input_fn=fake.input,
                output_fn=fake.output,
            )
            result = game.run()
            self.assertEqual(result, 0)

            joined = "\n".join(fake.outputs)
            self.assertIn("old world mechanic with a scar", joined)

    def test_bom_prefixed_choice_is_accepted(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            fake = _FakeIO(
                [
                    "\ufeff1",  # opening with BOM prefix
                    "1",
                    "1",
                    "1",
                    "Ion",
                    "X",
                    "1",
                    "8",
                    "n",
                ]
            )
            game = Game(
                project_root=Path(tmp),
                input_fn=fake.input,
                output_fn=fake.output,
            )
            result = game.run()
            self.assertEqual(result, 0)

    def test_run_writes_live_state_payload(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            fake = _FakeIO(
                [
                    "1",
                    "1",
                    "1",
                    "1",
                    "Iris",
                    "F",
                    "2",
                    "8",
                    "n",
                ]
            )
            game = Game(
                project_root=Path(tmp),
                input_fn=fake.input,
                output_fn=fake.output,
            )
            result = game.run()
            self.assertEqual(result, 0)

            live_path = Path(tmp) / "ui" / "state" / "live_state.json"
            self.assertTrue(live_path.exists())
            payload = json.loads(live_path.read_text(encoding="utf-8"))
            self.assertIn("meta", payload)
            self.assertIn("player", payload)
            self.assertEqual(payload["meta"]["phase"], "session_finished")
            self.assertEqual(payload["player"]["name"], "Iris")

    def test_interrupted_input_exits_gracefully_with_emergency_save(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            values = iter(["1", "1"])
            outputs: list[str] = []

            def eof_input(_: str) -> str:
                try:
                    return next(values)
                except StopIteration:
                    raise EOFError

            def collect(text: str) -> None:
                outputs.append(text)

            game = Game(
                project_root=Path(tmp),
                input_fn=eof_input,
                output_fn=collect,
            )
            result = game.run()
            self.assertEqual(result, 0)

            joined = "\n".join(outputs)
            self.assertIn("입력이 중단되어 세션을 안전 종료합니다.", joined)
            self.assertIn("긴급 저장 완료:", joined)

            saves_dir = Path(tmp) / "saves"
            files = list(saves_dir.glob("*.json"))
            self.assertGreaterEqual(len(files), 1)


if __name__ == "__main__":
    unittest.main()
