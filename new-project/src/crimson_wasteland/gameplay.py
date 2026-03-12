from __future__ import annotations

import random
from dataclasses import dataclass
from typing import Callable

from .models import (
    FACTION_LABELS,
    NPC_FACTION,
    NPC_LABELS,
    RELATION_STAT_LABELS,
    PlayerCharacter,
)
from .state_bridge import LiveStateBridge


@dataclass(frozen=True)
class Zone:
    key: str
    name: str
    radiation_gain_min: int
    radiation_gain_max: int
    enemy_name: str
    enemy_hp: int
    enemy_attack_min: int
    enemy_attack_max: int
    enemy_loot: str


@dataclass(frozen=True)
class Recipe:
    key: str
    name: str
    ingredients: tuple[tuple[str, int], ...]
    output_item: str
    ap_cost: int


@dataclass(frozen=True)
class BalanceProfile:
    key: str
    label: str
    summary: str
    explore_ap_cost: int
    explore_hunger_cost: int
    explore_thirst_cost: int
    rest_hp_recovery: int
    rest_hunger_cost: int
    rest_thirst_cost: int
    radiation_gain_pct: int
    enemy_damage_pct: int
    player_damage_bonus: int
    caps_reward_pct: int
    humanity_gain_pct: int
    humanity_loss_pct: int


ZONES = {
    "1": Zone(
        key="1",
        name="붕괴 도시 외곽",
        radiation_gain_min=0,
        radiation_gain_max=8,
        enemy_name="변이 쥐 떼",
        enemy_hp=14,
        enemy_attack_min=2,
        enemy_attack_max=5,
        enemy_loot="천 조각",
    ),
    "2": Zone(
        key="2",
        name="러스트 공장 지대",
        radiation_gain_min=3,
        radiation_gain_max=14,
        enemy_name="광폭 약탈자",
        enemy_hp=22,
        enemy_attack_min=3,
        enemy_attack_max=7,
        enemy_loot="스크랩 금속",
    ),
    "3": Zone(
        key="3",
        name="블러드쏜 변이 지대",
        radiation_gain_min=8,
        radiation_gain_max=20,
        enemy_name="블러드쏜 괴수",
        enemy_hp=30,
        enemy_attack_min=4,
        enemy_attack_max=9,
        enemy_loot="변이 생체조직",
    ),
}

RECIPES = {
    "1": Recipe(
        key="1",
        name="응급 붕대 제작",
        ingredients=(("천 조각", 2),),
        output_item="응급 붕대",
        ap_cost=1,
    ),
    "2": Recipe(
        key="2",
        name="정화수 정제",
        ingredients=(("스크랩 금속", 1), ("천 조각", 1)),
        output_item="오염 정화수 x1",
        ap_cost=1,
    ),
    "3": Recipe(
        key="3",
        name="간이 해독제 제조",
        ingredients=(("변이 생체조직", 1), ("오염 정화수", 1)),
        output_item="간이 해독제",
        ap_cost=1,
    ),
}

OASIS_QUEST_ID = "oasis_waterline"
OASIS_QUEST_TITLE = "한 병의 물"
VERITAS_QUEST_ID = "veritas_signal"
VERITAS_QUEST_TITLE = "사라진 중계기"
PERK_WANDERER = "황무지 방랑자"
PERK_MEDIC = "전장 의무병"
PERK_BARGAINER = "협상가"

BALANCE_PROFILES = {
    "story": BalanceProfile(
        key="story",
        label="스토리",
        summary="생존 압박 완화, 전투 부담 완화",
        explore_ap_cost=2,
        explore_hunger_cost=8,
        explore_thirst_cost=9,
        rest_hp_recovery=14,
        rest_hunger_cost=6,
        rest_thirst_cost=8,
        radiation_gain_pct=75,
        enemy_damage_pct=80,
        player_damage_bonus=1,
        caps_reward_pct=115,
        humanity_gain_pct=120,
        humanity_loss_pct=80,
    ),
    "standard": BalanceProfile(
        key="standard",
        label="스탠다드",
        summary="현재 프로토타입 기본 밸런스",
        explore_ap_cost=2,
        explore_hunger_cost=10,
        explore_thirst_cost=12,
        rest_hp_recovery=10,
        rest_hunger_cost=8,
        rest_thirst_cost=10,
        radiation_gain_pct=100,
        enemy_damage_pct=100,
        player_damage_bonus=0,
        caps_reward_pct=100,
        humanity_gain_pct=100,
        humanity_loss_pct=100,
    ),
    "hardcore": BalanceProfile(
        key="hardcore",
        label="하드코어",
        summary="자원 고갈과 피폭 위험 증폭",
        explore_ap_cost=2,
        explore_hunger_cost=13,
        explore_thirst_cost=15,
        rest_hp_recovery=6,
        rest_hunger_cost=10,
        rest_thirst_cost=14,
        radiation_gain_pct=130,
        enemy_damage_pct=125,
        player_damage_bonus=-1,
        caps_reward_pct=90,
        humanity_gain_pct=85,
        humanity_loss_pct=130,
    ),
}

TRADE_RATE_BY_STAGE = {
    "증오": 0,
    "적대": 75,
    "중립": 100,
    "우호": 115,
    "숭배": 130,
}

OASIS_AID_HUMANITY_BY_STAGE = {
    "증오": 2,
    "적대": 4,
    "중립": 6,
    "우호": 7,
    "숭배": 8,
}

OASIS_AID_REPUTATION_BY_STAGE = {
    "증오": 14,
    "적대": 12,
    "중립": 12,
    "우호": 10,
    "숭배": 8,
}


