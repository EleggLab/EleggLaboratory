from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import ClassVar, Dict, List


CORE_STAT_MIN = 1
CORE_STAT_MAX = 10
SKILL_MIN = 0
SKILL_MAX = 100
REPUTATION_MIN = -100
REPUTATION_MAX = 100
RELATION_MIN = -100
RELATION_MAX = 100
LEVEL_MIN = 1

FACTION_LABELS = {
    "veritas": "V.E.R.I.T.A.S.",
    "crimson_clan": "크림슨 클랜",
    "oasis": "오아시스",
    "atomic_children": "아토믹 칠드런",
}

NPC_LABELS = {
    "kate": "케이트",
    "finch": "핀치",
    "blaze": "블레이즈",
}

NPC_FACTION = {
    "kate": "oasis",
    "finch": "oasis",
    "blaze": "crimson_clan",
}

RELATION_STAT_LABELS = {
    "trust": "신뢰",
    "affection": "호감",
    "fear": "공포",
    "lust": "욕정",
    "dom_sub": "지배/복종",
}

SKILL_LABELS = {
    "small_guns": "소형 화기",
    "energy_weapons": "에너지 무기",
    "melee_weapons": "근접 무기",
    "throwing": "투척 무기",
    "unarmed": "맨손 격투",
    "speech": "화술",
    "barter": "거래",
    "leadership": "리더십",
    "repair": "수리",
    "science": "과학",
    "medicine": "의학",
    "crafting": "제작",
    "stealth": "은신",
    "survival": "생존술",
    "seduction": "유혹",
    "prostitution": "매춘",
    "training": "조교",
}


def _clamp(value: int, minimum: int, maximum: int) -> int:
    return max(minimum, min(maximum, value))


@dataclass
class CoreStats:
    strength: int = 5
    perception: int = 5
    endurance: int = 5
    charisma: int = 5
    intelligence: int = 5
    agility: int = 5
    luck: int = 5

    def modify(self, stat_name: str, delta: int) -> None:
        if not hasattr(self, stat_name):
            raise KeyError(f"Unknown core stat: {stat_name}")
        current = getattr(self, stat_name)
        setattr(
            self,
            stat_name,
            _clamp(current + delta, CORE_STAT_MIN, CORE_STAT_MAX),
        )


@dataclass
class SurvivalStats:
    hp: int = 100
    humanity: int = 60
    hunger: int = 100
    thirst: int = 100
    radiation: int = 0
    radiation_resistance: int = 0

    bounds: ClassVar[Dict[str, tuple[int, int]]] = {
        "hp": (0, 100),
        "humanity": (0, 100),
        "hunger": (0, 100),
        "thirst": (0, 100),
        "radiation": (0, 1000),
        "radiation_resistance": (-100, 100),
    }

    def modify(self, stat_name: str, delta: int) -> None:
        if stat_name not in self.bounds:
            raise KeyError(f"Unknown survival stat: {stat_name}")
        low, high = self.bounds[stat_name]
        current = getattr(self, stat_name)
        setattr(self, stat_name, _clamp(current + delta, low, high))

    def as_dict(self) -> Dict[str, int]:
        return {
            "hp": self.hp,
            "humanity": self.humanity,
            "hunger": self.hunger,
            "thirst": self.thirst,
            "radiation": self.radiation,
            "radiation_resistance": self.radiation_resistance,
        }


def default_skills() -> Dict[str, int]:
    return {
        "small_guns": 0,
        "energy_weapons": 0,
        "melee_weapons": 0,
        "throwing": 0,
        "unarmed": 0,
        "speech": 0,
        "barter": 0,
        "leadership": 0,
        "repair": 0,
        "science": 0,
        "medicine": 0,
        "crafting": 0,
        "stealth": 0,
        "survival": 0,
        "seduction": 0,
        "prostitution": 0,
        "training": 0,
    }


def default_faction_reputation() -> Dict[str, int]:
    return {key: 0 for key in FACTION_LABELS}


