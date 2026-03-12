from __future__ import annotations

import sys
from pathlib import Path
import unittest


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SRC_PATH = PROJECT_ROOT / "src"
if str(SRC_PATH) not in sys.path:
    sys.path.insert(0, str(SRC_PATH))

from crimson_wasteland.character_creation import (  # noqa: E402
    all_creation_scenes,
    apply_betrayal_bonus,
    apply_effect,
    assign_starting_loadout,
    get_option,
)
from crimson_wasteland.models import PlayerCharacter  # noqa: E402


class ExhaustiveCreationTests(unittest.TestCase):
    def test_all_choice_combinations_keep_stats_in_bounds(self) -> None:
        scenes = {scene.scene_id: scene for scene in all_creation_scenes()}
        opening_options = ("1", "2", "3")
        childhood_options = ("1", "2", "3")
        style_options = ("1", "2", "3")
        scar_options = ("1", "2", "3")

        total_cases = 0
        for opening in opening_options:
            betrayal_opts = ("1", "2") if opening == "3" else (None,)
            for betrayal in betrayal_opts:
                for childhood in childhood_options:
                    for style in style_options:
                        for scar in scar_options:
                            total_cases += 1
                            player = PlayerCharacter()

                            player.set_creation_choice("opening_caravan", opening)
                            apply_effect(
                                player,
                                get_option(scenes["opening_caravan"], opening).effect,
                            )
                            if betrayal is not None:
                                apply_betrayal_bonus(player, betrayal)

                            player.set_creation_choice("memory_childhood", childhood)
                            apply_effect(
                                player,
                                get_option(scenes["memory_childhood"], childhood).effect,
                            )

                            player.set_creation_choice("memory_survival_style", style)
                            apply_effect(
                                player,
                                get_option(
                                    scenes["memory_survival_style"],
                                    style,
                                ).effect,
                            )

                            player.set_creation_choice("memory_scars", scar)
                            apply_effect(
                                player,
                                get_option(scenes["memory_scars"], scar).effect,
                            )

                            items = assign_starting_loadout(player)

                            self.assertGreaterEqual(player.core.strength, 1)
                            self.assertLessEqual(player.core.strength, 10)
                            self.assertGreaterEqual(player.core.perception, 1)
                            self.assertLessEqual(player.core.perception, 10)
                            self.assertGreaterEqual(player.core.endurance, 1)
                            self.assertLessEqual(player.core.endurance, 10)
                            self.assertGreaterEqual(player.core.charisma, 1)
                            self.assertLessEqual(player.core.charisma, 10)
                            self.assertGreaterEqual(player.core.intelligence, 1)
                            self.assertLessEqual(player.core.intelligence, 10)
                            self.assertGreaterEqual(player.core.agility, 1)
                            self.assertLessEqual(player.core.agility, 10)
                            self.assertGreaterEqual(player.core.luck, 1)
                            self.assertLessEqual(player.core.luck, 10)

                            self.assertGreaterEqual(player.survival.humanity, 0)
                            self.assertLessEqual(player.survival.humanity, 100)
                            self.assertGreaterEqual(
                                player.survival.radiation_resistance, -100
                            )
                            self.assertLessEqual(
                                player.survival.radiation_resistance, 100
                            )

                            # Opening + style + scar each contribute loadout.
                            self.assertEqual(len(items), 6)
                            self.assertEqual(len(player.inventory), 6)

        self.assertEqual(total_cases, 108)


if __name__ == "__main__":
    unittest.main()

