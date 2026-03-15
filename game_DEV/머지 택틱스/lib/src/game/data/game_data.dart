import '../../resources/resource_map.dart';
import '../models/synergy_rule.dart';
import '../models/unit_definition.dart';

const List<String> summonableTier1UnitIds = <String>[
  'human_swordsman_t1',
  'elf_archer_t1',
  'orc_warrior_t1',
];

const Map<String, UnitDefinition> unitCatalog = <String, UnitDefinition>{
  // Tier 1
  'human_swordsman_t1': UnitDefinition(
    id: 'human_swordsman_t1',
    name: '검사',
    tier: 1,
    race: UnitRace.human,
    job: UnitJob.warrior,
    baseHealth: 100,
    baseAttack: 15,
    attackRange: 1,
    maxMana: 100,
    skillName: '-',
    skillDescription: '기본 근접 공격 유닛',
    placeholderAsset: ResourceMap.unitSquare,
    nextTierId: 'human_heavy_swordsman_t2',
  ),
  'elf_archer_t1': UnitDefinition(
    id: 'elf_archer_t1',
    name: '궁수',
    tier: 1,
    race: UnitRace.elf,
    job: UnitJob.archer,
    baseHealth: 70,
    baseAttack: 10,
    attackRange: 4,
    maxMana: 100,
    skillName: '-',
    skillDescription: '기본 원거리 공격 유닛',
    placeholderAsset: ResourceMap.unitTriangle,
    nextTierId: 'elf_sharpshooter_t2',
  ),
  'orc_warrior_t1': UnitDefinition(
    id: 'orc_warrior_t1',
    name: '오크 전사',
    tier: 1,
    race: UnitRace.orc,
    job: UnitJob.warrior,
    baseHealth: 120,
    baseAttack: 18,
    attackRange: 1,
    maxMana: 100,
    skillName: '-',
    skillDescription: '체력이 높은 전열 유닛',
    placeholderAsset: ResourceMap.unitCircle,
    nextTierId: 'orc_berserker_t2',
  ),

  // Tier 2
  'human_heavy_swordsman_t2': UnitDefinition(
    id: 'human_heavy_swordsman_t2',
    name: '중갑 검사',
    tier: 2,
    race: UnitRace.human,
    job: UnitJob.warrior,
    baseHealth: 220,
    baseAttack: 30,
    attackRange: 1,
    maxMana: 100,
    skillName: '방패 올리기',
    skillDescription: '3초(틱) 동안 방어력 50% 증가',
    placeholderAsset: ResourceMap.unitSquareIron,
    nextTierId: 'human_paladin_t3',
  ),
  'elf_sharpshooter_t2': UnitDefinition(
    id: 'elf_sharpshooter_t2',
    name: '명사수',
    tier: 2,
    race: UnitRace.elf,
    job: UnitJob.archer,
    baseHealth: 150,
    baseAttack: 22,
    attackRange: 5,
    maxMana: 100,
    skillName: '약점 조준',
    skillDescription: '다음 공격이 반드시 치명타',
    placeholderAsset: ResourceMap.unitTriangleGold,
    nextTierId: 'elf_shadow_archer_t3',
  ),
  'orc_berserker_t2': UnitDefinition(
    id: 'orc_berserker_t2',
    name: '광전사',
    tier: 2,
    race: UnitRace.orc,
    job: UnitJob.warrior,
    baseHealth: 250,
    baseAttack: 40,
    attackRange: 1,
    maxMana: 100,
    skillName: '광기',
    skillDescription: '체력 50% 이하에서 공격력 30% 증가',
    placeholderAsset: ResourceMap.unitCircleRed,
    nextTierId: 'orc_destroyer_t3',
  ),

  // Tier 3
  'human_paladin_t3': UnitDefinition(
    id: 'human_paladin_t3',
    name: '성기사',
    tier: 3,
    race: UnitRace.human,
    job: UnitJob.knight,
    baseHealth: 500,
    baseAttack: 60,
    attackRange: 1,
    maxMana: 100,
    skillName: '신성한 빛',
    skillDescription: '체력이 가장 낮은 아군 1명 회복(100)',
    placeholderAsset: ResourceMap.unitSquareDeluxe,
  ),
  'elf_shadow_archer_t3': UnitDefinition(
    id: 'elf_shadow_archer_t3',
    name: '그림자 궁수',
    tier: 3,
    race: UnitRace.elf,
    job: UnitJob.assassin,
    baseHealth: 300,
    baseAttack: 50,
    attackRange: 6,
    maxMana: 100,
    skillName: '은신',
    skillDescription: '3초(틱) 동안 적의 타겟팅 대상 제외',
    placeholderAsset: ResourceMap.unitTriangleBlack,
  ),
  'orc_destroyer_t3': UnitDefinition(
    id: 'orc_destroyer_t3',
    name: '파괴자',
    tier: 3,
    race: UnitRace.orc,
    job: UnitJob.destroyer,
    baseHealth: 600,
    baseAttack: 80,
    attackRange: 1,
    maxMana: 100,
    skillName: '분쇄',
    skillDescription: '공격 시 20% 확률 1틱 기절',
    placeholderAsset: ResourceMap.unitCircleSpikey,
  ),

  // Wave enemies
  'enemy_goblin_t1': UnitDefinition(
    id: 'enemy_goblin_t1',
    name: '고블린',
    tier: 1,
    race: UnitRace.goblin,
    job: UnitJob.brute,
    baseHealth: 80,
    baseAttack: 12,
    attackRange: 1,
    maxMana: 0,
    skillName: '-',
    skillDescription: '적 웨이브 기본 유닛',
    placeholderAsset: ResourceMap.unitCircle,
    isEnemy: true,
  ),
  'enemy_orc_t1': UnitDefinition(
    id: 'enemy_orc_t1',
    name: '오크',
    tier: 1,
    race: UnitRace.orc,
    job: UnitJob.brute,
    baseHealth: 130,
    baseAttack: 18,
    attackRange: 1,
    maxMana: 0,
    skillName: '-',
    skillDescription: '적 웨이브 중장 유닛',
    placeholderAsset: ResourceMap.unitCircleRed,
    isEnemy: true,
  ),
};

