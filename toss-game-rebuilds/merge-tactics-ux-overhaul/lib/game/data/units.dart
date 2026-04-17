class UnitData {
  const UnitData({
    required this.id,
    required this.name,
    required this.tier,
    required this.hp,
    required this.attack,
    required this.defense,
    required this.attackSpeed,
    required this.range,
    required this.skill,
    required this.spriteAsset,
  });

  final String id;
  final String name;
  final int tier;
  final int hp;
  final int attack;
  final int defense;
  final double attackSpeed;
  final double range;
  final String skill;
  final String spriteAsset;
}

const List<UnitData> units = <UnitData>[
  UnitData(
    id: 'warrior_1',
    name: '견습 전사',
    tier: 1,
    hp: 300,
    attack: 45,
    defense: 20,
    attackSpeed: 1.0,
    range: 1,
    skill: 'slash',
    spriteAsset: 'kenney/characters/player_green',
  ),
  UnitData(
    id: 'warrior_2',
    name: '전사',
    tier: 2,
    hp: 650,
    attack: 95,
    defense: 45,
    attackSpeed: 1.0,
    range: 1,
    skill: 'power_slash',
    spriteAsset: 'kenney/characters/player_green_2',
  ),
  UnitData(
    id: 'warrior_3',
    name: '기사',
    tier: 3,
    hp: 1400,
    attack: 200,
    defense: 100,
    attackSpeed: 1.0,
    range: 1,
    skill: 'shield_bash',
    spriteAsset: 'kenney/characters/player_knight',
  ),
  UnitData(
    id: 'warrior_4',
    name: '성기사',
    tier: 4,
    hp: 3000,
    attack: 420,
    defense: 220,
    attackSpeed: 1.1,
    range: 1,
    skill: 'holy_strike',
    spriteAsset: 'kenney/characters/player_paladin',
  ),
  UnitData(
    id: 'warrior_5',
    name: '전설의 기사',
    tier: 5,
    hp: 6500,
    attack: 900,
    defense: 480,
    attackSpeed: 1.2,
    range: 1,
    skill: 'divine_judgment',
    spriteAsset: 'kenney/characters/player_legend',
  ),
  UnitData(
    id: 'archer_1',
    name: '견습 궁수',
    tier: 1,
    hp: 200,
    attack: 60,
    defense: 10,
    attackSpeed: 1.5,
    range: 3,
    skill: 'arrow_shot',
    spriteAsset: 'kenney/characters/player_blue',
  ),
  UnitData(
    id: 'archer_2',
    name: '궁수',
    tier: 2,
    hp: 430,
    attack: 125,
    defense: 22,
    attackSpeed: 1.5,
    range: 3,
    skill: 'double_shot',
    spriteAsset: 'kenney/characters/player_blue_2',
  ),
  UnitData(
    id: 'archer_3',
    name: '정예 궁수',
    tier: 3,
    hp: 920,
    attack: 265,
    defense: 48,
    attackSpeed: 1.6,
    range: 3.5,
    skill: 'piercing_arrow',
    spriteAsset: 'kenney/characters/player_ranger',
  ),
  UnitData(
    id: 'mage_1',
    name: '견습 마법사',
    tier: 1,
    hp: 180,
    attack: 75,
    defense: 8,
    attackSpeed: 0.8,
    range: 3,
    skill: 'fireball',
    spriteAsset: 'kenney/characters/player_red',
  ),
  UnitData(
    id: 'mage_2',
    name: '마법사',
    tier: 2,
    hp: 390,
    attack: 155,
    defense: 18,
    attackSpeed: 0.9,
    range: 3,
    skill: 'ice_bolt',
    spriteAsset: 'kenney/characters/player_red_2',
  ),
  UnitData(
    id: 'mage_3',
    name: '대마법사',
    tier: 3,
    hp: 840,
    attack: 330,
    defense: 40,
    attackSpeed: 1.0,
    range: 3.5,
    skill: 'meteor',
    spriteAsset: 'kenney/characters/player_mage',
  ),
  UnitData(
    id: 'healer_1',
    name: '수련 사제',
    tier: 1,
    hp: 250,
    attack: 20,
    defense: 15,
    attackSpeed: 0.7,
    range: 2.5,
    skill: 'heal',
    spriteAsset: 'kenney/characters/player_yellow',
  ),
  UnitData(
    id: 'healer_2',
    name: '사제',
    tier: 2,
    hp: 540,
    attack: 42,
    defense: 32,
    attackSpeed: 0.8,
    range: 2.5,
    skill: 'mass_heal',
    spriteAsset: 'kenney/characters/player_yellow_2',
  ),
  UnitData(
    id: 'tank_1',
    name: '방패병',
    tier: 1,
    hp: 500,
    attack: 30,
    defense: 40,
    attackSpeed: 0.7,
    range: 1,
    skill: 'taunt',
    spriteAsset: 'kenney/characters/player_shield',
  ),
  UnitData(
    id: 'tank_2',
    name: '철갑 방패병',
    tier: 2,
    hp: 1100,
    attack: 65,
    defense: 88,
    attackSpeed: 0.7,
    range: 1,
    skill: 'fortress',
    spriteAsset: 'kenney/characters/player_shield_2',
  ),
];

final Map<String, UnitData> unitCatalog = <String, UnitData>{
  for (final UnitData unit in units) unit.id: unit,
};

UnitData unitById(String id) {
  final UnitData? data = unitCatalog[id];
  if (data == null) {
    throw ArgumentError.value(id, 'id', 'Unknown unit id.');
  }
  return data;
}

String unitFamilyId(String unitId) {
  final int separatorIndex = unitId.lastIndexOf('_');
  if (separatorIndex < 0) {
    return unitId;
  }
  return unitId.substring(0, separatorIndex);
}

UnitData? nextTierUnitById(String unitId) {
  final UnitData? current = unitCatalog[unitId];
  if (current == null || current.tier >= 5) {
    return null;
  }
  final String nextId = '${unitFamilyId(unitId)}_${current.tier + 1}';
  return unitCatalog[nextId];
}
