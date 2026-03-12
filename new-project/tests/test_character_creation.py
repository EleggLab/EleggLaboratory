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


class CharacterCreationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.player = PlayerCharacter()
        self.scenes = {scene.scene_id: scene for scene in all_creation_scenes()}

    def test_opening_choice_1_adds_luck(self) -> None:
        scene = self.scenes["opening_caravan"]
        option = get_option(scene, "1")
        apply_effect(self.player, option.effect)
        self.assertEqual(self.player.core.luck, 6)
        self.assertIn("trusted_stranger", self.player.story_tags)

    def test_opening_choice_3_supports_bonus_branch(self) -> None:
        scene = self.scenes["opening_caravan"]
        option = get_option(scene, "3")
        apply_effect(self.player, option.effect)
        apply_betrayal_bonus(self.player, "2")
        self.assertEqual(self.player.core.intelligence, 6)
        self.assertIn("betrayer", self.player.story_tags)
        self.assertIn("betrayal_intelligence_bonus", self.player.story_tags)

    def test_survival_style_2_adds_social_skills(self) -> None:
        scene = self.scenes["memory_survival_style"]
        option = get_option(scene, "2")
        apply_effect(self.player, option.effect)
        self.assertEqual(self.player.skills["speech"], 10)
        self.assertEqual(self.player.skills["barter"], 10)

    def test_scars_3_adds_perk_and_luck(self) -> None:
        scene = self.scenes["memory_scars"]
        option = get_option(scene, "3")
        apply_effect(self.player, option.effect)
        self.assertIn("미지의 잠재력", self.player.perks)
        self.assertEqual(self.player.core.luck, 6)

    def test_core_stat_is_clamped_to_ten(self) -> None:
        scene = self.scenes["opening_caravan"]
        option = get_option(scene, "1")
        for _ in range(20):
            apply_effect(self.player, option.effect)
        self.assertEqual(self.player.core.luck, 10)

    def test_starting_loadout_is_assigned_from_creation_choices(self) -> None:
        self.player.set_creation_choice("opening_caravan", "2")
        self.player.set_creation_choice("memory_survival_style", "3")
        self.player.set_creation_choice("memory_scars", "1")
        items = assign_starting_loadout(self.player)

        self.assertIn("균열 난 단안경", items)
        self.assertIn("휴대 수리 키트", items)
        self.assertIn("요오드 정제 x1", items)
        self.assertIn("starting_loadout_assigned", self.player.story_tags)
        self.assertEqual(self.player.caps, 12)

    def test_serialized_survival_stats_do_not_include_internal_bounds(self) -> None:
        payload = self.player.as_dict()
        self.assertIn("survival", payload)
        self.assertNotIn("bounds", payload["survival"])

    def test_skill_table_includes_social_and_adult_skills(self) -> None:
        for skill_key in ("seduction", "prostitution", "training"):
            self.assertIn(skill_key, self.player.skills)

    def test_faction_reputation_is_clamped(self) -> None:
        self.player.modify_faction_reputation("oasis", 999)
        self.assertEqual(self.player.faction_reputation["oasis"], 100)
        self.player.modify_faction_reputation("oasis", -999)
        self.assertEqual(self.player.faction_reputation["oasis"], -100)

    def test_npc_relation_stage_is_computed(self) -> None:
        self.player.modify_npc_relation("kate", "trust", 90)
        self.player.modify_npc_relation("kate", "affection", 60)
        self.assertEqual(self.player.get_npc_relation_stage("kate"), "생존 파트너")

    def test_serialization_includes_npc_relations(self) -> None:
        payload = self.player.as_dict()
        self.assertIn("npc_relations", payload)
        self.assertIn("kate", payload["npc_relations"])

    def test_serialization_includes_quest_log(self) -> None:
        self.player.start_quest(
            "unit_test_quest",
            title="단위 테스트 의뢰",
            stage="alpha",
            objective="무결성 점검",
        )
        payload = self.player.as_dict()
        self.assertIn("quest_log", payload)
        self.assertIn("unit_test_quest", payload["quest_log"])

    def test_xp_progression_levels_up_and_grants_perk_point(self) -> None:
        leveled = self.player.add_xp(120)
        self.assertEqual(leveled, [2])
        self.assertEqual(self.player.level, 2)
        self.assertEqual(self.player.xp, 20)
        self.assertEqual(self.player.perk_points, 1)

    def test_serialization_includes_growth_fields(self) -> None:
        payload = self.player.as_dict()
        self.assertIn("level", payload)
        self.assertIn("xp", payload)
        self.assertIn("perk_points", payload)


if __name__ == "__main__":
    unittest.main()
