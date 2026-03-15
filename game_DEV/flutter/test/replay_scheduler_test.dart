import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/game/replay_scheduler.dart';
import 'package:gamedev/models/replay_data.dart';

void main() {
  test('scheduler dequeues events in turn/tick order', () {
    final scheduler = ReplayScheduler(
      events: const <ReplayEvent>[
        ReplayEvent(
          t: 30,
          turnIndex: 1,
          simTick: 5,
          type: ReplayEventType.recall,
          payload: <String, dynamic>{},
        ),
        ReplayEvent(
          t: 20,
          turnIndex: 0,
          simTick: 10,
          type: ReplayEventType.skill,
          payload: <String, dynamic>{'characterId': 'dos'},
        ),
        ReplayEvent(
          t: 10,
          turnIndex: 0,
          simTick: 3,
          type: ReplayEventType.shoot,
          payload: <String, dynamic>{'angleMilliDeg': 45000},
        ),
      ],
    );

    final first = scheduler.dequeueReady(turnIndex: 0, simTick: 4);
    expect(first.length, 1);
    expect(first.first.type, ReplayEventType.shoot);

    final second = scheduler.dequeueReady(turnIndex: 0, simTick: 10);
    expect(second.length, 1);
    expect(second.first.type, ReplayEventType.skill);

    final third = scheduler.dequeueReady(turnIndex: 1, simTick: 4);
    expect(third, isEmpty);

    final fourth = scheduler.dequeueReady(turnIndex: 1, simTick: 5);
    expect(fourth.length, 1);
    expect(fourth.first.type, ReplayEventType.recall);
    expect(scheduler.isFinished, isTrue);
  });
}