final List<UnitDefinition> allPlayableUnits =
    unitCatalog.values.where((UnitDefinition unit) => !unit.isEnemy).toList()
      ..sort((UnitDefinition a, UnitDefinition b) {
        if (a.tier != b.tier) {
          return a.tier.compareTo(b.tier);
        }
        return a.name.compareTo(b.name);
      });

Map<int, List<UnitDefinition>> get playableUnitsByTier {
  final Map<int, List<UnitDefinition>> grouped = <int, List<UnitDefinition>>{};
  for (final UnitDefinition unit in allPlayableUnits) {
    grouped.putIfAbsent(unit.tier, () => <UnitDefinition>[]).add(unit);
  }
  return grouped;
}

const Map<int, EnemyWaveDefinition> waveDefinitions =
    <int, EnemyWaveDefinition>{
      1: EnemyWaveDefinition(
        wave: 1,
        enemies: <String, int>{'enemy_goblin_t1': 3, 'enemy_orc_t1': 2},
      ),
    };

const List<SynergyRule> synergyRules = <SynergyRule>[
  SynergyRule(
    type: SynergyType.race,
    token: 'human',
    displayName: '인간',
    requiredCount: 2,
    effectText: '모든 아군 방어력 +10',
  ),
  SynergyRule(
    type: SynergyType.race,
    token: 'human',
    displayName: '인간',
    requiredCount: 4,
    effectText: '모든 아군 방어력 +25, 2틱마다 체력 5 회복',
  ),
  SynergyRule(
    type: SynergyType.job,
    token: 'archer',
    displayName: '궁수',
    requiredCount: 3,
    effectText: '스킬 관련 데미지 +20%',
  ),
];