class SurvivalLoop:
    def __init__(
        self,
        player: PlayerCharacter,
        input_fn: Callable[[str], str],
        output_fn: Callable[[str], None],
        rng: random.Random | None = None,
        balance_profile_key: str = "standard",
        live_state_bridge: LiveStateBridge | None = None,
    ) -> None:
        self.player = player
        self.input_fn = input_fn
        self.output_fn = output_fn
        self.rng = rng or random.Random()
        self.day = 1
        self.max_ap = 6
        self.ap = self.max_ap
        self.bleeding_turns = 0
        self._intro_hint_shown = False
        self._last_main_choice: str | None = None
        if balance_profile_key not in BALANCE_PROFILES:
            raise KeyError(f"Unknown balance profile: {balance_profile_key}")
        self.balance = BALANCE_PROFILES[balance_profile_key]
        self.live_state_bridge = live_state_bridge

    def run(self) -> None:
        self.output_fn("")
        self.output_fn("[황무지 생존 루프 시작]")
        self.output_fn("탐험해서 자원을 확보하고, 생존 스탯을 관리하세요.")
        self._publish_live_state(phase="survival_loop_start")

        while True:
            if not self._is_alive():
                self._publish_live_state(phase="game_over")
                return

            self._print_header()
            self.output_fn("1. 상태 확인")
            self.output_fn("2. 탐험 출발 (AP 2)")
            self.output_fn("3. 휴식 (다음 날로 이동)")
            self.output_fn("4. 정화수 사용 (갈증 회복)")
            self.output_fn("5. 캠프 관리")
            self.output_fn("6. 아이템 사용")
            self.output_fn("7. 제작")
            self.output_fn("8. 루프 종료")
            self.output_fn("9. 퀘스트 바로가기")
            self.output_fn("0. 최근 행동 반복")

            choice = self._ask_choice(
                "행동 선택 > ",
                {"0", "1", "2", "3", "4", "5", "6", "7", "8", "9"},
            )
            if choice == "0":
                if not self._last_main_choice:
                    self.output_fn("반복할 최근 행동이 없습니다.")
                    continue
                choice = self._last_main_choice
                self.output_fn(f"최근 행동 반복: {self._main_choice_label(choice)}")
            else:
                self._last_main_choice = choice

            if choice == "1":
                self._print_status()
            elif choice == "2":
                self._explore()
            elif choice == "3":
                self._rest()
            elif choice == "4":
                self._drink_purified_water()
            elif choice == "5":
                self._camp_menu()
            elif choice == "6":
                self._use_item()
            elif choice == "7":
                self._craft_item()
            elif choice == "8":
                self.output_fn("생존 루프를 종료합니다.")
                self._publish_live_state(phase="survival_loop_exit")
                return
            elif choice == "9":
                self._quest_menu()

            self._apply_survival_penalties()
            self._publish_live_state(phase="turn_end")

    def _print_header(self) -> None:
        self.output_fn("")
        self.output_fn(
            f"[DAY {self.day}] AP {self.ap}/{self.max_ap} | 프로필 {self.balance.label}"
        )
        objective = self._active_quest_brief()
        if objective:
            self.output_fn(f"목표: {objective}")
        if not self._intro_hint_shown:
            self.output_fn("가이드: 9번(퀘스트 바로가기)에서 의뢰를 수락하면 초반 동선이 단순해집니다.")
            self.output_fn("추천 루트: 의뢰 수락 -> 탐험 1회 -> 제작/회복 점검")
            self._intro_hint_shown = True

    def _print_status(self) -> None:
        self.output_fn("")
        self.output_fn("현재 상태")
        self.output_fn(f"- 체력: {self.player.survival.hp}")
        self.output_fn(f"- 인간성: {self.player.survival.humanity}")
        self.output_fn(f"- 허기: {self.player.survival.hunger}")
        self.output_fn(f"- 갈증: {self.player.survival.thirst}")
        self.output_fn(f"- 방사능: {self.player.survival.radiation}")
        self.output_fn(f"- 캡: {self.player.caps}")
        self.output_fn(
            f"- 레벨: {self.player.level} (XP {self.player.xp}/{self.player.xp_to_next_level()})"
        )
        self.output_fn(f"- 퍼크 포인트: {self.player.perk_points}")
        self.output_fn(f"- 출혈 상태: {self.bleeding_turns}턴")
        self.output_fn(f"- 제작 스킬: {self.player.skills['crafting']}")
        self.output_fn(f"- 인벤토리 아이템 수: {len(self.player.inventory)}")
        self.output_fn(f"- 밸런스 프로필: {self.balance.label}")

    def _active_quest_brief(self) -> str | None:
        for quest in self.player.quest_log.values():
            if quest.get("status") != "active":
                continue
            title = str(quest.get("title", "의뢰"))
            objective = str(quest.get("objective", "목표 없음"))
            if len(objective) > 34:
                objective = objective[:31] + "..."
            return f"{title} - {objective}"
        return None

    def _main_choice_label(self, choice: str) -> str:
        labels = {
            "1": "상태 확인",
            "2": "탐험 출발",
            "3": "휴식",
            "4": "정화수 사용",
            "5": "캠프 관리",
            "6": "아이템 사용",
            "7": "제작",
            "8": "루프 종료",
            "9": "퀘스트 바로가기",
        }
        return labels.get(choice, choice)

    def _explore(self) -> None:
        if self.ap < self.balance.explore_ap_cost:
            self.output_fn("AP가 부족합니다. 휴식이 필요합니다.")
            return

        self.output_fn("")
        self.output_fn("[탐험 지역 선택]")
        for zone in ZONES.values():
            self.output_fn(f"{zone.key}. {zone.name}")
        zone_key = self._ask_choice("지역 선택 > ", set(ZONES))
        zone = ZONES[zone_key]

        self.ap -= self.balance.explore_ap_cost
        self.player.survival.modify("hunger", -self.balance.explore_hunger_cost)
        self.player.survival.modify("thirst", -self.balance.explore_thirst_cost)
        rad_gain = self.rng.randint(zone.radiation_gain_min, zone.radiation_gain_max)
        applied_rad = self._apply_radiation_gain(rad_gain)
        self.output_fn(f"{zone.name} 탐험: 방사능 +{applied_rad}, 허기/갈증 감소")
        self._grant_xp(4, "탐험 이동")

        event_roll = self.rng.random()
        if event_roll < 0.45:
            self._event_find_supplies()
            return
        if event_roll < 0.8:
            self._event_combat(zone)
            return
        self.output_fn("특이사항 없이 탐험을 마쳤습니다.")

    def _event_find_supplies(self) -> None:
        loot_table = [
            "스크랩 금속",
            "천 조각",
            "응급 붕대",
            "오염 정화수 x1",
        ]
        found = self.rng.choice(loot_table)
        self.player.add_item(found)
        self.output_fn(f"자원 발견: {found}")
        if self.rng.random() < 0.25:
            base_caps = self.rng.randint(4, 14)
            gained = self._award_caps(base_caps)
            self.output_fn(f"추가 발견: 캡 +{gained}")
        if self._has_perk(PERK_WANDERER) and self.rng.random() < 0.2:
            extra = self.rng.choice(loot_table)
            self.player.add_item(extra)
            self.output_fn(f"방랑자 감각 발동: 추가 자원 {extra}")
        self.player.add_rumor(f"DAY {self.day}: 황무지에서 {found} 확보 소문이 퍼졌다.")
        self._grant_xp(6, "자원 수색")

    def _event_combat(self, zone: Zone) -> None:
        enemy_hp = zone.enemy_hp
        self.output_fn(f"적 조우: {zone.enemy_name} (HP {enemy_hp})")

        while enemy_hp > 0:
            if not self._is_alive():
                return

            self.output_fn("1. 공격")
            self.output_fn("2. 도주 시도")
            self.output_fn("3. 방어 태세")
            combat_choice = self._ask_choice("전투 행동 > ", {"1", "2", "3"})
            defending = False

            if combat_choice == "1":
                attack_roll = self.rng.randint(4, 7)
                uses_gun = self.player.has_item_containing("녹슨 권총")
                skill_key = "small_guns" if uses_gun else "melee_weapons"
                if not self._attack_hits(attack_roll, skill_key):
                    self.output_fn("공격 빗나감")
                else:
                    player_damage = attack_roll + self.player.core.strength // 2
                    if uses_gun:
                        player_damage += 2
                    player_damage += self.balance.player_damage_bonus
                    if self._is_player_critical(attack_roll, skill_key, uses_gun):
                        player_damage = int(round(player_damage * 1.5))
                        self.output_fn("치명타!")
                    player_damage = max(1, player_damage)
                    enemy_hp = max(0, enemy_hp - player_damage)
                    self.output_fn(f"공격 적중: {player_damage} 피해 (적 HP {enemy_hp})")
            elif combat_choice == "2":
                flee_chance = min(90, 30 + self.player.core.agility * 7)
                roll = self.rng.randint(1, 100)
                if roll <= flee_chance:
                    self.output_fn("도주 성공")
                    return
                self.output_fn("도주 실패")
            else:
                defending = True
                self.output_fn("방어 태세: 이번 턴 피격 피해 감소")

            if enemy_hp <= 0:
                self.output_fn(f"{zone.enemy_name} 격파")
                self.player.add_item(zone.enemy_loot)
                self.output_fn(f"전리품 획득: {zone.enemy_loot}")
                base_caps = self.rng.randint(3, 12)
                gained = self._award_caps(base_caps)
                self.output_fn(f"전투 보상 캡 +{gained}")
                self.player.add_rumor(
                    f"DAY {self.day}: {zone.name}에서 {zone.enemy_name}를 쓰러뜨렸다는 소문."
                )
                self._grant_xp(20, "전투 승리")
                self._on_enemy_defeated(zone)
                return

            enemy_base = self.rng.randint(zone.enemy_attack_min, zone.enemy_attack_max)
            if self._is_enemy_attack_dodged(enemy_base, zone, defending):
                self.output_fn("회피 성공: 피해 없음")
                continue
            enemy_damage = self._scale_positive(enemy_base, self.balance.enemy_damage_pct)
            enemy_critical = self._is_enemy_critical(enemy_base, zone)
            if enemy_critical:
                enemy_damage = int(round(enemy_damage * 1.35))
                self.output_fn("적 치명타!")
            if defending:
                enemy_damage = self._mitigate_guard_damage(enemy_damage)
            self.player.survival.modify("hp", -enemy_damage)
            self.output_fn(f"피격: {enemy_damage} 피해 (내 HP {self.player.survival.hp})")
            if enemy_critical or enemy_damage >= 8:
                self._apply_bleeding(turns=2, source=zone.enemy_name)

    def _rest(self) -> None:
        self.day += 1
        self.ap = self.max_ap
        self.player.survival.modify("hp", self.balance.rest_hp_recovery)
        self.player.survival.modify("hunger", -self.balance.rest_hunger_cost)
        self.player.survival.modify("thirst", -self.balance.rest_thirst_cost)
        if self.bleeding_turns > 0:
            self.bleeding_turns = max(0, self.bleeding_turns - 1)
            if self.bleeding_turns == 0:
                self.output_fn("휴식으로 출혈이 멎었습니다.")
        self.output_fn("휴식 완료: AP 회복, 체력 소폭 회복")

    def _drink_purified_water(self) -> None:
        item = self.player.consume_item_containing("정화수")
        if not item:
            self.output_fn("사용 가능한 정화수가 없습니다.")
            return
        self.player.survival.modify("thirst", 35)
        self.output_fn(f"{item} 사용: 갈증 회복")

    def _print_inventory(self) -> None:
        self.output_fn("")
        self.output_fn("[인벤토리]")
        if not self.player.inventory:
            self.output_fn("- 비어 있음")
            return
        for index, item in enumerate(self.player.inventory, start=1):
            self.output_fn(f"{index}. {item}")

    def _camp_menu(self) -> None:
        while True:
            self.output_fn("")
            self.output_fn("[캠프 관리]")
            self.output_fn("0. 메인 루프로")
            self.output_fn("1. 인벤토리 확인")
            self.output_fn("2. 평판/소문 확인")
            self.output_fn("3. 정착지 상호작용")
            self.output_fn("4. 돌아가기")
            self.output_fn("5. NPC 관계 관리")
            self.output_fn("6. 퀘스트 관리")
            self.output_fn("7. 밸런스 프로필 조정")
            self.output_fn("8. 성장/퍼크 관리")

            choice = self._ask_choice("캠프 선택 > ", {"0", "1", "2", "3", "4", "5", "6", "7", "8"})
            if choice in {"0", "4"}:
                self._publish_live_state(phase="camp_exit")
                return
            if choice == "1":
                self._print_inventory()
                self._publish_live_state(phase="camp_inventory")
            elif choice == "2":
                self._print_social_status()
                self._publish_live_state(phase="camp_social")
            elif choice == "3":
                self._settlement_interaction()
                self._publish_live_state(phase="camp_settlement")
            elif choice == "5":
                self._npc_relationship_menu()
                self._publish_live_state(phase="camp_npc")
            elif choice == "6":
                self._quest_menu()
                self._publish_live_state(phase="camp_quest")
            elif choice == "7":
                self._balance_profile_menu()
                self._publish_live_state(phase="camp_balance")
            elif choice == "8":
                self._growth_menu()
                self._publish_live_state(phase="camp_growth")

    def _use_item(self) -> None:
        usable = [
            ("응급 붕대", "HP +18", self._effect_bandage),
            ("요오드 정제", "방사능 -40", self._effect_iodine),
            ("간이 해독제", "방사능 -80, HP +5", self._effect_antidote),
            ("진통제", "HP +10, 인간성 -2", self._effect_painkiller),
            ("정화수", "갈증 +35", self._effect_water),
        ]

        candidates: list[tuple[int, str, str, Callable[[], None]]] = []
        for index, item in enumerate(self.player.inventory):
            for keyword, desc, effect in usable:
                if keyword in item:
                    candidates.append((index, item, desc, effect))
                    break

        if not candidates:
            self.output_fn("사용 가능한 아이템이 없습니다.")
            return

        self.output_fn("")
        self.output_fn("[아이템 사용]")
        for menu_index, (_, item, desc, _) in enumerate(candidates, start=1):
            self.output_fn(f"{menu_index}. {item} ({desc})")

        valid = {str(i) for i in range(1, len(candidates) + 1)}
        picked = self._ask_choice("사용할 아이템 번호 > ", valid)
        inv_index, item_name, _, effect_fn = candidates[int(picked) - 1]
        self.player.inventory.pop(inv_index)
        effect_fn()
        self.output_fn(f"{item_name} 사용 완료")

    def _craft_item(self) -> None:
        if self.ap < 1:
            self.output_fn("AP가 부족해 제작할 수 없습니다.")
            return

        self.output_fn("")
        self.output_fn("[제작]")
        for recipe in RECIPES.values():
            req = ", ".join(f"{name} x{count}" for name, count in recipe.ingredients)
            can_make = "가능" if self._can_craft(recipe) else "재료 부족"
            self.output_fn(
                f"{recipe.key}. {recipe.name} -> {recipe.output_item} "
                f"(재료: {req}, AP {recipe.ap_cost}, {can_make})"
            )
        self.output_fn("4. 취소")

        picked = self._ask_choice("제작할 항목 > ", {"1", "2", "3", "4"})
        if picked == "4":
            self.output_fn("제작을 취소했습니다.")
            return

        recipe = RECIPES[picked]
        if not self._can_craft(recipe):
            self.output_fn("재료가 부족합니다.")
            return
        if self.ap < recipe.ap_cost:
            self.output_fn("AP가 부족합니다.")
            return

        for keyword, count in recipe.ingredients:
            self._consume_items(keyword, count)
        self.player.add_item(recipe.output_item)
        self.ap -= recipe.ap_cost
        self.player.modify_skill("crafting", 2)
        self.output_fn(f"{recipe.name} 완료: {recipe.output_item} 획득")

    def _print_social_status(self) -> None:
        self.output_fn("")
        self.output_fn("[세력 평판]")
        for key, label in FACTION_LABELS.items():
            score = self.player.faction_reputation[key]
            stage = self._reputation_stage(score)
            self.output_fn(f"- {label}: {score} ({stage})")

        self.output_fn("[칭호]")
        if self.player.titles:
            for title in self.player.titles:
                self.output_fn(f"- {title}")
        else:
            self.output_fn("- 없음")

        self.output_fn("[최근 소문]")
        if not self.player.rumors:
            self.output_fn("- 없음")
        else:
            for rumor in self.player.rumors[-5:]:
                self.output_fn(f"- {rumor}")

    def _balance_profile_menu(self) -> None:
        self.output_fn("")
        self.output_fn("[밸런스 프로필]")
        ordered = ("story", "standard", "hardcore")
        for index, key in enumerate(ordered, start=1):
            profile = BALANCE_PROFILES[key]
            current = " (현재)" if profile.key == self.balance.key else ""
            self.output_fn(
                f"{index}. {profile.label}{current} - {profile.summary}"
            )
        self.output_fn("0. 돌아가기")
        self.output_fn("4. 돌아가기")

        picked = self._ask_choice("프로필 선택 > ", {"0", "1", "2", "3", "4"})
        if picked in {"0", "4"}:
            return

        mapping = {"1": "story", "2": "standard", "3": "hardcore"}
        selected_key = mapping[picked]
        self.balance = BALANCE_PROFILES[selected_key]
        self.output_fn(f"적용 완료: {self.balance.label} 프로필")

    def _growth_menu(self) -> None:
        while True:
            self.output_fn("")
            self.output_fn("[성장/퍼크 관리]")
            self.output_fn(
                f"레벨 {self.player.level} / XP {self.player.xp}/{self.player.xp_to_next_level()}"
            )
            self.output_fn(f"사용 가능 퍼크 포인트: {self.player.perk_points}")
            learned = [perk for perk in self.player.perks if perk in {PERK_WANDERER, PERK_MEDIC, PERK_BARGAINER}]
            if learned:
                self.output_fn("학습한 성장 퍼크:")
                for perk in learned:
                    self.output_fn(f"- {perk}")
            else:
                self.output_fn("학습한 성장 퍼크: 없음")

            self.output_fn(f"1. {PERK_WANDERER} (수색 추가 획득 확률)")
            self.output_fn(f"2. {PERK_MEDIC} (붕대 회복량 증가)")
            self.output_fn(f"3. {PERK_BARGAINER} (세력 거래 캡 보너스)")
            self.output_fn("0. 돌아가기")
            self.output_fn("4. 돌아가기")
            choice = self._ask_choice("퍼크 선택 > ", {"0", "1", "2", "3", "4"})
            if choice in {"0", "4"}:
                return
            if self.player.perk_points <= 0:
                self.output_fn("사용 가능한 퍼크 포인트가 없습니다.")
                continue

            perk = {"1": PERK_WANDERER, "2": PERK_MEDIC, "3": PERK_BARGAINER}[choice]
            if self._has_perk(perk):
                self.output_fn("이미 습득한 퍼크입니다.")
                continue
            self.player.add_perk(perk)
            self.player.perk_points -= 1
            self.output_fn(f"퍼크 습득: {perk}")

    def _quest_menu(self) -> None:
        while True:
            self.output_fn("")
            self.output_fn("[퀘스트 관리]")
            self._print_quest_summary()
            self.output_fn("0. 돌아가기")
            self.output_fn("1. 의뢰 현황 보기")
            self.output_fn("2. 오아시스 의뢰 접수")
            self.output_fn("3. 정화수 전달")
            self.output_fn("4. 분기 선택 진행")
            self.output_fn("5. 돌아가기")
            self.output_fn("6. V.E.R.I.T.A.S. 의뢰")

            choice = self._ask_choice("퀘스트 선택 > ", {"0", "1", "2", "3", "4", "5", "6"})
            if choice in {"0", "5"}:
                return
            if choice == "1":
                self._print_quest_summary()
            elif choice == "2":
                self._quest_start_oasis()
            elif choice == "3":
                self._quest_deliver_water()
            elif choice == "4":
                self._quest_choose_branch()
            elif choice == "6":
                self._quest_veritas_menu()

    def _print_quest_summary(self) -> None:
        self._print_single_quest_summary(OASIS_QUEST_ID, OASIS_QUEST_TITLE)
        self._print_single_quest_summary(VERITAS_QUEST_ID, VERITAS_QUEST_TITLE)

    def _print_single_quest_summary(self, quest_id: str, title: str) -> None:
        quest = self.player.get_quest(quest_id)
        if not quest:
            self.output_fn(f"- {title}: 미수락")
            return
        status = quest.get("status", "unknown")
        stage = quest.get("stage", "unknown")
        objective = quest.get("objective", "-")
        self.output_fn(f"- {title}: {status} / 단계 {stage} / 목표: {objective}")
        if status == "active" and "kills_needed" in quest:
            done = int(quest.get("kills_done", 0))
            needed = int(quest.get("kills_needed", 0))
            self.output_fn(f"  전투 진척: {done}/{needed}")
        if "outcome" in quest:
            self.output_fn(f"  결과: {quest['outcome']}")

    def _quest_start_oasis(self) -> None:
        quest = self.player.get_quest(OASIS_QUEST_ID)
        if quest:
            self.output_fn("이미 의뢰를 진행 중이거나 완료했습니다.")
            return
        self.player.start_quest(
            OASIS_QUEST_ID,
            title=OASIS_QUEST_TITLE,
            stage="collect_water",
            objective="오염 정화수 2개를 확보해 난민 거점에 전달",
        )
        self.player.add_rumor(
            f"DAY {self.day}: 오아시스 난민들이 물 부족으로 도움을 구한다는 소문."
        )
        self.output_fn("오아시스 의뢰를 수락했습니다.")

    def _quest_deliver_water(self) -> None:
        quest = self.player.get_quest(OASIS_QUEST_ID)
        if not quest or quest.get("status") != "active":
            self.output_fn("진행 가능한 의뢰가 없습니다.")
            return
        if quest.get("stage") != "collect_water":
            self.output_fn("지금은 정화수 전달 단계가 아닙니다.")
            return

        if self._count_items("정화수") < 2:
            self.output_fn("정화수 2개가 필요합니다.")
            return
        for _ in range(2):
            self.player.consume_item_containing("정화수")

        self.player.update_quest(
            OASIS_QUEST_ID,
            stage="decision",
            objective="난민 지도자의 제안을 듣고 방향을 결정",
            water_delivered=2,
        )
        self.player.modify_faction_reputation("oasis", 10)
        self._modify_humanity(4)
        self.player.add_relationship_memory(
            f"DAY {self.day}: 오아시스 난민에게 정화수를 전달했다."
        )
        self.output_fn("정화수 전달 완료. 이제 향후 방향을 선택해야 합니다.")
        self._grant_xp(18, "오아시스 전달 단계")

    def _quest_choose_branch(self) -> None:
        quest = self.player.get_quest(OASIS_QUEST_ID)
        if not quest or quest.get("status") != "active":
            self.output_fn("진행 가능한 의뢰가 없습니다.")
            return
        if quest.get("stage") != "decision":
            self.output_fn("지금은 분기 선택 단계가 아닙니다.")
            return

        self.output_fn("1. 난민 거점 보호 임무 수락")
        self.output_fn("2. 물값을 갈취하고 떠난다")
        picked = self._ask_choice("분기 선택 > ", {"1", "2"})

        if picked == "1":
            conflict = self._find_combat_contract_conflict(OASIS_QUEST_ID)
            if conflict:
                self.output_fn(
                    f"이미 {conflict} 전투 의뢰를 수행 중입니다. 현재 의뢰를 먼저 완료하세요."
                )
                return
            self.player.update_quest(
                OASIS_QUEST_ID,
                stage="defend_oasis",
                objective="탐험 중 위협 1회를 격파해 거점 방어",
                kills_needed=1,
                kills_done=0,
            )
            self._award_caps(10)
            self.player.modify_faction_reputation("oasis", 8)
            self.player.add_rumor(
                f"DAY {self.day}: 당신이 오아시스 거점 방어를 맡았다는 소문."
            )
            self.output_fn("보호 루트를 선택했습니다. 탐험 중 전투 승리로 진행됩니다.")
            self._grant_xp(10, "오아시스 방어 임무 수락")
            return

        self.player.complete_quest(OASIS_QUEST_ID, outcome="갈취자")
        self._award_caps(35)
        self.player.modify_faction_reputation("oasis", -25)
        self.player.modify_faction_reputation("crimson_clan", 12)
        self._modify_humanity(-6)
        self.player.add_rumor(
            f"DAY {self.day}: 당신이 오아시스 난민의 물을 빼앗았다는 소문."
        )
        self.output_fn("갈취 루트 완료: 즉시 보상을 얻었지만 오아시스 적대가 심화됐습니다.")
        self._grant_xp(40, "오아시스 갈취 루트 완료")

    def _quest_veritas_menu(self) -> None:
        while True:
            self.output_fn("")
            self.output_fn("[V.E.R.I.T.A.S. 의뢰]")
            self.output_fn("0. 돌아가기")
            self.output_fn("1. 의뢰 접수")
            self.output_fn("2. 중계기 재료 전달")
            self.output_fn("3. 분기 선택 진행")
            self.output_fn("4. 돌아가기")

            choice = self._ask_choice("의뢰 선택 > ", {"0", "1", "2", "3", "4"})
            if choice in {"0", "4"}:
                return
            if choice == "1":
                self._quest_start_veritas()
            elif choice == "2":
                self._quest_deliver_veritas_parts()
            elif choice == "3":
                self._quest_choose_veritas_branch()

    def _quest_start_veritas(self) -> None:
        quest = self.player.get_quest(VERITAS_QUEST_ID)
        if quest:
            self.output_fn("이미 의뢰를 진행 중이거나 완료했습니다.")
            return
        self.player.start_quest(
            VERITAS_QUEST_ID,
            title=VERITAS_QUEST_TITLE,
            stage="collect_parts",
            objective="변이 생체조직 1개와 스크랩 금속 1개를 확보해 전달",
        )
        self.player.add_rumor(
            f"DAY {self.day}: V.E.R.I.T.A.S.가 사라진 중계기 복구 인력을 찾는다는 소문."
        )
        self.output_fn("V.E.R.I.T.A.S. 의뢰를 수락했습니다.")

    def _quest_deliver_veritas_parts(self) -> None:
        quest = self.player.get_quest(VERITAS_QUEST_ID)
        if not quest or quest.get("status") != "active":
            self.output_fn("진행 가능한 의뢰가 없습니다.")
            return
        if quest.get("stage") != "collect_parts":
            self.output_fn("지금은 재료 전달 단계가 아닙니다.")
            return

        if self._count_items("변이 생체조직") < 1:
            self.output_fn("변이 생체조직 1개가 필요합니다.")
            return
        if self._count_items("스크랩 금속") < 1:
            self.output_fn("스크랩 금속 1개가 필요합니다.")
            return

        self.player.consume_item_containing("변이 생체조직")
        self.player.consume_item_containing("스크랩 금속")
        self.player.update_quest(
            VERITAS_QUEST_ID,
            stage="decision",
            objective="복구된 데이터를 누구에게 넘길지 결정",
            parts_delivered=True,
        )
        self.player.modify_faction_reputation("veritas", 6)
        self._modify_humanity(2)
        self.player.add_relationship_memory(
            f"DAY {self.day}: 사라진 중계기 복구 재료를 전달했다."
        )
        self.output_fn("재료 전달 완료. 이제 데이터 처리 방향을 정해야 합니다.")
        self._grant_xp(16, "중계기 재료 전달")

    def _quest_choose_veritas_branch(self) -> None:
        quest = self.player.get_quest(VERITAS_QUEST_ID)
        if not quest or quest.get("status") != "active":
            self.output_fn("진행 가능한 의뢰가 없습니다.")
            return
        if quest.get("stage") != "decision":
            self.output_fn("지금은 분기 선택 단계가 아닙니다.")
            return

        self.output_fn("1. V.E.R.I.T.A.S.에 데이터를 전달해 중계기를 확보한다")
        self.output_fn("2. 데이터를 아토믹 칠드런에게 유출한다")
        picked = self._ask_choice("분기 선택 > ", {"1", "2"})

        if picked == "1":
            conflict = self._find_combat_contract_conflict(VERITAS_QUEST_ID)
            if conflict:
                self.output_fn(
                    f"이미 {conflict} 전투 의뢰를 수행 중입니다. 현재 의뢰를 먼저 완료하세요."
                )
                return
            self.player.update_quest(
                VERITAS_QUEST_ID,
                stage="secure_relay",
                objective="탐험 중 위협 2회를 격파해 중계기 확보",
                kills_needed=2,
                kills_done=0,
            )
            self._award_caps(12)
            self.player.modify_faction_reputation("veritas", 8)
            self.player.modify_faction_reputation("atomic_children", -6)
            self.player.add_rumor(
                f"DAY {self.day}: 당신이 중계기 보호 임무를 맡았다는 소문."
            )
            self.output_fn("보호 루트를 선택했습니다. 탐험 중 전투 승리 2회가 필요합니다.")
            self._grant_xp(12, "중계기 보호 임무 수락")
            return

        self.player.complete_quest(VERITAS_QUEST_ID, outcome="이중첩자")
        self._award_caps(30)
        self.player.modify_faction_reputation("veritas", -20)
        self.player.modify_faction_reputation("atomic_children", 15)
        self._modify_humanity(-4)
        self.player.add_title("회색 중개인")
        self.player.add_rumor(
            f"DAY {self.day}: 당신이 중계기 데이터를 유출했다는 소문."
        )
        self.output_fn("유출 루트 완료: 즉시 보상을 얻었지만 V.E.R.I.T.A.S.의 신뢰를 잃었습니다.")
        self._grant_xp(42, "중계기 데이터 유출")

    def _on_enemy_defeated(self, zone: Zone) -> None:
        self._on_enemy_defeated_oasis(zone)
        self._on_enemy_defeated_veritas(zone)

    def _find_combat_contract_conflict(self, requested_quest_id: str) -> str | None:
        checks = (
            (OASIS_QUEST_ID, OASIS_QUEST_TITLE, "defend_oasis"),
            (VERITAS_QUEST_ID, VERITAS_QUEST_TITLE, "secure_relay"),
        )
        for quest_id, title, stage in checks:
            if quest_id == requested_quest_id:
                continue
            quest = self.player.get_quest(quest_id)
            if not quest or quest.get("status") != "active":
                continue
            if quest.get("stage") == stage:
                return title
        return None

    def _on_enemy_defeated_oasis(self, zone: Zone) -> None:
        quest = self.player.get_quest(OASIS_QUEST_ID)
        if not quest or quest.get("status") != "active":
            return
        if quest.get("stage") != "defend_oasis":
            return

        kills_done = int(quest.get("kills_done", 0)) + 1
        kills_needed = int(quest.get("kills_needed", 1))
        self.player.update_quest(OASIS_QUEST_ID, kills_done=kills_done)
        self.output_fn(f"오아시스 방어 진척: {kills_done}/{kills_needed}")

        if kills_done < kills_needed:
            return

        self.player.complete_quest(OASIS_QUEST_ID, outcome="수호자")
        self.player.modify_faction_reputation("oasis", 20)
        self.player.modify_faction_reputation("veritas", 4)
        self._award_caps(25)
        self._modify_humanity(8)
        self.player.add_title("에덴의 수호자")
        self.player.add_rumor(
            f"DAY {self.day}: {zone.name} 전투 승리로 오아시스를 지켰다는 소문."
        )
        self.output_fn("퀘스트 완료: [한 병의 물] - 수호자 루트")
        self._grant_xp(45, "오아시스 수호 루트 완료")

    def _on_enemy_defeated_veritas(self, zone: Zone) -> None:
        quest = self.player.get_quest(VERITAS_QUEST_ID)
        if not quest or quest.get("status") != "active":
            return
        if quest.get("stage") != "secure_relay":
            return

        kills_done = int(quest.get("kills_done", 0)) + 1
        kills_needed = int(quest.get("kills_needed", 2))
        self.player.update_quest(VERITAS_QUEST_ID, kills_done=kills_done)
        self.output_fn(f"중계기 확보 진척: {kills_done}/{kills_needed}")

        if kills_done < kills_needed:
            return

        self.player.complete_quest(VERITAS_QUEST_ID, outcome="관측자")
        self.player.modify_faction_reputation("veritas", 22)
        self.player.modify_faction_reputation("oasis", 4)
        self._award_caps(28)
        self._modify_humanity(5)
        self.player.add_title("사막의 관측자")
        self.player.add_item("베리타스 신호 키트")
        self.player.add_rumor(
            f"DAY {self.day}: {zone.name} 전투 승리로 중계기를 확보했다는 소문."
        )
        self.output_fn("퀘스트 완료: [사라진 중계기] - 관측자 루트")
        self._grant_xp(50, "중계기 확보 루트 완료")

    def _npc_relationship_menu(self) -> None:
        while True:
            self.output_fn("")
            self.output_fn("[NPC 관계 관리]")
            self.output_fn("0. 돌아가기")
            for index, npc_key in enumerate(NPC_LABELS, start=1):
                label = NPC_LABELS[npc_key]
                stage = self.player.get_npc_relation_stage(npc_key)
                trust = self.player.npc_relations[npc_key]["trust"]
                affection = self.player.npc_relations[npc_key]["affection"]
                self.output_fn(
                    f"{index}. {label} ({stage}, 신뢰 {trust}, 호감 {affection})"
                )
            self.output_fn("4. 돌아가기")

            choice = self._ask_choice("NPC 선택 > ", {"0", "1", "2", "3", "4"})
            if choice in {"0", "4"}:
                return

            npc_key = list(NPC_LABELS.keys())[int(choice) - 1]
            self._npc_interaction(npc_key)

    def _npc_interaction(self, npc_key: str) -> None:
        label = NPC_LABELS[npc_key]
        while True:
            self.output_fn("")
            self.output_fn(f"[{label} 상호작용]")
            stage = self.player.get_npc_relation_stage(npc_key)
            self.output_fn(f"현재 관계 상태: {stage}")
            for stat_key, stat_label in RELATION_STAT_LABELS.items():
                value = self.player.npc_relations[npc_key][stat_key]
                self.output_fn(f"- {stat_label}: {value}")

            self.output_fn("1. 보급품 공유")
            self.output_fn("2. 위협")
            self.output_fn("3. 진솔한 대화")
            self.output_fn("4. 유혹")
            self.output_fn("5. 지배 시도")
            self.output_fn("0. 돌아가기")
            self.output_fn("6. 돌아가기")

            choice = self._ask_choice("행동 선택 > ", {"0", "1", "2", "3", "4", "5", "6"})
            if choice in {"0", "6"}:
                return
            if choice == "1":
                self._npc_action_share_supplies(npc_key)
            elif choice == "2":
                self._npc_action_threaten(npc_key)
            elif choice == "3":
                self._npc_action_honest_talk(npc_key)
            elif choice == "4":
                self._npc_action_seduce(npc_key)
            elif choice == "5":
                self._npc_action_dominate(npc_key)

            self._update_titled_reputation()

    def _npc_action_share_supplies(self, npc_key: str) -> None:
        item = (
            self.player.consume_item_containing("정화수")
            or self.player.consume_item_containing("응급 붕대")
            or self.player.consume_item_containing("천 조각")
        )
        label = NPC_LABELS[npc_key]
        if not item:
            self.output_fn("공유할 보급품이 부족합니다.")
            return
        self.player.modify_npc_relation(npc_key, "trust", 8)
        self.player.modify_npc_relation(npc_key, "affection", 6)
        self.player.modify_npc_relation(npc_key, "fear", -2)
        self._modify_humanity(2)
        faction = NPC_FACTION[npc_key]
        self.player.modify_faction_reputation(faction, 4)
        self.player.add_relationship_memory(
            f"DAY {self.day}: {label}에게 {item}을 건네 신뢰를 얻었다."
        )
        self.player.add_rumor(f"DAY {self.day}: 당신이 {label}를 도왔다는 소문.")
        self.output_fn(f"{label}와의 신뢰가 상승했습니다.")
        self._grant_xp(4, "NPC 보급 공유")

    def _npc_action_threaten(self, npc_key: str) -> None:
        label = NPC_LABELS[npc_key]
        self.player.modify_npc_relation(npc_key, "fear", 10)
        self.player.modify_npc_relation(npc_key, "trust", -8)
        self.player.modify_npc_relation(npc_key, "affection", -6)
        self.player.modify_npc_relation(npc_key, "dom_sub", 8)
        self._modify_humanity(-3)
        self.player.modify_faction_reputation(NPC_FACTION[npc_key], -6)
        self.player.add_relationship_memory(
            f"DAY {self.day}: {label}를 협박해 공포를 심었다."
        )
        self.player.add_rumor(f"DAY {self.day}: 당신의 협박이 과격하다는 소문.")
        self.output_fn(f"{label}는 당신을 두려워하게 되었지만 신뢰를 잃었습니다.")
        self._grant_xp(4, "NPC 위협")

    def _npc_action_honest_talk(self, npc_key: str) -> None:
        label = NPC_LABELS[npc_key]
        check = self.player.core.charisma * 5 + self.player.skills["speech"]
        roll = self.rng.randint(30, 90)
        if check >= roll:
            self.player.modify_npc_relation(npc_key, "trust", 6)
            self.player.modify_npc_relation(npc_key, "affection", 4)
            self.player.modify_npc_relation(npc_key, "fear", -3)
            self.player.modify_faction_reputation(NPC_FACTION[npc_key], 2)
            self.player.add_relationship_memory(
                f"DAY {self.day}: {label}와 진솔한 대화로 관계를 회복했다."
            )
            self.output_fn("대화 성공: 신뢰와 호감이 상승했습니다.")
            self._grant_xp(5, "NPC 대화 성공")
            return

        self.player.modify_npc_relation(npc_key, "trust", -3)
        self.player.modify_npc_relation(npc_key, "fear", 2)
        self.player.add_relationship_memory(
            f"DAY {self.day}: {label}와의 대화가 어긋나 불신이 생겼다."
        )
        self.output_fn("대화 실패: 분위기가 서먹해졌습니다.")
        self._grant_xp(2, "NPC 대화 시도")

    def _npc_action_seduce(self, npc_key: str) -> None:
        label = NPC_LABELS[npc_key]
        check = self.player.core.charisma * 5 + self.player.skills["seduction"]
        roll = self.rng.randint(25, 95)
        if check >= roll:
            self.player.modify_npc_relation(npc_key, "lust", 10)
            self.player.modify_npc_relation(npc_key, "affection", 3)
            self.player.modify_npc_relation(npc_key, "trust", 2)
            self.player.add_relationship_memory(
                f"DAY {self.day}: {label}와 미묘한 긴장이 높아졌다."
            )
            self.output_fn("유혹 성공: 긴장감이 높아졌습니다.")
            self._grant_xp(4, "NPC 유혹 성공")
            return

        self.player.modify_npc_relation(npc_key, "lust", -3)
        self.player.modify_npc_relation(npc_key, "trust", -2)
        self.output_fn("유혹 실패: 상대가 경계합니다.")
        self._grant_xp(2, "NPC 유혹 시도")

    def _npc_action_dominate(self, npc_key: str) -> None:
        label = NPC_LABELS[npc_key]
        check = self.player.core.strength * 5 + self.player.skills["unarmed"] // 2
        roll = self.rng.randint(35, 95)
        if check >= roll:
            self.player.modify_npc_relation(npc_key, "dom_sub", 12)
            self.player.modify_npc_relation(npc_key, "fear", 6)
            self.player.modify_npc_relation(npc_key, "trust", -4)
            self._modify_humanity(-2)
            self.player.add_relationship_memory(
                f"DAY {self.day}: {label}에게 힘의 우위를 각인시켰다."
            )
            self.output_fn("지배 시도 성공: 권력 구도가 변했습니다.")
            self._grant_xp(5, "NPC 지배 성공")
            return

        self.player.modify_npc_relation(npc_key, "dom_sub", -8)
        self.player.modify_npc_relation(npc_key, "fear", 3)
        self.player.modify_npc_relation(npc_key, "trust", -2)
        self.player.survival.modify("hp", -2)
        self.output_fn("지배 시도 실패: 역으로 반격당해 체력 -2")
        self._grant_xp(2, "NPC 지배 시도")

    def _settlement_interaction(self) -> None:
        self.output_fn("")
        self.output_fn("[정착지 상호작용]")
        self.output_fn("0. 돌아가기")
        self.output_fn("1. 오아시스 난민 지원 (정화수 1 필요)")
        self.output_fn("2. 크림슨 상인 암시장 거래 (스크랩 금속 1 판매)")
        self.output_fn("3. V.E.R.I.T.A.S. 연락소 정보 제공 (변이 생체조직 1)")
        self.output_fn("4. 아토믹 칠드런 의식 참가")
        self.output_fn("5. 돌아가기")

        choice = self._ask_choice("상호작용 선택 > ", {"0", "1", "2", "3", "4", "5"})
        if choice in {"0", "5"}:
            return

        if choice == "1":
            water = self.player.consume_item_containing("정화수")
            if not water:
                self.output_fn("정화수가 없어 지원할 수 없습니다.")
                return
            oasis_stage = self._faction_stage("oasis")
            humanity_gain = OASIS_AID_HUMANITY_BY_STAGE[oasis_stage]
            oasis_rep_gain = OASIS_AID_REPUTATION_BY_STAGE[oasis_stage]
            self._modify_humanity(humanity_gain)
            self.player.modify_faction_reputation("oasis", oasis_rep_gain)
            self.player.modify_faction_reputation("crimson_clan", -4)
            self.player.add_rumor(
                f"DAY {self.day}: 당신이 오아시스 난민에게 물을 나눴다는 소문."
            )
            self.output_fn(
                f"난민 지원 완료: 인간성 +{humanity_gain}, 오아시스 평판 +{oasis_rep_gain}"
            )
            self._grant_xp(8, "오아시스 난민 지원")

        elif choice == "2":
            crimson_stage = self._faction_stage("crimson_clan")
            if crimson_stage == "증오":
                self.output_fn("크림슨 상인이 당신을 적으로 간주해 거래를 거부했습니다.")
                return
            sold = self.player.consume_item_containing("스크랩 금속")
            if not sold:
                self.output_fn("판매할 스크랩 금속이 없습니다.")
                return
            gained = self._award_faction_trade_caps(18, "crimson_clan")
            self.player.modify_faction_reputation("crimson_clan", 6)
            self.player.modify_faction_reputation("oasis", -3)
            self.player.add_rumor(
                f"DAY {self.day}: 당신이 크림슨 암시장과 거래했다는 소문."
            )
            self.output_fn(f"암시장 거래 완료({crimson_stage}): 캡 +{gained}")
            self._grant_xp(8, "크림슨 암시장 거래")

        elif choice == "3":
            veritas_stage = self._faction_stage("veritas")
            if veritas_stage == "증오":
                self.output_fn("V.E.R.I.T.A.S. 연락소가 접근을 차단했습니다.")
                return
            sample = self.player.consume_item_containing("변이 생체조직")
            if not sample:
                self.output_fn("제공할 변이 생체조직이 없습니다.")
                return
            gained = self._award_faction_trade_caps(22, "veritas")
            self.player.modify_faction_reputation("veritas", 10)
            self.player.modify_faction_reputation("atomic_children", -5)
            self.player.add_rumor(
                f"DAY {self.day}: V.E.R.I.T.A.S.에 정보를 넘겼다는 소문."
            )
            self.output_fn(
                f"정보 제공 완료({veritas_stage}): 캡 +{gained}, V.E.R.I.T.A.S. 평판 상승"
            )
            self._grant_xp(8, "V.E.R.I.T.A.S. 정보 제공")

        elif choice == "4":
            self._apply_radiation_gain(20)
            self._modify_humanity(-8)
            self.player.modify_faction_reputation("atomic_children", 14)
            self.player.modify_faction_reputation("veritas", -4)
            self.player.add_rumor(
                f"DAY {self.day}: 아토믹 칠드런 의식에 참가했다는 소문."
            )
            self.output_fn("의식 참가: 방사능 상승, 인간성 하락")
            self._grant_xp(6, "아토믹 칠드런 의식")

        self._update_titled_reputation()

    def _scale_positive(self, value: int, pct: int) -> int:
        scaled = int(round(value * pct / 100))
        if value > 0 and pct > 0 and scaled == 0:
            return 1
        return max(0, scaled)

    def _scale_signed(self, delta: int, pct: int) -> int:
        magnitude = abs(delta)
        scaled = int(round(magnitude * pct / 100))
        if magnitude > 0 and pct > 0 and scaled == 0:
            scaled = 1
        if delta < 0:
            return -scaled
        return scaled

    def _combat_fatigue_penalty(self) -> int:
        penalty = 0
        if self.player.survival.hunger <= 20:
            penalty += 2
        if self.player.survival.thirst <= 20:
            penalty += 2
        if self.player.survival.radiation >= 300:
            penalty += 2
        return penalty

    def _attack_hits(self, attack_roll: int, skill_key: str) -> bool:
        score = (
            attack_roll
            + self.player.core.perception
            + self.player.core.agility // 2
            + self.player.skills[skill_key] // 20
            - self._combat_fatigue_penalty()
        )
        return score >= 8

    def _is_player_critical(self, attack_roll: int, skill_key: str, uses_gun: bool) -> bool:
        if attack_roll < 7:
            return False
        crit_score = self.player.core.luck + self.player.skills[skill_key] // 25
        if uses_gun:
            crit_score += 1
        return crit_score >= 7

    def _is_enemy_attack_dodged(self, enemy_roll: int, zone: Zone, defending: bool) -> bool:
        dodge_score = self.player.core.agility + self.player.skills["stealth"] // 20
        if defending:
            dodge_score += 3
        enemy_accuracy = enemy_roll + zone.enemy_attack_min + 3
        return enemy_accuracy < dodge_score

    def _is_enemy_critical(self, enemy_roll: int, zone: Zone) -> bool:
        return zone.key in {"2", "3"} and enemy_roll >= zone.enemy_attack_max

    def _award_caps(self, base_caps: int) -> int:
        gained = self._scale_positive(base_caps, self.balance.caps_reward_pct)
        self.player.modify_caps(gained)
        return gained

    def _has_perk(self, perk: str) -> bool:
        return perk in self.player.perks

    def _grant_xp(self, amount: int, reason: str) -> None:
        if amount <= 0:
            return
        leveled = self.player.add_xp(amount)
        self.output_fn(f"경험치 +{amount} ({reason})")
        if not leveled:
            return
        for level in leveled:
            self.player.survival.modify("hp", 8)
            self.output_fn(f"레벨 업! LV {level} / 퍼크 포인트 +1")

    def _faction_stage(self, faction_key: str) -> str:
        return self._reputation_stage(self.player.faction_reputation[faction_key])

    def _award_faction_trade_caps(self, base_caps: int, faction_key: str) -> int:
        stage = self._faction_stage(faction_key)
        rate = TRADE_RATE_BY_STAGE[stage]
        if rate <= 0:
            return 0
        if self._has_perk(PERK_BARGAINER):
            rate += 10
        stage_adjusted = self._scale_positive(base_caps, rate)
        return self._award_caps(stage_adjusted)

    def _modify_humanity(self, delta: int) -> None:
        if delta == 0:
            return
        pct = self.balance.humanity_gain_pct if delta > 0 else self.balance.humanity_loss_pct
        adjusted = self._scale_signed(delta, pct)
        self.player.survival.modify("humanity", adjusted)

    def _apply_radiation_gain(self, base_gain: int) -> int:
        scaled = self._scale_positive(base_gain, self.balance.radiation_gain_pct)
        resistance = self.player.survival.radiation_resistance
        # Positive resistance mitigates gain, negative resistance amplifies it.
        adjusted = int(round(scaled * (100 - resistance) / 100))
        adjusted = max(0, adjusted)
        self.player.survival.modify("radiation", adjusted)
        return adjusted

    def _can_craft(self, recipe: Recipe) -> bool:
        for keyword, needed in recipe.ingredients:
            if self._count_items(keyword) < needed:
                return False
        return True

    def _count_items(self, keyword: str) -> int:
        return sum(1 for item in self.player.inventory if keyword in item)

    def _consume_items(self, keyword: str, amount: int) -> None:
        consumed = 0
        while consumed < amount:
            item = self.player.consume_item_containing(keyword)
            if not item:
                break
            consumed += 1

    def _effect_bandage(self) -> None:
        heal = 24 if self._has_perk(PERK_MEDIC) else 18
        self.player.survival.modify("hp", heal)
        if self.bleeding_turns > 0:
            self.bleeding_turns = 0
            self.output_fn("응급 처치로 출혈이 멎었습니다.")

    def _effect_iodine(self) -> None:
        self.player.survival.modify("radiation", -40)

    def _effect_antidote(self) -> None:
        self.player.survival.modify("radiation", -80)
        self.player.survival.modify("hp", 5)

    def _effect_painkiller(self) -> None:
        self.player.survival.modify("hp", 10)
        self._modify_humanity(-2)

    def _effect_water(self) -> None:
        self.player.survival.modify("thirst", 35)

    def _apply_survival_penalties(self) -> None:
        if self.player.survival.hunger == 0:
            self.player.survival.modify("hp", -6)
            self.output_fn("허기로 인해 체력 -6")
        if self.player.survival.thirst == 0:
            self.player.survival.modify("hp", -8)
            self.output_fn("탈수로 인해 체력 -8")
        if self.player.survival.radiation >= 500:
            self.player.survival.modify("hp", -5)
            self.output_fn("고방사능 피폭으로 체력 -5")
        self._apply_bleeding_tick()

        if self.player.survival.hp <= 0:
            self.output_fn("치명상으로 쓰러졌습니다. 게임 오버.")
        if self.player.survival.humanity <= 0:
            self.output_fn("인간성을 잃었습니다. 게임 오버.")
        self._update_titled_reputation()

    def _mitigate_guard_damage(self, incoming_damage: int) -> int:
        if incoming_damage <= 0:
            return 0
        reduction = 2 + self.player.core.endurance // 2
        mitigated = max(0, incoming_damage - reduction)
        reduced_by = incoming_damage - mitigated
        self.output_fn(f"방어 성공: 피해 {reduced_by} 감소")
        return mitigated

    def _apply_bleeding(self, turns: int, source: str) -> None:
        if turns <= 0:
            return
        self.bleeding_turns = max(self.bleeding_turns, turns)
        self.output_fn(f"{source}의 치명타로 출혈 발생 ({self.bleeding_turns}턴)")

    def _apply_bleeding_tick(self) -> None:
        if self.bleeding_turns <= 0:
            return
        bleed_damage = 3
        self.player.survival.modify("hp", -bleed_damage)
        self.bleeding_turns = max(0, self.bleeding_turns - 1)
        self.output_fn(f"출혈로 체력 -{bleed_damage} (남은 {self.bleeding_turns}턴)")
        if self.bleeding_turns == 0:
            self.output_fn("출혈이 멎었습니다.")

    def _is_alive(self) -> bool:
        return self.player.survival.hp > 0 and self.player.survival.humanity > 0

    def _reputation_stage(self, score: int) -> str:
        if score <= -75:
            return "증오"
        if score <= -25:
            return "적대"
        if score <= 24:
            return "중립"
        if score <= 74:
            return "우호"
        return "숭배"

    def _update_titled_reputation(self) -> None:
        if self.player.survival.humanity >= 80 and self.player.faction_reputation["oasis"] >= 25:
            self.player.add_title("황무지의 성자")
        if self.player.survival.humanity <= 20 and self.player.faction_reputation["crimson_clan"] >= 25:
            self.player.add_title("약탈왕")
        if self.player.faction_reputation["veritas"] <= -50 and self.player.faction_reputation["crimson_clan"] <= -50:
            self.player.add_title("유령")

    def _ask_choice(self, prompt: str, valid: set[str]) -> str:
        while True:
            raw = self.input_fn(prompt).strip().lstrip("\ufeff")
            normalized = raw.lower()
            if "0" in valid and normalized in {"b", "back", "q", "quit", "exit", "뒤", "뒤로"}:
                return "0"
            if raw in valid:
                return raw
            self.output_fn(f"유효한 선택지를 입력하세요: {', '.join(sorted(valid))}")

    def _publish_live_state(self, phase: str, note: str | None = None) -> None:
        if not self.live_state_bridge:
            return
        self.live_state_bridge.publish(
            self.player,
            day=self.day,
            ap=self.ap,
            max_ap=self.max_ap,
            balance_profile_key=self.balance.key,
            balance_profile_label=self.balance.label,
            phase=phase,
            note=note,
        )
