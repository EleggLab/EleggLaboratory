import '../game/deterministic_rng.dart';

enum WeeklyTier { bronze, silver, gold, platinum, diamond }

class WeeklyHistoryEntry {
  const WeeklyHistoryEntry({
    required this.weekKey,
    required this.tier,
    required this.bestScore,
    required this.attempts,
  });

  final String weekKey;
  final WeeklyTier tier;
  final int bestScore;
  final int attempts;

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'weekKey': weekKey,
      'tier': tier.name,
      'bestScore': bestScore,
      'attempts': attempts,
    };
  }

  factory WeeklyHistoryEntry.fromJson(Map<String, dynamic> json) {
    return WeeklyHistoryEntry(
      weekKey: (json['weekKey'] as String?) ?? '',
      tier: _tierFromString(json['tier']?.toString()),
      bestScore: (json['bestScore'] as num?)?.toInt() ?? 0,
      attempts: (json['attempts'] as num?)?.toInt() ?? 0,
    );
  }
}

class WeeklyLeagueData {
  const WeeklyLeagueData({
    required this.currentTier,
    required this.currentWeekKey,
    required this.weeklyBestScore,
    required this.weeklyBestRunId,
    required this.weeklyAttempts,
    required this.leagueHistory,
  });

  final WeeklyTier currentTier;
  final String currentWeekKey;
  final int weeklyBestScore;
  final String weeklyBestRunId;
  final int weeklyAttempts;
  final List<WeeklyHistoryEntry> leagueHistory;

  WeeklyLeagueData copyWith({
    WeeklyTier? currentTier,
    String? currentWeekKey,
    int? weeklyBestScore,
    String? weeklyBestRunId,
    int? weeklyAttempts,
    List<WeeklyHistoryEntry>? leagueHistory,
  }) {
    return WeeklyLeagueData(
      currentTier: currentTier ?? this.currentTier,
      currentWeekKey: currentWeekKey ?? this.currentWeekKey,
      weeklyBestScore: weeklyBestScore ?? this.weeklyBestScore,
      weeklyBestRunId: weeklyBestRunId ?? this.weeklyBestRunId,
      weeklyAttempts: weeklyAttempts ?? this.weeklyAttempts,
      leagueHistory: leagueHistory ?? this.leagueHistory,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'currentTier': currentTier.name,
      'currentWeekKey': currentWeekKey,
      'weeklyBestScore': weeklyBestScore,
      'weeklyBestRunId': weeklyBestRunId,
      'weeklyAttempts': weeklyAttempts,
      'leagueHistory': leagueHistory.map((entry) => entry.toJson()).toList(),
    };
  }

  factory WeeklyLeagueData.fromJson(Map<String, dynamic> json) {
    final rawHistory = json['leagueHistory'];
    final history = <WeeklyHistoryEntry>[];
    if (rawHistory is List) {
      for (final raw in rawHistory) {
        if (raw is! Map) {
          continue;
        }
        history.add(
          WeeklyHistoryEntry.fromJson(Map<String, dynamic>.from(raw)),
        );
      }
    }
    return WeeklyLeagueData(
      currentTier: _tierFromString(json['currentTier']?.toString()),
      currentWeekKey:
          (json['currentWeekKey'] as String?) ?? isoWeekKey(DateTime.now()),
      weeklyBestScore: (json['weeklyBestScore'] as num?)?.toInt() ?? 0,
      weeklyBestRunId: (json['weeklyBestRunId'] as String?) ?? '',
      weeklyAttempts: (json['weeklyAttempts'] as num?)?.toInt() ?? 0,
      leagueHistory: history,
    );
  }

  factory WeeklyLeagueData.defaults(DateTime now) {
    return WeeklyLeagueData(
      currentTier: WeeklyTier.bronze,
      currentWeekKey: isoWeekKey(now),
      weeklyBestScore: 0,
      weeklyBestRunId: '',
      weeklyAttempts: 0,
      leagueHistory: const <WeeklyHistoryEntry>[],
    );
  }
}

class LeagueTierRule {
  const LeagueTierRule({
    required this.tier,
    required this.promoteScore,
    required this.demoteScore,
  });

  final WeeklyTier tier;
  final int promoteScore;
  final int demoteScore;

  factory LeagueTierRule.fromJson(Map<String, dynamic> json) {
    return LeagueTierRule(
      tier: _tierFromString(json['tier']?.toString()),
      promoteScore: (json['promoteScore'] as num?)?.toInt() ?? 0,
      demoteScore: (json['demoteScore'] as num?)?.toInt() ?? 0,
    );
  }
}

WeeklyTier nextTier(WeeklyTier tier) {
  final idx = tier.index;
  if (idx >= WeeklyTier.values.length - 1) {
    return tier;
  }
  return WeeklyTier.values[idx + 1];
}

WeeklyTier prevTier(WeeklyTier tier) {
  final idx = tier.index;
  if (idx <= 0) {
    return tier;
  }
  return WeeklyTier.values[idx - 1];
}

WeeklyTier _tierFromString(String? raw) {
  switch (raw) {
    case 'silver':
      return WeeklyTier.silver;
    case 'gold':
      return WeeklyTier.gold;
    case 'platinum':
      return WeeklyTier.platinum;
    case 'diamond':
      return WeeklyTier.diamond;
    case 'bronze':
    default:
      return WeeklyTier.bronze;
  }
}
