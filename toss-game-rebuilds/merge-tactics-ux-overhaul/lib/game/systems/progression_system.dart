import 'dart:collection';
import 'dart:math';

class League {
  const League({
    required this.name,
    required this.minTrophy,
    required this.maxTrophy,
    required this.reward,
  });

  final String name;
  final int minTrophy;
  final int maxTrophy;
  final int reward;

  bool contains(int trophies) {
    return trophies >= minTrophy && trophies <= maxTrophy;
  }
}

const List<League> leagues = <League>[
  League(name: '나무 리그', minTrophy: 0, maxTrophy: 399, reward: 50),
  League(name: '돌 리그', minTrophy: 400, maxTrophy: 799, reward: 100),
  League(name: '철 리그', minTrophy: 800, maxTrophy: 1399, reward: 200),
  League(name: '금 리그', minTrophy: 1400, maxTrophy: 2199, reward: 400),
  League(name: '다이아 리그', minTrophy: 2200, maxTrophy: 3199, reward: 800),
  League(name: '전설 리그', minTrophy: 3200, maxTrophy: 99999, reward: 1500),
];

League leagueByTrophy(int trophies) {
  for (final League league in leagues) {
    if (league.contains(trophies)) {
      return league;
    }
  }
  return leagues.last;
}

class QuestReward {
  const QuestReward({required this.gold, required this.gems});

  final int gold;
  final int gems;
}

enum QuestType { wins, merges, skillUses, trophyGain }

class Quest {
  const Quest({
    required this.id,
    required this.desc,
    required this.type,
    required this.target,
    required this.reward,
  });

  final String id;
  final String desc;
  final QuestType type;
  final int target;
  final QuestReward reward;
}

const List<Quest> dailyQuests = <Quest>[
  Quest(
    id: 'win_3',
    desc: '전투 3회 승리',
    type: QuestType.wins,
    target: 3,
    reward: QuestReward(gold: 500, gems: 5),
  ),
  Quest(
    id: 'merge_5',
    desc: '유닛 5회 머지',
    type: QuestType.merges,
    target: 5,
    reward: QuestReward(gold: 300, gems: 3),
  ),
  Quest(
    id: 'use_skill_10',
    desc: '스킬 10회 사용',
    type: QuestType.skillUses,
    target: 10,
    reward: QuestReward(gold: 200, gems: 2),
  ),
  Quest(
    id: 'reach_trophy',
    desc: '트로피 50 획득',
    type: QuestType.trophyGain,
    target: 50,
    reward: QuestReward(gold: 1000, gems: 10),
  ),
];

class QuestProgress {
  QuestProgress(this.quest);

  final Quest quest;
  int progress = 0;
  bool claimed = false;

  bool get isCompleted => progress >= quest.target;

  void addProgress(int amount) {
    if (amount <= 0 || claimed) {
      return;
    }
    progress = min(quest.target, progress + amount);
  }

  void reset() {
    progress = 0;
    claimed = false;
  }
}

class BattleProgressReward {
  const BattleProgressReward({
    required this.playerWon,
    required this.trophyDelta,
    required this.goldDelta,
  });

  final bool playerWon;
  final int trophyDelta;
  final int goldDelta;
}

class CardUpgradeSystem {
  final List<int> cardsNeeded = <int>[
    0,
    2,
    4,
    8,
    15,
    25,
    50,
    100,
    200,
    400,
    800,
    1000,
    1500,
    2000,
  ];

  final List<int> statBonus = <int>[
    0,
    5,
    10,
    16,
    23,
    31,
    40,
    50,
    61,
    73,
    86,
    100,
    115,
    131,
  ];

  final List<int> upgradeCost = <int>[
    0,
    200,
    400,
    1000,
    2000,
    4000,
    8000,
    15000,
    30000,
    60000,
    100000,
    150000,
    200000,
    300000,
  ];

  int get maxLevel => cardsNeeded.length - 1;

  int cardsRequiredForNextLevel(int currentLevel) {
    if (currentLevel >= maxLevel) {
      return 0;
    }
    return cardsNeeded[currentLevel];
  }

  int goldCostForNextLevel(int currentLevel) {
    if (currentLevel >= maxLevel) {
      return 0;
    }
    return upgradeCost[currentLevel];
  }

  int statBonusPercentForLevel(int level) {
    final int clamped = level.clamp(0, maxLevel);
    return statBonus[clamped];
  }

  double statMultiplierForLevel(int level) {
    return 1 + (statBonusPercentForLevel(level) / 100);
  }

  bool canUpgrade({
    required int currentLevel,
    required int ownedCards,
    required int availableGold,
  }) {
    if (currentLevel >= maxLevel) {
      return false;
    }
    return ownedCards >= cardsRequiredForNextLevel(currentLevel) &&
        availableGold >= goldCostForNextLevel(currentLevel);
  }
}

class CardCollection {
  CardCollection({required this.unitId, this.level = 1, this.copies = 0});

