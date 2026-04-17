import '../models/augment_data.dart';
import '../models/boss_data.dart';
import '../models/character_data.dart';

class GameCatalog {
  static const String starterCharacterId = 'dos';

  static const List<CharacterData> characters = <CharacterData>[
    CharacterData(
      id: 'chocorone',
      name: '엔지니어 초코로네',
      description: '보스 제외 가장 아래 블럭 1개가 있는 행 전체를 파괴합니다.',
      skillManaCost: 200,
      icon: 'CH',
    ),
    CharacterData(
      id: 'dos',
      name: '설계자 도스',
      description: '전체 블럭에 10 피해를 줍니다.',
      skillManaCost: 50,
      icon: 'DS',
    ),
    CharacterData(
      id: 'ratk',
      name: '실험체쥐 케이',
      description: '보스 제외 랜덤 블럭 3개를 파괴합니다.',
      skillManaCost: 200,
      icon: 'RK',
    ),
    CharacterData(
      id: 'monsung',
      name: '야만전사 몬승',
      description: '모든 블럭(보스 포함)에 ceil(loop*0.1) 피해를 줍니다.',
      skillManaCost: 100,
      icon: 'MS',
    ),
    CharacterData(
      id: 'outer',
      name: '상인 아우터',
      description: '즉시 공 +1을 얻습니다.',
      skillManaCost: 100,
      icon: 'OT',
    ),
  ];

  static const List<AugmentData> augments = <AugmentData>[
    AugmentData(
      id: 'augment_ball_triple',
      name: '픽업 체인',
      description: 'Ball+1 픽업 3회마다 추가 공 +1',
      icon: 'A1',
    ),
    AugmentData(
      id: 'augment_hp100_double',
      name: '약점 관통',
      description: 'HP<=100 대상 피해 2배',
      icon: 'A2',
    ),
    AugmentData(
      id: 'augment_crit10',
      name: '치명타',
      description: '10% 확률로 2배 피해',
      icon: 'A3',
    ),
    AugmentData(
      id: 'augment_special_plus1',
      name: '특수 파괴',
      description: 'steel/cactus/bomb 피해 +1',
      icon: 'A4',
    ),
    AugmentData(
      id: 'augment_boss_bonus',
      name: '보스 누적 폭발',
      description: '보스 누적 피해 100마다 추가 피해 10',
      icon: 'A5',
    ),
    AugmentData(
      id: 'augment_revive',
      name: '응급 수리',
      description: '사망 1회 방지, 발동 시 하단 3줄 삭제',
      icon: 'A6',
    ),
    AugmentData(
      id: 'augment_recall_aoe',
      name: '강제 회수 충격',
      description: '회수 버튼 턴 종료 시 전체 블럭 10 피해',
      icon: 'A7',
    ),
    AugmentData(
      id: 'augment_more_bomb',
      name: '불안정 핵',
      description: '폭탄 스폰 확률 상승',
      icon: 'A8',
    ),
    AugmentData(
      id: 'augment_more_cactus',
      name: '가시 숲',
      description: '선인장 스폰 확률 상승',
      icon: 'A9',
    ),
    AugmentData(
      id: 'augment_instant_balls',
      name: '즉시 증원',
      description: '즉시 공 + floor(loop/10) (최소 1)',
      icon: 'A10',
    ),
  ];

  static const List<BossCodexData> bosses = <BossCodexData>[
    BossCodexData(
      id: 'boss_scrap_cube',
      name: 'Scrap Cube',
      description: '약한 코어를 가진 2x2 기계 보스.',
      tier: BossTier.weak,
      width: 2,
      height: 2,
      icon: 'B1',
    ),
    BossCodexData(
      id: 'boss_rail_maw',
      name: 'Rail Maw',
      description: '선로를 부식시키는 3x2 포식자.',
      tier: BossTier.weak,
      width: 3,
      height: 2,
      icon: 'B2',
    ),
    BossCodexData(
      id: 'boss_forge_warden',
      name: 'Forge Warden',
      description: '중간 난이도의 3x2 수호체.',
      tier: BossTier.medium,
      width: 3,
      height: 2,
      icon: 'B3',
    ),
    BossCodexData(
      id: 'boss_thorn_matrix',
      name: 'Thorn Matrix',
      description: '중간 난이도의 3x3 군집체.',
      tier: BossTier.medium,
      width: 3,
      height: 3,
      icon: 'B4',
    ),
    BossCodexData(
      id: 'boss_iron_colossus',
      name: 'Iron Colossus',
      description: '강력한 3x3 거대 장갑체.',
      tier: BossTier.strong,
      width: 3,
      height: 3,
      icon: 'B5',
    ),
    BossCodexData(
      id: 'boss_gravity_core',
      name: 'Gravity Core',
      description: '강력한 2x3 중력 왜곡체.',
      tier: BossTier.strong,
      width: 2,
      height: 3,
      icon: 'B6',
    ),
  ];

  static CharacterData characterById(String id) {
    return characters.firstWhere(
      (character) => character.id == id,
      orElse: () => characters.first,
    );
  }

  static AugmentData augmentById(String id) {
    return augments.firstWhere(
      (augment) => augment.id == id,
      orElse: () => augments.first,
    );
  }

  static BossCodexData bossById(String id) {
    return bosses.firstWhere(
      (boss) => boss.id == id,
      orElse: () => bosses.first,
    );
  }
}
