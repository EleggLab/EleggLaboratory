import 'daily_rewards.dart';

class SaveData {
  SaveData({
    required this.version,
    required this.diamonds,
    required this.unlockedCharacterIds,
    required this.selectedCharacterId,
    required this.bestLoop,
    required this.bestLoopCharacterId,
    required this.codexSeenBossIds,
    required this.codexSeenAugmentIds,
    required this.dailyRewards,
  });

  final int version;
  final int diamonds;
  final Set<String> unlockedCharacterIds;
  final String selectedCharacterId;
  final int bestLoop;
  final String bestLoopCharacterId;
  final Set<String> codexSeenBossIds;
  final Set<String> codexSeenAugmentIds;
  final DailyRewardsData dailyRewards;

  SaveData copyWith({
    int? version,
    int? diamonds,
    Set<String>? unlockedCharacterIds,
    String? selectedCharacterId,
    int? bestLoop,
    String? bestLoopCharacterId,
    Set<String>? codexSeenBossIds,
    Set<String>? codexSeenAugmentIds,
    DailyRewardsData? dailyRewards,
  }) {
    return SaveData(
      version: version ?? this.version,
      diamonds: diamonds ?? this.diamonds,
      unlockedCharacterIds: unlockedCharacterIds ?? this.unlockedCharacterIds,
      selectedCharacterId: selectedCharacterId ?? this.selectedCharacterId,
      bestLoop: bestLoop ?? this.bestLoop,
      bestLoopCharacterId: bestLoopCharacterId ?? this.bestLoopCharacterId,
      codexSeenBossIds: codexSeenBossIds ?? this.codexSeenBossIds,
      codexSeenAugmentIds: codexSeenAugmentIds ?? this.codexSeenAugmentIds,
      dailyRewards: dailyRewards ?? this.dailyRewards,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'version': version,
      'diamonds': diamonds,
      'unlockedCharacterIds': unlockedCharacterIds.toList(),
      'selectedCharacterId': selectedCharacterId,
      'bestLoop': bestLoop,
      'bestLoopCharacterId': bestLoopCharacterId,
      'codexSeenBossIds': codexSeenBossIds.toList(),
      'codexSeenAugmentIds': codexSeenAugmentIds.toList(),
      'dailyRewards': dailyRewards.toJson(),
    };
  }

  factory SaveData.fromJson(Map<String, dynamic> json) {
    return SaveData(
      version: (json['version'] as int?) ?? 1,
      diamonds: (json['diamonds'] as int?) ?? 0,
      unlockedCharacterIds: ((json['unlockedCharacterIds'] as List<dynamic>? ?? const <dynamic>[])
              .map((value) => value.toString()))
          .toSet(),
      selectedCharacterId: (json['selectedCharacterId'] as String?) ?? 'dos',
      bestLoop: (json['bestLoop'] as int?) ?? 0,
      bestLoopCharacterId: (json['bestLoopCharacterId'] as String?) ?? 'dos',
      codexSeenBossIds: ((json['codexSeenBossIds'] as List<dynamic>? ?? const <dynamic>[])
              .map((value) => value.toString()))
          .toSet(),
      codexSeenAugmentIds: ((json['codexSeenAugmentIds'] as List<dynamic>? ?? const <dynamic>[])
              .map((value) => value.toString()))
          .toSet(),
      dailyRewards: json['dailyRewards'] is Map
          ? DailyRewardsData.fromJson(
              Map<String, dynamic>.from(json['dailyRewards'] as Map),
            )
          : DailyRewardsData.initial('1970-01-01'),
    );
  }
}