  final String unitId;
  int level;
  int copies;
}

class ProgressionSystem {
  ProgressionSystem({
    this.initialTrophies = 0,
    this.initialGold = 0,
    this.initialGems = 0,
    CardUpgradeSystem? cardUpgradeSystem,
    List<Quest>? quests,
  }) : cardUpgradeSystem = cardUpgradeSystem ?? CardUpgradeSystem(),
       trophies = initialTrophies,
       gold = initialGold,
       gems = initialGems,
       _questProgress = <String, QuestProgress>{
         for (final Quest quest in quests ?? dailyQuests)
           quest.id: QuestProgress(quest),
       };

  final int initialTrophies;
  final int initialGold;
  final int initialGems;
  final CardUpgradeSystem cardUpgradeSystem;

  int trophies;
  int gold;
  int gems;
  int _trophiesEarnedToday = 0;

  final Map<String, CardCollection> _cards = <String, CardCollection>{};
  final Map<String, QuestProgress> _questProgress;

  League get currentLeague => leagueByTrophy(trophies);

  int get trophiesEarnedToday => _trophiesEarnedToday;

  UnmodifiableMapView<String, CardCollection> get cards {
    return UnmodifiableMapView<String, CardCollection>(_cards);
  }

  UnmodifiableMapView<String, QuestProgress> get quests {
    return UnmodifiableMapView<String, QuestProgress>(_questProgress);
  }

  CardCollection cardByUnitId(String unitId) {
    return _cards.putIfAbsent(
      unitId,
      () => CardCollection(unitId: unitId, level: 1, copies: 0),
    );
  }

  void addCardCopies(String unitId, int count) {
    if (count <= 0) {
      return;
    }
    final CardCollection card = cardByUnitId(unitId);
    card.copies += count;
  }

  bool upgradeCard(String unitId) {
    final CardCollection card = cardByUnitId(unitId);
    if (!cardUpgradeSystem.canUpgrade(
      currentLevel: card.level,
      ownedCards: card.copies,
      availableGold: gold,
    )) {
      return false;
    }

    final int needed = cardUpgradeSystem.cardsRequiredForNextLevel(card.level);
    final int cost = cardUpgradeSystem.goldCostForNextLevel(card.level);

    card.copies -= needed;
    gold -= cost;
    card.level += 1;
    return true;
  }

  int statBonusPercentForUnit(String unitId) {
    return cardUpgradeSystem.statBonusPercentForLevel(
      cardByUnitId(unitId).level,
    );
  }

  double statMultiplierForUnit(String unitId) {
    return cardUpgradeSystem.statMultiplierForLevel(cardByUnitId(unitId).level);
  }

  void recordMerge({int count = 1}) {
    _incrementQuest(QuestType.merges, count);
  }

  void recordSkillUse({int count = 1}) {
    _incrementQuest(QuestType.skillUses, count);
  }

  BattleProgressReward recordBattleOutcome({
    required bool playerWon,
    int trophyGainOnWin = 30,
    int trophyLossOnLose = 15,
  }) {
    final int trophiesBefore = trophies;
    final int goldBefore = gold;

    if (playerWon) {
      _incrementQuest(QuestType.wins, 1);
      _gainTrophies(trophyGainOnWin);
      gold += currentLeague.reward;
      return BattleProgressReward(
        playerWon: true,
        trophyDelta: trophies - trophiesBefore,
        goldDelta: gold - goldBefore,
      );
    }

    _loseTrophies(trophyLossOnLose);
    return BattleProgressReward(
      playerWon: false,
      trophyDelta: trophies - trophiesBefore,
      goldDelta: gold - goldBefore,
    );
  }

  QuestReward? claimQuestReward(String questId) {
    final QuestProgress? progress = _questProgress[questId];
    if (progress == null || !progress.isCompleted || progress.claimed) {
      return null;
    }
    progress.claimed = true;
    gold += progress.quest.reward.gold;
    gems += progress.quest.reward.gems;
    return progress.quest.reward;
  }

  void resetDailyQuests() {
    _trophiesEarnedToday = 0;
    for (final QuestProgress progress in _questProgress.values) {
      progress.reset();
    }
  }

  void addGold(int amount) {
    if (amount <= 0) {
      return;
    }
    gold += amount;
  }

  void addGems(int amount) {
    if (amount <= 0) {
      return;
    }
    gems += amount;
  }

  void _gainTrophies(int amount) {
    if (amount <= 0) {
      return;
    }
    trophies += amount;
    _trophiesEarnedToday += amount;
    _incrementQuest(QuestType.trophyGain, amount);
  }

  void _loseTrophies(int amount) {
    if (amount <= 0) {
      return;
    }
    trophies = max(0, trophies - amount);
  }

  void _incrementQuest(QuestType type, int amount) {
    if (amount <= 0) {
      return;
    }
    for (final QuestProgress progress in _questProgress.values) {
      if (progress.quest.type == type) {
        progress.addProgress(amount);
      }
    }
  }
}
