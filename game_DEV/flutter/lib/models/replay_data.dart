enum ReplayEventType { shoot, recall, skill, chooseAugment, shopAction }

class ReplayEvent {
  const ReplayEvent({
    required this.t,
    required this.turnIndex,
    required this.simTick,
    required this.type,
    required this.payload,
  });

  final int t;
  final int turnIndex;
  final int simTick;
  final ReplayEventType type;
  final Map<String, dynamic> payload;

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      't': t,
      'turnIndex': turnIndex,
      'simTick': simTick,
      'type': type.name,
      'payload': payload,
    };
  }

  factory ReplayEvent.fromJson(Map<String, dynamic> json) {
    return ReplayEvent(
      t: (json['t'] as num?)?.toInt() ?? 0,
      turnIndex: (json['turnIndex'] as num?)?.toInt() ?? 0,
      simTick: (json['simTick'] as num?)?.toInt() ?? 0,
      type: _eventTypeFromString(json['type']?.toString()),
      payload: json['payload'] is Map
          ? Map<String, dynamic>.from(json['payload'] as Map)
          : const <String, dynamic>{},
    );
  }
}

class RunReplay {
  const RunReplay({
    required this.schemaVersion,
    required this.runId,
    required this.mode,
    required this.seed,
    required this.startedAt,
    required this.selectedCharacterId,
    required this.prngStateAtStart,
    required this.events,
  });

  final int schemaVersion;
  final String runId;
  final String mode;
  final int seed;
  final int startedAt;
  final String selectedCharacterId;
  final int prngStateAtStart;
  final List<ReplayEvent> events;

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'schemaVersion': schemaVersion,
      'runId': runId,
      'mode': mode,
      'seed': seed,
      'startedAt': startedAt,
      'selectedCharacterId': selectedCharacterId,
      'prngStateAtStart': prngStateAtStart,
      'events': events.map((entry) => entry.toJson()).toList(),
    };
  }

  factory RunReplay.fromJson(Map<String, dynamic> json) {
    final rawEvents = json['events'];
    final events = <ReplayEvent>[];
    if (rawEvents is List) {
      for (final raw in rawEvents) {
        if (raw is! Map) {
          continue;
        }
        events.add(ReplayEvent.fromJson(Map<String, dynamic>.from(raw)));
      }
    }
    return RunReplay(
      schemaVersion: (json['schemaVersion'] as num?)?.toInt() ?? 1,
      runId: (json['runId'] as String?) ?? 'replay_unknown',
      mode: (json['mode'] as String?) ?? 'classic',
      seed: (json['seed'] as num?)?.toInt() ?? 1,
      startedAt: (json['startedAt'] as num?)?.toInt() ?? 0,
      selectedCharacterId: (json['selectedCharacterId'] as String?) ?? 'dos',
      prngStateAtStart: (json['prngStateAtStart'] as num?)?.toInt() ?? 1,
      events: events,
    );
  }
}

class ReplayIndexEntry {
  const ReplayIndexEntry({
    required this.runId,
    required this.path,
    required this.mode,
    required this.seed,
    required this.createdAt,
  });

  final String runId;
  final String path;
  final String mode;
  final int seed;
  final int createdAt;

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'runId': runId,
      'path': path,
      'mode': mode,
      'seed': seed,
      'createdAt': createdAt,
    };
  }

  factory ReplayIndexEntry.fromJson(Map<String, dynamic> json) {
    return ReplayIndexEntry(
      runId: (json['runId'] as String?) ?? '',
      path: (json['path'] as String?) ?? '',
      mode: (json['mode'] as String?) ?? 'classic',
      seed: (json['seed'] as num?)?.toInt() ?? 1,
      createdAt: (json['createdAt'] as num?)?.toInt() ?? 0,
    );
  }
}

ReplayEventType _eventTypeFromString(String? raw) {
  switch (raw) {
    case 'shoot':
      return ReplayEventType.shoot;
    case 'recall':
      return ReplayEventType.recall;
    case 'skill':
      return ReplayEventType.skill;
    case 'chooseAugment':
      return ReplayEventType.chooseAugment;
    case 'shopAction':
      return ReplayEventType.shopAction;
    default:
      return ReplayEventType.shoot;
  }
}