def default_npc_relations() -> Dict[str, Dict[str, int]]:
    # Base relation profile for major prototype NPCs.
    return {
        "kate": {"trust": 0, "affection": 5, "fear": 0, "lust": 0, "dom_sub": 0},
        "finch": {"trust": 5, "affection": 0, "fear": 0, "lust": 0, "dom_sub": 0},
        "blaze": {"trust": -10, "affection": -5, "fear": 10, "lust": 0, "dom_sub": 15},
    }


def default_quest_log() -> Dict[str, Dict[str, object]]:
    return {}


@dataclass
class PlayerCharacter:
    name: str = "Unnamed"
    gender: str = "Unknown"
    appearance: str = "Unknown"
    core: CoreStats = field(default_factory=CoreStats)
    survival: SurvivalStats = field(default_factory=SurvivalStats)
    skills: Dict[str, int] = field(default_factory=default_skills)
    perks: List[str] = field(default_factory=list)
    story_tags: List[str] = field(default_factory=list)
    inventory: List[str] = field(default_factory=list)
    creation_choices: Dict[str, str] = field(default_factory=dict)
    faction_reputation: Dict[str, int] = field(default_factory=default_faction_reputation)
    npc_relations: Dict[str, Dict[str, int]] = field(default_factory=default_npc_relations)
    quest_log: Dict[str, Dict[str, object]] = field(default_factory=default_quest_log)
    titles: List[str] = field(default_factory=list)
    rumors: List[str] = field(default_factory=list)
    relationship_memories: List[str] = field(default_factory=list)
    caps: int = 0
    level: int = LEVEL_MIN
    xp: int = 0
    perk_points: int = 0

    def modify_skill(self, skill_name: str, delta: int) -> None:
        if skill_name not in self.skills:
            raise KeyError(f"Unknown skill: {skill_name}")
        self.skills[skill_name] = _clamp(
            self.skills[skill_name] + delta,
            SKILL_MIN,
            SKILL_MAX,
        )

    def add_perk(self, perk: str) -> None:
        if perk not in self.perks:
            self.perks.append(perk)

    def add_story_tag(self, tag: str) -> None:
        if tag not in self.story_tags:
            self.story_tags.append(tag)

    def add_item(self, item_name: str) -> None:
        self.inventory.append(item_name)

    def has_item_containing(self, keyword: str) -> bool:
        return any(keyword in item for item in self.inventory)

    def consume_item_containing(self, keyword: str) -> str | None:
        for index, item in enumerate(self.inventory):
            if keyword in item:
                return self.inventory.pop(index)
        return None

    def set_creation_choice(self, scene_id: str, option_key: str) -> None:
        self.creation_choices[scene_id] = option_key

    def modify_faction_reputation(self, faction_key: str, delta: int) -> None:
        if faction_key not in self.faction_reputation:
            raise KeyError(f"Unknown faction: {faction_key}")
        current = self.faction_reputation[faction_key]
        self.faction_reputation[faction_key] = _clamp(
            current + delta,
            REPUTATION_MIN,
            REPUTATION_MAX,
        )

    def modify_npc_relation(self, npc_key: str, stat_key: str, delta: int) -> None:
        if npc_key not in self.npc_relations:
            raise KeyError(f"Unknown NPC: {npc_key}")
        if stat_key not in self.npc_relations[npc_key]:
            raise KeyError(f"Unknown relation stat: {stat_key}")
        current = self.npc_relations[npc_key][stat_key]
        self.npc_relations[npc_key][stat_key] = _clamp(
            current + delta,
            RELATION_MIN,
            RELATION_MAX,
        )

    def add_relationship_memory(self, memory: str) -> None:
        self.relationship_memories.append(memory)
        if len(self.relationship_memories) > 80:
            self.relationship_memories = self.relationship_memories[-80:]

    def start_quest(self, quest_id: str, title: str, stage: str, objective: str) -> None:
        if quest_id in self.quest_log:
            return
        self.quest_log[quest_id] = {
            "title": title,
            "status": "active",
            "stage": stage,
            "objective": objective,
        }

    def update_quest(self, quest_id: str, **fields: object) -> None:
        if quest_id not in self.quest_log:
            raise KeyError(f"Unknown quest: {quest_id}")
        self.quest_log[quest_id].update(fields)

    def complete_quest(self, quest_id: str, outcome: str) -> None:
        if quest_id not in self.quest_log:
            raise KeyError(f"Unknown quest: {quest_id}")
        self.quest_log[quest_id]["status"] = "completed"
        self.quest_log[quest_id]["stage"] = "completed"
        self.quest_log[quest_id]["objective"] = "완료"
        self.quest_log[quest_id]["outcome"] = outcome

    def get_quest(self, quest_id: str) -> Dict[str, object] | None:
        return self.quest_log.get(quest_id)

    def is_quest_active(self, quest_id: str) -> bool:
        quest = self.quest_log.get(quest_id)
        return bool(quest and quest.get("status") == "active")

    def is_quest_completed(self, quest_id: str) -> bool:
        quest = self.quest_log.get(quest_id)
        return bool(quest and quest.get("status") == "completed")

    def get_npc_relation_stage(self, npc_key: str) -> str:
        if npc_key not in self.npc_relations:
            raise KeyError(f"Unknown NPC: {npc_key}")
        r = self.npc_relations[npc_key]
        trust = r["trust"]
        affection = r["affection"]
        fear = r["fear"]
        lust = r["lust"]
        dom_sub = r["dom_sub"]

        if trust >= 80 and affection >= 50:
            return "생존 파트너"
        if abs(dom_sub) >= 70 and fear >= 35:
            return "주인/노예"
        if trust <= -50 and fear >= 30 and affection >= 20:
            return "숙적"
        if trust >= 20 and dom_sub <= -60:
            return "의존자"
        if fear >= 60 and trust <= -40 and affection <= -20:
            return "약탈 대상"
        if lust >= 40 and affection >= 20:
            return "강한 긴장"
        return "중립"

    def add_title(self, title: str) -> None:
        if title not in self.titles:
            self.titles.append(title)

    def add_rumor(self, rumor: str) -> None:
        self.rumors.append(rumor)
        # Keep latest 50 rumors only.
        if len(self.rumors) > 50:
            self.rumors = self.rumors[-50:]

    def modify_caps(self, delta: int) -> None:
        self.caps = max(0, self.caps + delta)

    def xp_to_next_level(self) -> int:
        return 100 + (self.level - LEVEL_MIN) * 50

    def add_xp(self, amount: int) -> List[int]:
        gained = max(0, amount)
        if gained == 0:
            return []
        self.xp += gained
        leveled: List[int] = []
        while self.xp >= self.xp_to_next_level():
            self.xp -= self.xp_to_next_level()
            self.level += 1
            self.perk_points += 1
            leveled.append(self.level)
        return leveled

    def as_dict(self) -> Dict[str, object]:
        return {
            "name": self.name,
            "gender": self.gender,
            "appearance": self.appearance,
            "core": asdict(self.core),
            "survival": self.survival.as_dict(),
            "skills": dict(self.skills),
            "perks": list(self.perks),
            "story_tags": list(self.story_tags),
            "inventory": list(self.inventory),
            "creation_choices": dict(self.creation_choices),
            "faction_reputation": dict(self.faction_reputation),
            "npc_relations": {
                npc_key: dict(stats)
                for npc_key, stats in self.npc_relations.items()
            },
            "quest_log": {
                quest_id: dict(state)
                for quest_id, state in self.quest_log.items()
            },
            "titles": list(self.titles),
            "rumors": list(self.rumors),
            "relationship_memories": list(self.relationship_memories),
            "caps": self.caps,
            "level": self.level,
            "xp": self.xp,
            "perk_points": self.perk_points,
        }
