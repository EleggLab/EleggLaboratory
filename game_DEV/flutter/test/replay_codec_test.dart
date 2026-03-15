import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/models/replay_data.dart';

void main() {
  test('replay codec preserves event fields', () {
    const replay = RunReplay(
      schemaVersion: 1,
      runId: 'run_123',
      mode: 'weekly',
      seed: 424242,
      startedAt: 1700000000,
      selectedCharacterId: 'dos',
      prngStateAtStart: 77,
      events: <ReplayEvent>[
        ReplayEvent(
          t: 1,
          turnIndex: 0,
          simTick: 0,
          type: ReplayEventType.shoot,
          payload: <String, dynamic>{'angleMilliDeg': 12345},
        ),
        ReplayEvent(
          t: 2,
          turnIndex: 1,
          simTick: 12,
          type: ReplayEventType.shopAction,
          payload: <String, dynamic>{
            'action': 'buy',
            'slotIndex': 2,
            'itemId': 'augment_crit10',
          },
        ),
      ],
    );

    final encoded = jsonEncode(replay.toJson());
    final decoded = RunReplay.fromJson(
      Map<String, dynamic>.from(jsonDecode(encoded) as Map),
    );

    expect(decoded.runId, replay.runId);
    expect(decoded.mode, replay.mode);
    expect(decoded.seed, replay.seed);
    expect(decoded.prngStateAtStart, replay.prngStateAtStart);
    expect(decoded.events.length, replay.events.length);
    expect(decoded.events.first.type, ReplayEventType.shoot);
    expect(
      decoded.events.first.payload['angleMilliDeg'],
      replay.events.first.payload['angleMilliDeg'],
    );
    expect(decoded.events.last.type, ReplayEventType.shopAction);
    expect(decoded.events.last.turnIndex, 1);
    expect(decoded.events.last.simTick, 12);
    expect(decoded.events.last.payload['itemId'], 'augment_crit10');
  });
}
