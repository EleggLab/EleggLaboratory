import '../models/replay_data.dart';

class ReplayScheduler {
  ReplayScheduler({required List<ReplayEvent> events})
    : _events = List<ReplayEvent>.from(events)
        ..sort((a, b) {
          final turn = a.turnIndex.compareTo(b.turnIndex);
          if (turn != 0) {
            return turn;
          }
          final tick = a.simTick.compareTo(b.simTick);
          if (tick != 0) {
            return tick;
          }
          return a.t.compareTo(b.t);
        });

  final List<ReplayEvent> _events;
  int _cursor = 0;

  bool get isFinished => _cursor >= _events.length;

  ReplayEvent? get nextEvent => isFinished ? null : _events[_cursor];

  int get remainingCount => _events.length - _cursor;

  List<ReplayEvent> dequeueReady({
    required int turnIndex,
    required int simTick,
  }) {
    if (isFinished) {
      return const <ReplayEvent>[];
    }
    final ready = <ReplayEvent>[];
    while (!isFinished) {
      final event = _events[_cursor];
      final beforeTurn = event.turnIndex < turnIndex;
      final sameTurnReady =
          event.turnIndex == turnIndex && event.simTick <= simTick;
      if (!beforeTurn && !sameTurnReady) {
        break;
      }
      ready.add(event);
      _cursor += 1;
    }
    return ready;
  }
}
