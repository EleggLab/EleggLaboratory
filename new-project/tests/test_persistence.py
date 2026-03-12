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

from crimson_wasteland.models import PlayerCharacter  # noqa: E402
from crimson_wasteland.persistence import save_character  # noqa: E402


class PersistenceTests(unittest.TestCase):
    def test_save_generates_unique_paths_for_rapid_calls(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            player = PlayerCharacter(name="Rhea")
            p1 = save_character(player, Path(tmp))
            p2 = save_character(player, Path(tmp))

            self.assertNotEqual(p1, p2)
            self.assertTrue(p1.exists())
            self.assertTrue(p2.exists())

    def test_save_sanitizes_name_and_falls_back_to_unnamed(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            player = PlayerCharacter(name="   ")
            path = save_character(player, Path(tmp))
            self.assertIn("unnamed_", path.name)

            payload = json.loads(path.read_text(encoding="utf-8"))
            self.assertEqual(payload["name"], "   ")

    def test_saved_payload_excludes_internal_survival_bounds(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            player = PlayerCharacter(name="tester")
            path = save_character(player, Path(tmp))
            payload = json.loads(path.read_text(encoding="utf-8"))
            self.assertIn("survival", payload)
            self.assertNotIn("bounds", payload["survival"])

    def test_saved_payload_includes_quest_log(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            player = PlayerCharacter(name="quester")
            player.start_quest(
                "save_test_quest",
                title="저장 테스트",
                stage="beta",
                objective="json 확인",
            )
            path = save_character(player, Path(tmp))
            payload = json.loads(path.read_text(encoding="utf-8"))
            self.assertIn("quest_log", payload)
            self.assertIn("save_test_quest", payload["quest_log"])

    def test_saved_payload_includes_growth_fields(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            player = PlayerCharacter(name="grower")
            player.add_xp(150)
            path = save_character(player, Path(tmp))
            payload = json.loads(path.read_text(encoding="utf-8"))
            self.assertIn("level", payload)
            self.assertIn("xp", payload)
            self.assertIn("perk_points", payload)


if __name__ == "__main__":
    unittest.main()
