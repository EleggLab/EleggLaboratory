import 'daily_rewards.dart';
import 'daily_missions_data.dart';
import 'game_options.dart';
import 'meta_upgrades_data.dart';
import 'run_record_data.dart';
import 'tutorial_data.dart';
import '../game/deterministic_rng.dart';
import 'replay_data.dart';
import 'weekly_league_data.dart';

class SaveData {
  SaveData({
    required this.version,
    required this.diamonds,
    required this.unlockedCharacterIds,
    required this.selectedCharacterId,
    required this.bestLoop,
    required this.bestLoopCharacterId,
    required this.bestScore,
    required this.bestScoreCharacterId,
    required this.codexSeenBossIds,
    required this.codexSeenAugmentIds,
    required this.dailyRewards,
    required this.gameOptions,
    required this.metaUpgrades,
    required this.tutorial,
    required this.activeRunSnapshot,
    required this.unlockedAchievementIds,
    required this.claimedAchievementIds,
    required this.unlockedCosmeticIds,
    required this.selectedBackgroundStyleId,
    required this.selectedBlockSkinStyleId,
    required this.selectedBallTrailStyleId,
    required this.dailyMissions,
    required this.runHistory,
    required this.replayIndex,
    required this.weeklyLeague,
    required this.reviewPrompted,
    required this.totalDailyRunsCompleted,
  });

  final int version;
  final int diamonds;
  final Set<String> unlockedCharacterIds;
  final String selectedCharacterId;
  final int bestLoop;
  final String bestLoopCharacterId;
  final int bestScore;
  final String bestScoreCharacterId;
  final Set<String> codexSeenBossIds;
  final Set<String> codexSeenAugmentIds;
  final DailyRewardsData dailyRewards;
  final GameOptionsData gameOptions;
  final MetaUpgradesData metaUpgrades;
  final TutorialData tutorial;
  final Map<String, dynamic>? activeRunSnapshot;
  final Set<String> unlockedAchievementIds;
  final Set<String> claimedAchievementIds;
  final Set<String> unlockedCosmeticIds;
  final String selectedBackgroundStyleId;
  final String selectedBlockSkinStyleId;
  final String selectedBallTrailStyleId;
  final DailyMissionsData dailyMissions;
  final List<RunRecordData> runHistory;
  final List<ReplayIndexEntry> replayIndex;
  final WeeklyLeagueData weeklyLeague;
  final bool reviewPrompted;
  final int totalDailyRunsCompleted;

