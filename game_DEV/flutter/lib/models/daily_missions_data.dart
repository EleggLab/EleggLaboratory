import '../game/deterministic_rng.dart';

enum DailyMissionType {
  reachLoop,
  maxCombo,
  bombBreakBlocks,
  bossClear,
  pickupBallPlus,
  completeDailyRun,
  useRecall,
  shopPurchase,
  useReroll,
  gainAugments,
}

class DailyMissionData {
  const DailyMissionData({
    required this.id,
    required this.type,
    required this.target,
    required this.progress,
    required this.rewardDiamonds,
    required this.claimed,
  });

  final String id;
  final DailyMissionType type;
  final int target;
  final int progress;
  final int rewardDiamonds;
  final bool claimed;

  int get clampedProgress => progress.clamp(0, target).toInt();

  bool get completed => clampedProgress >= target;

  DailyMissionData copyWith({
    String? id,
    DailyMissionType? type,
    int? target,
    int? progress,
    int? rewardDiamonds,
    bool? claimed,
  }) {
    return DailyMissionData(
      id: id ?? this.id,
      type: type ?? this.type,
      target: target ?? this.target,
      progress: progress ?? this.progress,
      rewardDiamonds: rewardDiamonds ?? this.rewardDiamonds,
      claimed: claimed ?? this.claimed,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'type': type.name,
      'target': target,
      'progress': progress,
      'rewardDiamonds': rewardDiamonds,
      'claimed': claimed,
    };
  }

  factory DailyMissionData.fromJson(Map<String, dynamic> json) {
    return DailyMissionData(
      id: (json['id'] as String?) ?? 'mission_unknown',
      type: _missionTypeFromString(json['type']?.toString()),
      target: (json['target'] as int?) ?? 1,
      progress: (json['progress'] as int?) ?? 0,
      rewardDiamonds: (json['rewardDiamonds'] as int?) ?? 5,
      claimed: (json['claimed'] as bool?) ?? false,
    );
  }
}

class DailyMissionsData {
  const DailyMissionsData({required this.date, required this.missions});

  final String date;
  final List<DailyMissionData> missions;

  DailyMissionsData ensureDate(String dateKey) {
    if (date == dateKey) {
      return this;
    }
    return DailyMissionsData.generateForDate(dateKey);
  }

  DailyMissionsData updateProgress({
    int? maxLoopReached,
    int? maxComboReached,
    int bombBreakIncrement = 0,
    int bossClearIncrement = 0,
    int pickupIncrement = 0,
    bool completedDailyRun = false,
    int recallIncrement = 0,
    int shopPurchaseIncrement = 0,
    int rerollIncrement = 0,
    int augmentGainIncrement = 0,
  }) {
    if (missions.isEmpty) {
      return this;
    }
    var changed = false;
    final updated = <DailyMissionData>[];
    for (final mission in missions) {
      var nextProgress = mission.progress;
      switch (mission.type) {
        case DailyMissionType.reachLoop:
          if (maxLoopReached != null && maxLoopReached > nextProgress) {
            nextProgress = maxLoopReached;
          }
          break;
        case DailyMissionType.maxCombo:
          if (maxComboReached != null && maxComboReached > nextProgress) {
            nextProgress = maxComboReached;
          }
          break;
        case DailyMissionType.bombBreakBlocks:
          if (bombBreakIncrement > 0) {
            nextProgress += bombBreakIncrement;
          }
          break;
        case DailyMissionType.bossClear:
          if (bossClearIncrement > 0) {
            nextProgress += bossClearIncrement;
          }
          break;
        case DailyMissionType.pickupBallPlus:
          if (pickupIncrement > 0) {
            nextProgress += pickupIncrement;
          }
          break;
        case DailyMissionType.completeDailyRun:
          if (completedDailyRun) {
            nextProgress = mission.target;
          }
          break;
        case DailyMissionType.useRecall:
          if (recallIncrement > 0) {
            nextProgress += recallIncrement;
          }
          break;
        case DailyMissionType.shopPurchase:
          if (shopPurchaseIncrement > 0) {
            nextProgress += shopPurchaseIncrement;
          }
          break;
        case DailyMissionType.useReroll:
          if (rerollIncrement > 0) {
            nextProgress += rerollIncrement;
          }
          break;
        case DailyMissionType.gainAugments:
          if (augmentGainIncrement > 0) {
            nextProgress += augmentGainIncrement;
          }
          break;
      }

      final clamped = nextProgress.clamp(0, mission.target).toInt();
      if (clamped != mission.progress) {
        changed = true;
        updated.add(mission.copyWith(progress: clamped));
      } else {
        updated.add(mission);
      }
    }
    if (!changed) {
      return this;
    }
    return DailyMissionsData(date: date, missions: updated);
  }

  DailyMissionsData claimMission(String missionId) {
    var changed = false;
    final updated = <DailyMissionData>[];
    for (final mission in missions) {
      if (mission.id != missionId || mission.claimed || !mission.completed) {
        updated.add(mission);
        continue;
      }
      changed = true;
      updated.add(mission.copyWith(claimed: true));
    }
    if (!changed) {
      return this;
    }
    return DailyMissionsData(date: date, missions: updated);
  }

