from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Iterable, Tuple

from .models import NPC_LABELS, PlayerCharacter, SKILL_LABELS


SCENE_TITLES = {
    "opening_caravan": "오프닝 선택",
    "memory_childhood": "기억의 편린 1",
    "memory_survival_style": "기억의 편린 2",
    "memory_scars": "기억의 편린 3",
    "opening_betrayal_bonus": "밀고 보너스",
}


@dataclass(frozen=True)
class Effect:
    core_mods: Dict[str, int] = field(default_factory=dict)
    skill_mods: Dict[str, int] = field(default_factory=dict)
    survival_mods: Dict[str, int] = field(default_factory=dict)
    perks: Tuple[str, ...] = ()
    story_tags: Tuple[str, ...] = ()


@dataclass(frozen=True)
class Option:
    key: str
    text: str
    effect: Effect


@dataclass(frozen=True)
class Scene:
    scene_id: str
    title: str
    prompt: str
    options: Tuple[Option, ...]


def apply_effect(player: PlayerCharacter, effect: Effect) -> None:
    for stat_name, delta in effect.core_mods.items():
        player.core.modify(stat_name, delta)
    for skill_name, delta in effect.skill_mods.items():
        player.modify_skill(skill_name, delta)
    for stat_name, delta in effect.survival_mods.items():
        player.survival.modify(stat_name, delta)
    for perk in effect.perks:
        player.add_perk(perk)
    for tag in effect.story_tags:
        player.add_story_tag(tag)


def opening_scene() -> Scene:
    prompt = (
        "당신은 노예 상인의 트럭 짐칸에서 깨어났다.\n"
        "옆의 포로가 탈출용 쇳조각을 건네며 함께 도망치자고 제안한다."
    )
    return Scene(
        scene_id="opening_caravan",
        title="오프닝: 의문의 캐러밴",
        prompt=prompt,
        options=(
            Option(
                key="1",
                text="제안을 받아들인다. (운 +1)",
                effect=Effect(core_mods={"luck": 1}, story_tags=("trusted_stranger",)),
            ),
            Option(
                key="2",
                text="그를 믿지 않는다. (인지 +1)",
                effect=Effect(
                    core_mods={"perception": 1},
                    story_tags=("cautious_survivor",),
                ),
            ),
            Option(
                key="3",
                text="그를 이용해 상인에게 밀고한다. (매력 +1 또는 지능 +1)",
                effect=Effect(story_tags=("betrayer",)),
            ),
        ),
    )


def memory_scene_childhood() -> Scene:
    return Scene(
        scene_id="memory_childhood",
        title="기억의 편린 1: 어린 시절",
        prompt=(
            "폐허 속 어린 시절의 기억.\n"
            "흉포한 들개가 당신을 향해 달려오고 있다."
        ),
        options=(
            Option(
                key="1",
                text="쇠 파이프를 들고 맞서 싸웠다. (근력 +1)",
                effect=Effect(core_mods={"strength": 1}, story_tags=("fighter",)),
            ),
            Option(
                key="2",
                text="잔해 더미 속으로 빠르게 숨었다. (민첩 +1)",
                effect=Effect(core_mods={"agility": 1}, story_tags=("sneaky",)),
            ),
            Option(
                key="3",
                text="주의를 돌릴 물건을 찾아 던졌다. (인지 +1)",
                effect=Effect(core_mods={"perception": 1}, story_tags=("tactician",)),
            ),
        ),
    )


