class RunRecordData {
  const RunRecordData({
    this.runId = '',
    required this.timestampIso,
    required this.mode,
    required this.seed,
    required this.score,
    required this.maxLoop,
    required this.bossesKilled,
    required this.maxCombo,
    required this.totalBlocksBroken,
    required this.characterId,
    required this.augmentCount,
    this.replayPath = '',
    this.weekKey = '',
  });

  final String runId;
  final String timestampIso;
  final String mode;
  final int seed;
  final int score;
  final int maxLoop;
  final int bossesKilled;
  final int maxCombo;
  final int totalBlocksBroken;
  final String characterId;
  final int augmentCount;
  final String replayPath;
  final String weekKey;

  DateTime get timestamp {
    return DateTime.tryParse(timestampIso) ??
        DateTime.fromMillisecondsSinceEpoch(0);
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'timestampIso': timestampIso,
      'mode': mode,
      'seed': seed,
      'score': score,
      'maxLoop': maxLoop,
      'bossesKilled': bossesKilled,
      'maxCombo': maxCombo,
      'totalBlocksBroken': totalBlocksBroken,
      'characterId': characterId,
      'augmentCount': augmentCount,
      'runId': runId,
      'replayPath': replayPath,
      'weekKey': weekKey,
    };
  }

  factory RunRecordData.fromJson(Map<String, dynamic> json) {
    return RunRecordData(
      runId:
          (json['runId'] as String?) ??
          'run_${DateTime.now().millisecondsSinceEpoch}',
      timestampIso:
          (json['timestampIso'] as String?) ?? DateTime.now().toIso8601String(),
      mode: (json['mode'] as String?) ?? 'classic',
      seed: (json['seed'] as int?) ?? 1,
      score: (json['score'] as int?) ?? 0,
      maxLoop: (json['maxLoop'] as int?) ?? 0,
      bossesKilled: (json['bossesKilled'] as int?) ?? 0,
      maxCombo: (json['maxCombo'] as int?) ?? 0,
      totalBlocksBroken: (json['totalBlocksBroken'] as int?) ?? 0,
      characterId: (json['characterId'] as String?) ?? 'dos',
      augmentCount: (json['augmentCount'] as int?) ?? 0,
      replayPath: (json['replayPath'] as String?) ?? '',
      weekKey: (json['weekKey'] as String?) ?? '',
    );
  }
}

List<RunRecordData> appendRunHistory(
  List<RunRecordData> current,
  RunRecordData next, {
  int limit = 10,
}) {
  final merged = <RunRecordData>[next, ...current];
  if (merged.length <= limit) {
    return merged;
  }
  return merged.sublist(0, limit);
}