  SaveData copyWith({
    int? version,
    int? diamonds,
    Set<String>? unlockedCharacterIds,
    String? selectedCharacterId,
    int? bestLoop,
    String? bestLoopCharacterId,
    int? bestScore,
    String? bestScoreCharacterId,
    Set<String>? codexSeenBossIds,
    Set<String>? codexSeenAugmentIds,
    DailyRewardsData? dailyRewards,
    GameOptionsData? gameOptions,
    MetaUpgradesData? metaUpgrades,
    TutorialData? tutorial,
    Object? activeRunSnapshot = _noMapSentinel,
    Set<String>? unlockedAchievementIds,
    Set<String>? claimedAchievementIds,
    Set<String>? unlockedCosmeticIds,
    String? selectedBackgroundStyleId,
    String? selectedBlockSkinStyleId,
    String? selectedBallTrailStyleId,
    DailyMissionsData? dailyMissions,
    List<RunRecordData>? runHistory,
    List<ReplayIndexEntry>? replayIndex,
    WeeklyLeagueData? weeklyLeague,
    bool? reviewPrompted,
    int? totalDailyRunsCompleted,
  }) {
    return SaveData(
      version: version ?? this.version,
      diamonds: diamonds ?? this.diamonds,
      unlockedCharacterIds: unlockedCharacterIds ?? this.unlockedCharacterIds,
      selectedCharacterId: selectedCharacterId ?? this.selectedCharacterId,
      bestLoop: bestLoop ?? this.bestLoop,
      bestLoopCharacterId: bestLoopCharacterId ?? this.bestLoopCharacterId,
      bestScore: bestScore ?? this.bestScore,
      bestScoreCharacterId: bestScoreCharacterId ?? this.bestScoreCharacterId,
      codexSeenBossIds: codexSeenBossIds ?? this.codexSeenBossIds,
      codexSeenAugmentIds: codexSeenAugmentIds ?? this.codexSeenAugmentIds,
      dailyRewards: dailyRewards ?? this.dailyRewards,
      gameOptions: gameOptions ?? this.gameOptions,
      metaUpgrades: metaUpgrades ?? this.metaUpgrades,
      tutorial: tutorial ?? this.tutorial,
      activeRunSnapshot: identical(activeRunSnapshot, _noMapSentinel)
          ? this.activeRunSnapshot
          : activeRunSnapshot as Map<String, dynamic>?,
      unlockedAchievementIds:
          unlockedAchievementIds ?? this.unlockedAchievementIds,
      claimedAchievementIds:
          claimedAchievementIds ?? this.claimedAchievementIds,
      unlockedCosmeticIds: unlockedCosmeticIds ?? this.unlockedCosmeticIds,
      selectedBackgroundStyleId:
          selectedBackgroundStyleId ?? this.selectedBackgroundStyleId,
      selectedBlockSkinStyleId:
          selectedBlockSkinStyleId ?? this.selectedBlockSkinStyleId,
      selectedBallTrailStyleId:
          selectedBallTrailStyleId ?? this.selectedBallTrailStyleId,
      dailyMissions: dailyMissions ?? this.dailyMissions,
      runHistory: runHistory ?? this.runHistory,
      replayIndex: replayIndex ?? this.replayIndex,
      weeklyLeague: weeklyLeague ?? this.weeklyLeague,
      reviewPrompted: reviewPrompted ?? this.reviewPrompted,
      totalDailyRunsCompleted:
          totalDailyRunsCompleted ?? this.totalDailyRunsCompleted,
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
      'bestScore': bestScore,
      'bestScoreCharacterId': bestScoreCharacterId,
      'codexSeenBossIds': codexSeenBossIds.toList(),
      'codexSeenAugmentIds': codexSeenAugmentIds.toList(),
      'dailyRewards': dailyRewards.toJson(),
      'gameOptions': gameOptions.toJson(),
      'metaUpgrades': metaUpgrades.toJson(),
      'tutorial': tutorial.toJson(),
      'activeRunSnapshot': activeRunSnapshot,
      'unlockedAchievementIds': unlockedAchievementIds.toList(),
      'claimedAchievementIds': claimedAchievementIds.toList(),
      'unlockedCosmeticIds': unlockedCosmeticIds.toList(),
      'selectedBackgroundStyleId': selectedBackgroundStyleId,
      'selectedBlockSkinStyleId': selectedBlockSkinStyleId,
      'selectedBallTrailStyleId': selectedBallTrailStyleId,
      'dailyMissions': dailyMissions.toJson(),
      'runHistory': runHistory.map((entry) => entry.toJson()).toList(),
      'replayIndex': replayIndex.map((entry) => entry.toJson()).toList(),
      'weeklyLeague': weeklyLeague.toJson(),
      'reviewPrompted': reviewPrompted,
      'totalDailyRunsCompleted': totalDailyRunsCompleted,
    };
  }