def memory_scene_survival_style() -> Scene:
    return Scene(
        scene_id="memory_survival_style",
        title="기억의 편린 2: 생존 방식",
        prompt="황무지에서 살아남기 위해 당신이 연마한 기술은 무엇인가?",
        options=(
            Option(
                key="1",
                text="말보다 주먹이 앞섰다. (소형 화기 +10, 근접 무기 +10)",
                effect=Effect(
                    skill_mods={"small_guns": 10, "melee_weapons": 10},
                    story_tags=("combat_focus",),
                ),
            ),
            Option(
                key="2",
                text="사람의 마음을 얻는 데 능숙했다. (화술 +10, 거래 +10)",
                effect=Effect(
                    skill_mods={"speech": 10, "barter": 10},
                    story_tags=("social_focus",),
                ),
            ),
            Option(
                key="3",
                text="기계와 단말기를 다루는 데 익숙했다. (수리 +10, 과학 +10)",
                effect=Effect(
                    skill_mods={"repair": 10, "science": 10},
                    story_tags=("tech_focus",),
                ),
            ),
        ),
    )


def memory_scene_scars() -> Scene:
    return Scene(
        scene_id="memory_scars",
        title="기억의 편린 3: 잊을 수 없는 상처",
        prompt="황무지에서 살아남은 흔적이 당신의 몸에 남아 있다.",
        options=(
            Option(
                key="1",
                text="변이 생물에게 물린 흉터. (방사능 저항 -10, 지구력 +1)",
                effect=Effect(
                    core_mods={"endurance": 1},
                    survival_mods={"radiation_resistance": -10},
                    story_tags=("mutant_scar",),
                ),
            ),
            Option(
                key="2",
                text="인간에게 고문당한 흉터. (초기 인간성 -10, 매력 +1)",
                effect=Effect(
                    core_mods={"charisma": 1},
                    survival_mods={"humanity": -10},
                    story_tags=("torture_scar",),
                ),
            ),
            Option(
                key="3",
                text="정체불명 실험 흔적. (특수 퍽, 운 +1)",
                effect=Effect(
                    core_mods={"luck": 1},
                    perks=("미지의 잠재력",),
                    story_tags=("unknown_experiment",),
                ),
            ),
        ),
    )


def all_creation_scenes() -> Tuple[Scene, ...]:
    return (
        opening_scene(),
        memory_scene_childhood(),
        memory_scene_survival_style(),
        memory_scene_scars(),
    )


def get_option(scene: Scene, key: str) -> Option:
    for option in scene.options:
        if option.key == key:
            return option
    raise KeyError(f"Unknown option '{key}' for scene '{scene.scene_id}'")


def apply_betrayal_bonus(player: PlayerCharacter, key: str) -> None:
    if key == "1":
        player.core.modify("charisma", 1)
        player.add_story_tag("betrayal_charisma_bonus")
        player.set_creation_choice("opening_betrayal_bonus", key)
        return
    if key == "2":
        player.core.modify("intelligence", 1)
        player.add_story_tag("betrayal_intelligence_bonus")
        player.set_creation_choice("opening_betrayal_bonus", key)
        return
    raise KeyError("Unknown betrayal bonus option")


def assign_starting_loadout(player: PlayerCharacter) -> Tuple[str, ...]:
    """기획서 13.2의 '선택에 따른 시작 장비 결정'을 반영한다."""
    opening_choice = player.creation_choices.get("opening_caravan")
    style_choice = player.creation_choices.get("memory_survival_style")
    scar_choice = player.creation_choices.get("memory_scars")

    items: list[str] = []

    if opening_choice == "1":
        items.extend(["탈출용 쇳조각", "낡은 행운의 부적"])
        player.modify_caps(8)
    elif opening_choice == "2":
        items.extend(["균열 난 단안경", "매듭 칼"])
        player.modify_caps(12)
    elif opening_choice == "3":
        items.extend(["은닉 주머니", "거래용 위조 신분표"])
        player.modify_caps(18)

    if style_choice == "1":
        items.extend(["녹슨 권총", "9mm 탄약 x10", "쇠 파이프"])
    elif style_choice == "2":
        items.extend(["교환용 은 조각", "오염 정화수 x1", "거래 수첩"])
    elif style_choice == "3":
        items.extend(["휴대 수리 키트", "멀티툴", "폐배터리 x2"])

    if scar_choice == "1":
        items.append("요오드 정제 x1")
    elif scar_choice == "2":
        items.append("진통제 x1")
    elif scar_choice == "3":
        items.append("정체불명 주사기 x1")

    for item in items:
        if item not in player.inventory:
            player.add_item(item)

    if items:
        player.add_story_tag("starting_loadout_assigned")
    return tuple(items)


