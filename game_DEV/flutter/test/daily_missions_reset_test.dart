import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/models/daily_missions_data.dart';

void main() {
  test('daily missions reset on date change', () {
    final first = DailyMissionsData.generateForDate('2026-02-24');
    final progressed = first.updateProgress(
      maxLoopReached: 99,
      maxComboReached: 99,
      bombBreakIncrement: 99,
      bossClearIncrement: 3,
      pickupIncrement: 99,
      completedDailyRun: true,
    );
    final reset = progressed.ensureDate('2026-02-25');

    expect(reset.date, '2026-02-25');
    expect(reset.missions.length, 3);
    for (final mission in reset.missions) {
      expect(mission.progress, 0);
      expect(mission.claimed, isFalse);
    }
  });
}
