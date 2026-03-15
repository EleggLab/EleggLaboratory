import '../models/augment_data.dart';
import '../models/boss_data.dart';
import '../models/character_data.dart';
import '../models/game_options.dart';

class LocalizedCatalogText {
  const LocalizedCatalogText({required this.name, required this.description});

  final String name;
  final String description;
}

class GameCatalog {
  static const String starterCharacterId = 'dos';

  static const List<CharacterData> _defaultCharacters = <CharacterData>[
    CharacterData(
      id: 'chocorone',
      name: 'Engineer Chocorone',
      description: 'Destroys the entire row of the lowest non-boss block.',
      skillManaCost: 200,
      icon: 'CH',
    ),
    CharacterData(
      id: 'dos',
      name: 'Designer Dos',
      description: 'Deals 10 damage to all normal grid blocks.',
      skillManaCost: 50,
      icon: 'DS',
    ),
    CharacterData(
      id: 'ratk',
      name: 'Subject Rat K',
      description: 'Destroys 3 random non-boss blocks.',
      skillManaCost: 200,
      icon: 'RK',
    ),
    CharacterData(
      id: 'monsung',
      name: 'Barbarian Monsung',
      description:
          'Deals ceil(loop * 0.1) damage to all blocks including boss.',
      skillManaCost: 100,
      icon: 'MS',
    ),
    CharacterData(
      id: 'outer',
      name: 'Merchant Outer',
      description: 'Instantly gains +1 ball.',
      skillManaCost: 100,
      icon: 'OT',
    ),
  ];

  static const List<AugmentData> _defaultAugments = <AugmentData>[
    AugmentData(
      id: 'augment_ball_triple',
      effectId: 'augment_ball_triple',
      name: 'Pickup Chain',
      description: 'Gain +1 extra ball for every 3 Ball+1 pickups.',
      icon: 'A1',
      rarity: AugmentRarity.common,
      tags: <String>['pickup'],
    ),
    AugmentData(
      id: 'augment_hp100_double',
      effectId: 'augment_hp100_double',
      name: 'Low HP Breaker',
      description: 'Deal 2x damage to targets with HP <= 100.',
      icon: 'A2',
      rarity: AugmentRarity.common,
      tags: <String>['damage'],
    ),
    AugmentData(
      id: 'augment_crit10',
      effectId: 'augment_crit10',
      name: 'Critical Strike',
      description: '10% chance to deal 2x damage.',
      icon: 'A3',
      rarity: AugmentRarity.rare,
      tags: <String>['damage'],
    ),
    AugmentData(
      id: 'augment_special_plus1',
      effectId: 'augment_special_plus1',
      name: 'Special Break',
      description: 'Deal +1 damage to steel/cactus/bomb blocks.',
      icon: 'A4',
      rarity: AugmentRarity.common,
      tags: <String>['special'],
    ),
    AugmentData(
      id: 'augment_boss_bonus',
      effectId: 'augment_boss_bonus',
      name: 'Boss Burst',
      description: 'Every 100 boss damage adds bonus 10 damage.',
      icon: 'A5',
      rarity: AugmentRarity.rare,
      tags: <String>['boss'],
    ),
    AugmentData(
      id: 'augment_revive',
      effectId: 'augment_revive',
      name: 'Emergency Repair',
      description: 'Prevent one death and clear the bottom 3 rows.',
      icon: 'A6',
      rarity: AugmentRarity.epic,
      tags: <String>['defense'],
    ),
    AugmentData(
      id: 'augment_recall_aoe',
      effectId: 'augment_recall_aoe',
      name: 'Recall Shockwave',
      description: 'Recall button end-turn deals 10 damage to all blocks.',
      icon: 'A7',
      rarity: AugmentRarity.rare,
      tags: <String>['recall'],
      shopOnly: true,
    ),
    AugmentData(
      id: 'augment_more_bomb',
      effectId: 'augment_more_bomb',
      name: 'More Bomb',
      description: 'Increase bomb spawn weight.',
      icon: 'A8',
      rarity: AugmentRarity.common,
      stackMax: 3,
      tags: <String>['spawn'],
    ),
    AugmentData(
      id: 'augment_more_cactus',
      effectId: 'augment_more_cactus',
      name: 'More Cactus',
      description: 'Increase cactus spawn weight.',
      icon: 'A9',
      rarity: AugmentRarity.common,
      stackMax: 3,
      tags: <String>['spawn'],
    ),
    AugmentData(
      id: 'augment_instant_balls',
      effectId: 'augment_instant_balls',
      name: 'Instant Balls',
      description: 'Instantly gain +floor(loop/10) balls (minimum 1).',
      icon: 'A10',
      rarity: AugmentRarity.rare,
      tags: <String>['economy'],
    ),
  ];