def format_character_sheet(player: PlayerCharacter) -> str:
    core_lines = [
        f"근력 {player.core.strength}",
        f"인지 {player.core.perception}",
        f"지구력 {player.core.endurance}",
        f"매력 {player.core.charisma}",
        f"지능 {player.core.intelligence}",
        f"민첩 {player.core.agility}",
        f"운 {player.core.luck}",
    ]
    non_zero_skills = []
    for name, value in sorted(player.skills.items()):
        if value <= 0:
            continue
        label = SKILL_LABELS.get(name, name)
        non_zero_skills.append(f"- {label}: {value}")
    if not non_zero_skills:
        non_zero_skills = ["- 없음"]
    perk_lines = [f"- {perk}" for perk in player.perks] or ["- 없음"]
    tag_lines = [f"- {tag}" for tag in player.story_tags] or ["- 없음"]
    inventory_lines = [f"- {item}" for item in player.inventory] or ["- 없음"]

    choice_lines = []
    for scene_id, option_key in player.creation_choices.items():
        scene_label = SCENE_TITLES.get(scene_id, scene_id)
        choice_lines.append(f"- {scene_label}: {option_key}")
    if not choice_lines:
        choice_lines = ["- 없음"]
    title_lines = [f"- {title}" for title in player.titles] or ["- 없음"]

    reputation_lines = []
    for faction_key, value in player.faction_reputation.items():
        label = {
            "veritas": "V.E.R.I.T.A.S.",
            "crimson_clan": "크림슨 클랜",
            "oasis": "오아시스",
            "atomic_children": "아토믹 칠드런",
        }.get(faction_key, faction_key)
        reputation_lines.append(f"- {label}: {value}")
    if not reputation_lines:
        reputation_lines = ["- 없음"]

    relation_lines = []
    for npc_key, stats in player.npc_relations.items():
        label = NPC_LABELS.get(npc_key, npc_key)
        stage = player.get_npc_relation_stage(npc_key)
        relation_lines.append(
            f"- {label}: {stage} "
            f"(신뢰 {stats['trust']}, 호감 {stats['affection']}, 공포 {stats['fear']}, "
            f"욕정 {stats['lust']}, 지배/복종 {stats['dom_sub']})"
        )
    if not relation_lines:
        relation_lines = ["- 없음"]

    return "\n".join(
        [
            "",
            "=== 캐릭터 시트 ===",
            f"이름: {player.name}",
            f"성별: {player.gender}",
            f"외형: {player.appearance}",
            "",
            "[S.P.E.C.I.A.L]",
            *core_lines,
            "",
            "[생존 스탯]",
            f"체력 {player.survival.hp}",
            f"인간성 {player.survival.humanity}",
            f"허기 {player.survival.hunger}",
            f"갈증 {player.survival.thirst}",
            f"방사능 {player.survival.radiation}",
            f"방사능 저항 {player.survival.radiation_resistance}",
            f"캡 {player.caps}",
            f"레벨 {player.level}",
            f"경험치 {player.xp}/{player.xp_to_next_level()}",
            f"퍼크 포인트 {player.perk_points}",
            "",
            "[스킬]",
            *non_zero_skills,
            "",
            "[퍽]",
            *perk_lines,
            "",
            "[시작 장비]",
            *inventory_lines,
            "",
            "[캐릭터 생성 선택 기록]",
            *choice_lines,
            "",
            "[세력 평판]",
            *reputation_lines,
            "",
            "[칭호]",
            *title_lines,
            "",
            "[NPC 관계]",
            *relation_lines,
            "",
            "[스토리 태그]",
            *tag_lines,
            "",
        ]
    )


def list_option_keys(scene: Scene) -> Iterable[str]:
    return (option.key for option in scene.options)
