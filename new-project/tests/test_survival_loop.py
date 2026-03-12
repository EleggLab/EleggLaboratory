from __future__ import annotations

import sys
from pathlib import Path
import unittest


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SRC_PATH = PROJECT_ROOT / "src"
if str(SRC_PATH) not in sys.path:
    sys.path.insert(0, str(SRC_PATH))

from crimson_wasteland.gameplay import (  # noqa: E402
    OASIS_QUEST_ID,
    PERK_BARGAINER,
    PERK_MEDIC,
    SurvivalLoop,
    VERITAS_QUEST_ID,
)
from crimson_wasteland.models import PlayerCharacter  # noqa: E402


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


class _StubRng:
    def __init__(self, random_values: list[float], randint_values: list[int]) -> None:
        self.random_values = random_values
        self.randint_values = randint_values

    def random(self) -> float:
        if not self.random_values:
            return 0.0
        return self.random_values.pop(0)

    def randint(self, minimum: int, maximum: int) -> int:
        if self.randint_values:
            return self.randint_values.pop(0)
        return minimum

    def choice(self, values):
        return values[0]


class SurvivalLoopTests(unittest.TestCase):
    def test_explore_consumes_ap_and_survival_stats(self) -> None:
        io = _FakeIO(["2", "1", "8"])
        rng = _StubRng(random_values=[0.1], randint_values=[3])
        player = PlayerCharacter()
        loop = SurvivalLoop(player=player, input_fn=io.input, output_fn=io.output, rng=rng)

        loop.run()

        self.assertEqual(loop.ap, 4)
        self.assertEqual(player.survival.hunger, 90)
        self.assertEqual(player.survival.thirst, 88)
        self.assertEqual(player.survival.radiation, 3)
        self.assertGreaterEqual(len(player.inventory), 1)

    def test_main_menu_quest_shortcut_can_start_oasis_quest(self) -> None:
        io = _FakeIO(["9", "2", "5", "8"])
        player = PlayerCharacter()
        loop = SurvivalLoop(player=player, input_fn=io.input, output_fn=io.output)

        loop.run()

        quest = player.get_quest(OASIS_QUEST_ID)
        self.assertIsNotNone(quest)
        self.assertEqual(quest["status"], "active")
        self.assertEqual(quest["stage"], "collect_water")

    def test_header_shows_active_quest_objective_brief(self) -> None:
        io = _FakeIO(["9", "2", "5", "8"])
        player = PlayerCharacter()
        loop = SurvivalLoop(player=player, input_fn=io.input, output_fn=io.output)

        loop.run()

        joined = "\n".join(io.outputs)
        self.assertIn("목표: 한 병의 물 - 오염 정화수 2개를 확보해 난민 거점에 전달", joined)

    def test_main_menu_repeat_replays_previous_action(self) -> None:
        io = _FakeIO(["1", "0", "8"])
        player = PlayerCharacter()
        loop = SurvivalLoop(player=player, input_fn=io.input, output_fn=io.output)

        loop.run()

        self.assertEqual(sum(1 for line in io.outputs if line == "현재 상태"), 2)
        self.assertIn("최근 행동 반복: 상태 확인", "\n".join(io.outputs))

    def test_back_alias_word_works_in_camp_menu(self) -> None:
        io = _FakeIO(["5", "back", "8"])
        player = PlayerCharacter()
        loop = SurvivalLoop(player=player, input_fn=io.input, output_fn=io.output)

        loop.run()

        self.assertIn("생존 루프를 종료합니다.", "\n".join(io.outputs))

    def test_zero_back_works_in_quest_menu(self) -> None:
        io = _FakeIO(["9", "2", "0", "8"])
        player = PlayerCharacter()
        loop = SurvivalLoop(player=player, input_fn=io.input, output_fn=io.output)

        loop.run()

        quest = player.get_quest(OASIS_QUEST_ID)
        self.assertIsNotNone(quest)
        self.assertEqual(quest["status"], "active")

    def test_combat_event_can_end_with_loot(self) -> None:
        io = _FakeIO(["2", "1", "1", "1", "8"])
        # rad gain, attack, enemy attack, attack
        rng = _StubRng(random_values=[0.6], randint_values=[0, 7, 2, 7])
        player = PlayerCharacter()
        loop = SurvivalLoop(player=player, input_fn=io.input, output_fn=io.output, rng=rng)

        loop.run()

        self.assertIn("천 조각", player.inventory)

    def test_high_luck_can_trigger_player_critical_hit(self) -> None:
        io = _FakeIO(["2", "1", "1", "8"])
        # rad gain, attack, reward caps
        rng = _StubRng(random_values=[0.6], randint_values=[0, 7, 5])
        player = PlayerCharacter()
        player.core.luck = 8
        loop = SurvivalLoop(player=player, input_fn=io.input, output_fn=io.output, rng=rng)

        loop.run()

        self.assertIn("천 조각", player.inventory)
        self.assertIn("치명타!", "\n".join(io.outputs))

    def test_combat_defend_reduces_incoming_damage(self) -> None:
        io = _FakeIO(["2", "1", "3", "2", "8"])
        # rad gain, enemy attack, flee roll
        rng = _StubRng(random_values=[0.6], randint_values=[0, 6, 1])
        player = PlayerCharacter()
        loop = SurvivalLoop(player=player, input_fn=io.input, output_fn=io.output, rng=rng)

        loop.run()

        self.assertEqual(player.survival.hp, 98)
        self.assertEqual(loop.bleeding_turns, 0)

    def test_bleeding_applies_after_heavy_hit_and_bandage_stops_it(self) -> None:
        io = _FakeIO(["2", "3", "1", "2", "6", "1", "8"])
        # zone3 rad gain, player attack, enemy attack, flee roll
        rng = _StubRng(random_values=[0.6], randint_values=[8, 4, 9, 1])
        player = PlayerCharacter()
        player.add_item("응급 붕대")
        loop = SurvivalLoop(player=player, input_fn=io.input, output_fn=io.output, rng=rng)

        loop.run()

        self.assertEqual(player.survival.hp, 100)
        self.assertEqual(loop.bleeding_turns, 0)
        self.assertNotIn("응급 붕대", player.inventory)

    def test_drink_purified_water_consumes_item(self) -> None:
        io = _FakeIO(["4", "8"])
        player = PlayerCharacter()
        player.survival.thirst = 50
        player.add_item("오염 정화수 x1")
        loop = SurvivalLoop(player=player, input_fn=io.input, output_fn=io.output)

        loop.run()

        self.assertGreater(player.survival.thirst, 50)
        self.assertFalse(player.has_item_containing("정화수"))

    def test_crafting_consumes_materials_and_grants_item(self) -> None:
        io = _FakeIO(["7", "1", "8"])
        player = PlayerCharacter()
        player.add_item("천 조각")
        player.add_item("천 조각")
        loop = SurvivalLoop(player=player, input_fn=io.input, output_fn=io.output)

        loop.run()

        self.assertIn("응급 붕대", player.inventory)
        self.assertEqual(player.skills["crafting"], 2)
        self.assertEqual(loop.ap, 5)

    def test_use_item_menu_applies_healing(self) -> None:
        io = _FakeIO(["6", "1", "8"])
        player = PlayerCharacter()
        player.survival.hp = 70
        player.add_item("응급 붕대")
        loop = SurvivalLoop(player=player, input_fn=io.input, output_fn=io.output)

        loop.run()

        self.assertGreater(player.survival.hp, 70)
        self.assertNotIn("응급 붕대", player.inventory)

    def test_settlement_interaction_updates_reputation_and_rumor(self) -> None:
        # 캠프 관리 -> 정착지 상호작용 -> 오아시스 난민 지원 -> 돌아가기 -> 종료
        io = _FakeIO(["5", "3", "1", "4", "8"])
        player = PlayerCharacter()
        player.add_item("오염 정화수 x1")
        loop = SurvivalLoop(player=player, input_fn=io.input, output_fn=io.output)

        loop.run()

        self.assertEqual(player.faction_reputation["oasis"], 12)
        self.assertEqual(player.faction_reputation["crimson_clan"], -4)
        self.assertGreaterEqual(player.survival.humanity, 66)
        self.assertGreaterEqual(len(player.rumors), 1)

    def test_npc_relationship_supply_action_updates_stats(self) -> None:
        # 캠프 관리 -> NPC 관계 관리 -> 케이트 -> 보급품 공유 -> 돌아가기 -> 캠프 복귀 -> 종료
        io = _FakeIO(["5", "5", "1", "1", "6", "4", "4", "8"])
        player = PlayerCharacter()
        player.add_item("오염 정화수 x1")
        loop = SurvivalLoop(player=player, input_fn=io.input, output_fn=io.output)

        loop.run()

        self.assertGreater(player.npc_relations["kate"]["trust"], 0)
        self.assertGreater(player.npc_relations["kate"]["affection"], 5)
        self.assertGreaterEqual(len(player.relationship_memories), 1)
        self.assertGreaterEqual(player.faction_reputation["oasis"], 4)

    def test_npc_relationship_threaten_action_increases_fear(self) -> None:
        # 캠프 관리 -> NPC 관계 관리 -> 블레이즈 -> 위협 -> 돌아가기 -> 캠프 복귀 -> 종료
        io = _FakeIO(["5", "5", "3", "2", "6", "4", "4", "8"])
        player = PlayerCharacter()
        loop = SurvivalLoop(player=player, input_fn=io.input, output_fn=io.output)

        loop.run()

        self.assertGreater(player.npc_relations["blaze"]["fear"], 10)
        self.assertLess(player.npc_relations["blaze"]["trust"], -10)

    def test_oasis_quest_can_progress_to_decision_stage(self) -> None:
        io = _FakeIO(["5", "6", "2", "3", "5", "4", "8"])
        player = PlayerCharacter()
        player.add_item("오염 정화수 x1")
        player.add_item("오염 정화수 x1")
        loop = SurvivalLoop(player=player, input_fn=io.input, output_fn=io.output)

        loop.run()

        quest = player.get_quest(OASIS_QUEST_ID)
        self.assertIsNotNone(quest)
        self.assertEqual(quest["status"], "active")
        self.assertEqual(quest["stage"], "decision")
        self.assertEqual(quest["water_delivered"], 2)
        self.assertEqual(player.faction_reputation["oasis"], 10)
        self.assertEqual(player.survival.humanity, 64)

    def test_oasis_quest_deliver_requires_two_water_without_partial_loss(self) -> None:
        io = _FakeIO(["5", "6", "2", "3", "5", "4", "8"])
        player = PlayerCharacter()
        player.add_item("오염 정화수 x1")
        loop = SurvivalLoop(player=player, input_fn=io.input, output_fn=io.output)

        loop.run()

        quest = player.get_quest(OASIS_QUEST_ID)
        self.assertIsNotNone(quest)
        self.assertEqual(quest["stage"], "collect_water")
        self.assertEqual(sum(1 for item in player.inventory if "정화수" in item), 1)

    def test_oasis_quest_extortion_route_completes_immediately(self) -> None:
        io = _FakeIO(["5", "6", "2", "3", "4", "2", "5", "4", "8"])
        player = PlayerCharacter()
        player.add_item("오염 정화수 x1")
        player.add_item("오염 정화수 x1")
        loop = SurvivalLoop(player=player, input_fn=io.input, output_fn=io.output)

        loop.run()

        quest = player.get_quest(OASIS_QUEST_ID)
        self.assertIsNotNone(quest)
        self.assertEqual(quest["status"], "completed")
        self.assertEqual(quest["outcome"], "갈취자")
        self.assertEqual(player.faction_reputation["oasis"], -15)
        self.assertEqual(player.faction_reputation["crimson_clan"], 12)
        self.assertEqual(player.caps, 35)
        self.assertEqual(player.survival.humanity, 58)

    def test_oasis_quest_protector_route_completes_after_combat_victory(self) -> None:
        io = _FakeIO(
            ["5", "6", "2", "3", "4", "1", "5", "4", "2", "1", "1", "1", "8"]
        )
        # rad gain, attack, enemy attack, attack, combat reward caps
        rng = _StubRng(random_values=[0.6], randint_values=[0, 7, 2, 7, 5])
        player = PlayerCharacter()
        player.add_item("오염 정화수 x1")
        player.add_item("오염 정화수 x1")
        loop = SurvivalLoop(player=player, input_fn=io.input, output_fn=io.output, rng=rng)

        loop.run()

        quest = player.get_quest(OASIS_QUEST_ID)
        self.assertIsNotNone(quest)
        self.assertEqual(quest["status"], "completed")
        self.assertEqual(quest["outcome"], "수호자")
        self.assertIn("에덴의 수호자", player.titles)
        self.assertEqual(player.faction_reputation["oasis"], 38)
        self.assertEqual(player.faction_reputation["veritas"], 4)
        self.assertEqual(player.caps, 40)

    def test_veritas_quest_can_progress_to_decision_stage(self) -> None:
        io = _FakeIO(["5", "6", "6", "1", "2", "4", "5", "4", "8"])
        player = PlayerCharacter()
        player.add_item("변이 생체조직")
        player.add_item("스크랩 금속")
        loop = SurvivalLoop(player=player, input_fn=io.input, output_fn=io.output)

        loop.run()

        quest = player.get_quest(VERITAS_QUEST_ID)
        self.assertIsNotNone(quest)
        self.assertEqual(quest["status"], "active")
        self.assertEqual(quest["stage"], "decision")
        self.assertTrue(quest["parts_delivered"])
        self.assertEqual(player.faction_reputation["veritas"], 6)
        self.assertEqual(player.survival.humanity, 62)
        self.assertNotIn("변이 생체조직", player.inventory)
        self.assertNotIn("스크랩 금속", player.inventory)

    def test_veritas_quest_leak_route_completes_immediately(self) -> None:
        io = _FakeIO(["5", "6", "6", "1", "2", "3", "2", "4", "5", "4", "8"])
        player = PlayerCharacter()
        player.add_item("변이 생체조직")
        player.add_item("스크랩 금속")
        loop = SurvivalLoop(player=player, input_fn=io.input, output_fn=io.output)

        loop.run()

        quest = player.get_quest(VERITAS_QUEST_ID)
        self.assertIsNotNone(quest)
        self.assertEqual(quest["status"], "completed")
        self.assertEqual(quest["outcome"], "이중첩자")
        self.assertIn("회색 중개인", player.titles)
        self.assertEqual(player.faction_reputation["veritas"], -14)
        self.assertEqual(player.faction_reputation["atomic_children"], 15)
        self.assertEqual(player.caps, 30)
        self.assertEqual(player.survival.humanity, 58)

    def test_veritas_quest_observer_route_completes_after_two_combat_victory(self) -> None:
        io = _FakeIO(
            [
                "5", "6", "6", "1", "2", "3", "1", "4", "5", "4",
                "2", "1", "1", "1",
                "2", "1", "1", "1",
                "8",
            ]
        )
        # explore1: rad, atk, enemy atk, atk, reward caps
        # explore2: rad, atk, enemy atk, atk, reward caps
        rng = _StubRng(random_values=[0.6, 0.6], randint_values=[0, 7, 2, 7, 5, 0, 7, 2, 7, 5])
        player = PlayerCharacter()
        player.add_item("변이 생체조직")
        player.add_item("스크랩 금속")
        loop = SurvivalLoop(player=player, input_fn=io.input, output_fn=io.output, rng=rng)

        loop.run()

        quest = player.get_quest(VERITAS_QUEST_ID)
        self.assertIsNotNone(quest)
        self.assertEqual(quest["status"], "completed")
        self.assertEqual(quest["outcome"], "관측자")
        self.assertIn("사막의 관측자", player.titles)
        self.assertIn("베리타스 신호 키트", player.inventory)
        self.assertEqual(player.faction_reputation["veritas"], 36)
        self.assertEqual(player.faction_reputation["oasis"], 4)
        self.assertEqual(player.caps, 50)

    def test_veritas_protect_route_blocked_while_oasis_combat_contract_active(self) -> None:
        io = _FakeIO(["5", "6", "2", "3", "4", "1", "6", "1", "2", "3", "1", "4", "5", "4", "8"])
        player = PlayerCharacter()
        player.add_item("오염 정화수 x1")
        player.add_item("오염 정화수 x1")
        player.add_item("변이 생체조직")
        player.add_item("스크랩 금속")
        loop = SurvivalLoop(player=player, input_fn=io.input, output_fn=io.output)

        loop.run()

        oasis = player.get_quest(OASIS_QUEST_ID)
        veritas = player.get_quest(VERITAS_QUEST_ID)
        self.assertIsNotNone(oasis)
        self.assertIsNotNone(veritas)
        self.assertEqual(oasis["stage"], "defend_oasis")
        self.assertEqual(veritas["stage"], "decision")

    def test_oasis_protect_route_blocked_while_veritas_combat_contract_active(self) -> None:
        io = _FakeIO(["5", "6", "6", "1", "2", "3", "1", "4", "2", "3", "4", "1", "5", "4", "8"])
        player = PlayerCharacter()
        player.add_item("오염 정화수 x1")
        player.add_item("오염 정화수 x1")
        player.add_item("변이 생체조직")
        player.add_item("스크랩 금속")
        loop = SurvivalLoop(player=player, input_fn=io.input, output_fn=io.output)

        loop.run()

        oasis = player.get_quest(OASIS_QUEST_ID)
        veritas = player.get_quest(VERITAS_QUEST_ID)
        self.assertIsNotNone(oasis)
        self.assertIsNotNone(veritas)
        self.assertEqual(veritas["stage"], "secure_relay")
        self.assertEqual(oasis["stage"], "decision")

    def test_balance_profile_can_be_changed_in_camp_menu(self) -> None:
        io = _FakeIO(["5", "7", "3", "4", "8"])
        player = PlayerCharacter()
        loop = SurvivalLoop(player=player, input_fn=io.input, output_fn=io.output)

        loop.run()

        self.assertEqual(loop.balance.key, "hardcore")

    def test_hardcore_profile_increases_explore_pressure(self) -> None:
        io = _FakeIO(["2", "1", "8"])
        rng = _StubRng(random_values=[0.9], randint_values=[10])
        player = PlayerCharacter()
        loop = SurvivalLoop(
            player=player,
            input_fn=io.input,
            output_fn=io.output,
            rng=rng,
            balance_profile_key="hardcore",
        )

        loop.run()

        self.assertEqual(player.survival.hunger, 87)
        self.assertEqual(player.survival.thirst, 85)
        self.assertEqual(player.survival.radiation, 13)

    def test_story_profile_scales_settlement_rewards_and_penalties(self) -> None:
        # 스토리 프로필에서 암시장 거래 캡 보상(18 -> 21)과 의식 패널티 완화(-8 -> -6) 확인
        io_trade = _FakeIO(["5", "3", "2", "4", "8"])
        player_trade = PlayerCharacter()
        player_trade.add_item("스크랩 금속")
        loop_trade = SurvivalLoop(
            player=player_trade,
            input_fn=io_trade.input,
            output_fn=io_trade.output,
            balance_profile_key="story",
        )
        loop_trade.run()
        self.assertEqual(player_trade.caps, 21)

        io_ritual = _FakeIO(["5", "3", "4", "4", "8"])
        player_ritual = PlayerCharacter()
        loop_ritual = SurvivalLoop(
            player=player_ritual,
            input_fn=io_ritual.input,
            output_fn=io_ritual.output,
            balance_profile_key="story",
        )
        loop_ritual.run()
        self.assertEqual(player_ritual.survival.radiation, 15)
        self.assertEqual(player_ritual.survival.humanity, 54)

    def test_crimson_trade_is_blocked_when_hated(self) -> None:
        io = _FakeIO(["5", "3", "2", "4", "8"])
        player = PlayerCharacter()
        player.faction_reputation["crimson_clan"] = -80
        player.add_item("스크랩 금속")
        loop = SurvivalLoop(player=player, input_fn=io.input, output_fn=io.output)

        loop.run()

        self.assertEqual(player.caps, 0)
        self.assertIn("스크랩 금속", player.inventory)

    def test_crimson_trade_reward_is_higher_when_idolized(self) -> None:
        io = _FakeIO(["5", "3", "2", "4", "8"])
        player = PlayerCharacter()
        player.faction_reputation["crimson_clan"] = 80
        player.add_item("스크랩 금속")
        loop = SurvivalLoop(player=player, input_fn=io.input, output_fn=io.output)

        loop.run()

        self.assertEqual(player.caps, 23)
        self.assertEqual(player.faction_reputation["crimson_clan"], 86)

    def test_oasis_aid_changes_by_reputation_stage(self) -> None:
        io = _FakeIO(["5", "3", "1", "4", "8"])
        player = PlayerCharacter()
        player.faction_reputation["oasis"] = -80
        player.add_item("오염 정화수 x1")
        loop = SurvivalLoop(player=player, input_fn=io.input, output_fn=io.output)

        loop.run()

        self.assertEqual(player.survival.humanity, 62)
        self.assertEqual(player.faction_reputation["oasis"], -66)

    def test_xp_gain_can_trigger_level_up(self) -> None:
        io = _FakeIO(["5", "5", "3", "2", "6", "4", "4", "8"])
        player = PlayerCharacter()
        player.xp = 96
        loop = SurvivalLoop(player=player, input_fn=io.input, output_fn=io.output)

        loop.run()

        self.assertEqual(player.level, 2)
        self.assertEqual(player.xp, 0)
        self.assertEqual(player.perk_points, 1)

    def test_growth_menu_can_spend_perk_point(self) -> None:
        io = _FakeIO(["5", "8", "2", "4", "4", "8"])
        player = PlayerCharacter()
        player.perk_points = 1
        loop = SurvivalLoop(player=player, input_fn=io.input, output_fn=io.output)

        loop.run()

        self.assertIn(PERK_MEDIC, player.perks)
        self.assertEqual(player.perk_points, 0)

    def test_medic_perk_increases_bandage_heal(self) -> None:
        io = _FakeIO(["6", "1", "8"])
        player = PlayerCharacter()
        player.survival.hp = 70
        player.add_perk(PERK_MEDIC)
        player.add_item("응급 붕대")
        loop = SurvivalLoop(player=player, input_fn=io.input, output_fn=io.output)

        loop.run()

        self.assertEqual(player.survival.hp, 94)

    def test_bargainer_perk_increases_trade_reward(self) -> None:
        io = _FakeIO(["5", "3", "2", "4", "8"])
        player = PlayerCharacter()
        player.add_perk(PERK_BARGAINER)
        player.add_item("스크랩 금속")
        loop = SurvivalLoop(player=player, input_fn=io.input, output_fn=io.output)

        loop.run()

        self.assertEqual(player.caps, 20)


if __name__ == "__main__":
    unittest.main()