  factory SaveData.fromJson(Map<String, dynamic> json) {
    return SaveData(
      version: (json['version'] as int?) ?? 1,
      diamonds: (json['diamonds'] as int?) ?? 0,
      unlockedCharacterIds:
          ((json['unlockedCharacterIds'] as List<dynamic>? ?? const <dynamic>[])
                  .map((value) => value.toString()))
              .toSet(),
      selectedCharacterId: (json['selectedCharacterId'] as String?) ?? 'dos',
      bestLoop: (json['bestLoop'] as int?) ?? 0,
      bestLoopCharacterId: (json['bestLoopCharacterId'] as String?) ?? 'dos',
      bestScore: (json['bestScore'] as int?) ?? 0,
      bestScoreCharacterId:
          (json['bestScoreCharacterId'] as String?) ??
          ((json['bestLoopCharacterId'] as String?) ?? 'dos'),
      codexSeenBossIds:
          ((json['codexSeenBossIds'] as List<dynamic>? ?? const <dynamic>[])
                  .map((value) => value.toString()))
              .toSet(),
      codexSeenAugmentIds:
          ((json['codexSeenAugmentIds'] as List<dynamic>? ?? const <dynamic>[])
                  .map((value) => value.toString()))
              .toSet(),
      dailyRewards: json['dailyRewards'] is Map
          ? DailyRewardsData.fromJson(
              Map<String, dynamic>.from(json['dailyRewards'] as Map),
            )
          : DailyRewardsData.initial('1970-01-01'),
      gameOptions: json['gameOptions'] is Map
          ? GameOptionsData.fromJson(
              Map<String, dynamic>.from(json['gameOptions'] as Map),
            )
          : GameOptionsData.defaults,
      metaUpgrades: json['metaUpgrades'] is Map
          ? MetaUpgradesData.fromJson(
              Map<String, dynamic>.from(json['metaUpgrades'] as Map),
            )
          : MetaUpgradesData.defaults,
      tutorial: json['tutorial'] is Map
          ? TutorialData.fromJson(
              Map<String, dynamic>.from(json['tutorial'] as Map),
            )
          : TutorialData(
              hasSeenTutorial:
                  (json['gameOptions'] is Map &&
                  (json['gameOptions'] as Map)['hasSeenTutorial'] == true),
            ),
      activeRunSnapshot: json['activeRunSnapshot'] is Map
          ? Map<String, dynamic>.from(json['activeRunSnapshot'] as Map)
          : null,
      unlockedAchievementIds:
          ((json['unlockedAchievementIds'] as List<dynamic>? ??
                      const <dynamic>[])
                  .map((value) => value.toString()))
              .toSet(),
      claimedAchievementIds:
          ((json['claimedAchievementIds'] as List<dynamic>? ??
                      const <dynamic>[])
                  .map((value) => value.toString()))
              .toSet(),
      unlockedCosmeticIds:
          ((json['unlockedCosmeticIds'] as List<dynamic>? ?? const <dynamic>[])
                  .map((value) => value.toString()))
              .toSet(),
      selectedBackgroundStyleId:
          (json['selectedBackgroundStyleId'] as String?) ?? 'bg_default',
      selectedBlockSkinStyleId:
          (json['selectedBlockSkinStyleId'] as String?) ?? 'block_default',
      selectedBallTrailStyleId:
          (json['selectedBallTrailStyleId'] as String?) ?? 'trail_default',
      dailyMissions: json['dailyMissions'] is Map
          ? DailyMissionsData.fromJson(
              Map<String, dynamic>.from(json['dailyMissions'] as Map),
            )
          : DailyMissionsData.generateForDate(toDateKeyLocal(DateTime.now())),
      runHistory: (json['runHistory'] is List)
          ? (json['runHistory'] as List<dynamic>)
                .whereType<Map>()
                .map(
                  (entry) =>
                      RunRecordData.fromJson(Map<String, dynamic>.from(entry)),
                )
                .toList()
          : const <RunRecordData>[],
      replayIndex: (json['replayIndex'] is List)
          ? (json['replayIndex'] as List<dynamic>)
                .whereType<Map>()
                .map(
                  (entry) => ReplayIndexEntry.fromJson(
                    Map<String, dynamic>.from(entry),
                  ),
                )
                .toList()
          : const <ReplayIndexEntry>[],
      weeklyLeague: json['weeklyLeague'] is Map
          ? WeeklyLeagueData.fromJson(
              Map<String, dynamic>.from(json['weeklyLeague'] as Map),
            )
          : WeeklyLeagueData.defaults(DateTime.now()),
      reviewPrompted: (json['reviewPrompted'] as bool?) ?? false,
      totalDailyRunsCompleted: (json['totalDailyRunsCompleted'] as int?) ?? 0,
    );
  }
}

const Map<String, dynamic> _noMapSentinel = <String, dynamic>{
  '__sentinel__': true,
};