  DailyMissionData? byId(String missionId) {
    for (final mission in missions) {
      if (mission.id == missionId) {
        return mission;
      }
    }
    return null;
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'date': date,
      'missions': missions.map((entry) => entry.toJson()).toList(),
    };
  }

  factory DailyMissionsData.fromJson(Map<String, dynamic> json) {
    final rawMissions = json['missions'];
    final parsed = <DailyMissionData>[];
    if (rawMissions is List) {
      for (final entry in rawMissions) {
        if (entry is! Map) {
          continue;
        }
        parsed.add(DailyMissionData.fromJson(Map<String, dynamic>.from(entry)));
      }
    }
    final date = (json['date'] as String?) ?? '';
    if (parsed.isEmpty || date.isEmpty) {
      return DailyMissionsData.generateForDate(toDateKeyLocal(DateTime.now()));
    }
    return DailyMissionsData(date: date, missions: parsed);
  }

  factory DailyMissionsData.generateForDate(String dateKey) {
    final templates = List<_MissionTemplate>.from(_defaultMissionTemplates);
    final rng = DeterministicRng(seed: dailySeedFromDateKey(dateKey) ^ 0xA5A5);
    final selected = <_MissionTemplate>[];
    while (selected.length < 3 && templates.isNotEmpty) {
      final index = rng.nextInt(templates.length);
      selected.add(templates.removeAt(index));
    }

    final missions = selected
        .map(
          (template) => DailyMissionData(
            id: template.id,
            type: template.type,
            target: template.target,
            progress: 0,
            rewardDiamonds: template.rewardDiamonds,
            claimed: false,
          ),
        )
        .toList();

    return DailyMissionsData(date: dateKey, missions: missions);
  }
}

class _MissionTemplate {
  const _MissionTemplate({
    required this.id,
    required this.type,
    required this.target,
    required this.rewardDiamonds,
  });

  final String id;
  final DailyMissionType type;
  final int target;
  final int rewardDiamonds;
}

const List<_MissionTemplate> _defaultMissionTemplates = <_MissionTemplate>[
  _MissionTemplate(
    id: 'daily_loop_10',
    type: DailyMissionType.reachLoop,
    target: 10,
    rewardDiamonds: 3,
  ),
  _MissionTemplate(
    id: 'daily_loop_20',
    type: DailyMissionType.reachLoop,
    target: 20,
    rewardDiamonds: 8,
  ),
  _MissionTemplate(
    id: 'daily_combo_30',
    type: DailyMissionType.maxCombo,
    target: 30,
    rewardDiamonds: 5,
  ),
  _MissionTemplate(
    id: 'daily_bomb_break_10',
    type: DailyMissionType.bombBreakBlocks,
    target: 10,
    rewardDiamonds: 5,
  ),
  _MissionTemplate(
    id: 'daily_boss_clear_1',
    type: DailyMissionType.bossClear,
    target: 1,
    rewardDiamonds: 8,
  ),
  _MissionTemplate(
    id: 'daily_pickup_3',
    type: DailyMissionType.pickupBallPlus,
    target: 3,
    rewardDiamonds: 5,
  ),
  _MissionTemplate(
    id: 'daily_recall_3',
    type: DailyMissionType.useRecall,
    target: 3,
    rewardDiamonds: 3,
  ),
  _MissionTemplate(
    id: 'daily_shop_buy_2',
    type: DailyMissionType.shopPurchase,
    target: 2,
    rewardDiamonds: 5,
  ),
  _MissionTemplate(
    id: 'daily_reroll_1',
    type: DailyMissionType.useReroll,
    target: 1,
    rewardDiamonds: 3,
  ),
  _MissionTemplate(
    id: 'daily_gain_augments_2',
    type: DailyMissionType.gainAugments,
    target: 2,
    rewardDiamonds: 5,
  ),
  _MissionTemplate(
    id: 'daily_run_daily_1',
    type: DailyMissionType.completeDailyRun,
    target: 1,
    rewardDiamonds: 8,
  ),
];

DailyMissionType _missionTypeFromString(String? raw) {
  switch (raw) {
    case 'reachLoop':
      return DailyMissionType.reachLoop;
    case 'maxCombo':
      return DailyMissionType.maxCombo;
    case 'bombBreakBlocks':
      return DailyMissionType.bombBreakBlocks;
    case 'bossClear':
      return DailyMissionType.bossClear;
    case 'pickupBallPlus':
      return DailyMissionType.pickupBallPlus;
    case 'completeDailyRun':
      return DailyMissionType.completeDailyRun;
    case 'useRecall':
      return DailyMissionType.useRecall;
    case 'shopPurchase':
      return DailyMissionType.shopPurchase;
    case 'useReroll':
      return DailyMissionType.useReroll;
    case 'gainAugments':
      return DailyMissionType.gainAugments;
    default:
      return DailyMissionType.reachLoop;
  }
}