  static const List<BossCodexData> _defaultBosses = <BossCodexData>[
    BossCodexData(
      id: 'boss_weak',
      name: 'Weak Overseer',
      description: 'Disables pickup gain and character skill while alive.',
      tier: BossTier.weak,
      width: 2,
      height: 2,
      icon: 'BW',
      introText: 'A weak boss is watching this loop.',
      optionalAbilityType: 'weak_debuff',
    ),
    BossCodexData(
      id: 'boss_medium',
      name: 'Medium Warden',
      description: 'Reduces launch count and adds a random medium effect.',
      tier: BossTier.medium,
      width: 3,
      height: 2,
      icon: 'BM',
      introText: 'Medium tier boss detected.',
      optionalAbilityType: 'medium_random',
    ),
    BossCodexData(
      id: 'boss_strong',
      name: 'Strong Tyrant',
      description: 'Forces 2-row descent and raises deadzone by 1.',
      tier: BossTier.strong,
      width: 3,
      height: 3,
      icon: 'BS',
      introText: 'Strong tier boss enters the board.',
      optionalAbilityType: 'strong_pressure',
    ),
  ];

  static final List<CharacterData> _characters =
      List<CharacterData>.from(_defaultCharacters);
  static final List<AugmentData> _augments =
      List<AugmentData>.from(_defaultAugments);
  static final List<BossCodexData> _bosses =
      List<BossCodexData>.from(_defaultBosses);

  static final Map<String, LocalizedCatalogText> _augmentKoText =
      <String, LocalizedCatalogText>{
        'augment_ball_triple': const LocalizedCatalogText(
          name: '픽업 체인',
          description: 'Ball+1 픽업 3회마다 추가 공 +1',
        ),
        'augment_hp100_double': const LocalizedCatalogText(
          name: '저체력 분쇄',
          description: 'HP 100 이하 대상에게 2배 피해',
        ),
        'augment_crit10': const LocalizedCatalogText(
          name: '치명타 10%',
          description: '10% 확률로 2배 피해',
        ),
        'augment_special_plus1': const LocalizedCatalogText(
          name: '특수 블럭 파쇄',
          description: '강철/선인장/폭탄 블럭 피해 +1',
        ),
        'augment_boss_bonus': const LocalizedCatalogText(
          name: '보스 버스트',
          description: '보스 누적 피해 100마다 추가 피해 10',
        ),
        'augment_revive': const LocalizedCatalogText(
          name: '비상 수리',
          description: '1회 사망 방지 + 하단 3줄 제거',
        ),
        'augment_recall_aoe': const LocalizedCatalogText(
          name: '리콜 충격파',
          description: '리콜 종료 시 전체 블럭 10 피해',
        ),
        'augment_more_bomb': const LocalizedCatalogText(
          name: '폭탄 증가',
          description: '폭탄 생성 가중치 상승',
        ),
        'augment_more_cactus': const LocalizedCatalogText(
          name: '선인장 증가',
          description: '선인장 생성 가중치 상승',
        ),
        'augment_instant_balls': const LocalizedCatalogText(
          name: '즉시 공 보급',
          description: '즉시 공 +floor(loop/10), 최소 1',
        ),
      };

  static List<CharacterData> get characters => List<CharacterData>.unmodifiable(_characters);
  static List<AugmentData> get augments => List<AugmentData>.unmodifiable(_augments);
  static List<BossCodexData> get bosses => List<BossCodexData>.unmodifiable(_bosses);

  static CharacterData characterById(String id) {
    return _characters.firstWhere(
      (c) => c.id == id,
      orElse: () => _characters.firstWhere(
        (c) => c.id == starterCharacterId,
        orElse: () => _defaultCharacters.first,
      ),
    );
  }

  static AugmentData augmentById(String id) {
    return _augments.firstWhere(
      (a) => a.id == id,
      orElse: () => _defaultAugments.first,
    );
  }

  static BossCodexData bossById(String id) {
    return _bosses.firstWhere(
      (b) => b.id == id,
      orElse: () => _defaultBosses.first,
    );
  }

  static void resetRuntimeDefinitions() {
    _characters
      ..clear()
      ..addAll(_defaultCharacters);
    _augments
      ..clear()
      ..addAll(_defaultAugments);
    _bosses
      ..clear()
      ..addAll(_defaultBosses);
  }

  static void applyAugmentDefinitions(List<AugmentData> incoming) {
    if (incoming.isEmpty) {
      _augments
        ..clear()
        ..addAll(_defaultAugments);
      return;
    }
    final unique = <String, AugmentData>{};
    for (final augment in incoming) {
      unique[augment.id] = augment;
    }
    _augments
      ..clear()
      ..addAll(unique.values);
  }

  static void applyBossDefinitions(List<BossCodexData> incoming) {
    if (incoming.isEmpty) {
      _bosses
        ..clear()
        ..addAll(_defaultBosses);
      return;
    }
    final unique = <String, BossCodexData>{};
    for (final boss in incoming) {
      unique[boss.id] = boss;
    }
    _bosses
      ..clear()
      ..addAll(unique.values);
  }

  static String effectIdForAugment(String augmentId) {
    final data = augmentById(augmentId);
    if (data.effectId.isNotEmpty) {
      return data.effectId;
    }
    return data.id;
  }

  static LocalizedCatalogText localizedAugmentText({
    required String augmentId,
    required UiLanguage language,
    required String fallbackName,
    required String fallbackDescription,
  }) {
    if (language == UiLanguage.ko) {
      final ko = _augmentKoText[augmentId];
      if (ko != null) {
        return ko;
      }
    }
    return LocalizedCatalogText(
      name: fallbackName,
      description: fallbackDescription,
    );
  }
}
