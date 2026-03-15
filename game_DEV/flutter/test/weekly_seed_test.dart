import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/game/deterministic_rng.dart';

void main() {
  test('same week key yields same weekly seed', () {
    const weekKey = '2026-W09';
    final seedA = weeklySeedFromWeekKey(weekKey);
    final seedB = weeklySeedFromWeekKey(weekKey);
    expect(seedA, seedB);
  });

  test('different week keys yield different weekly seeds', () {
    final seedA = weeklySeedFromWeekKey('2026-W09');
    final seedB = weeklySeedFromWeekKey('2026-W10');
    expect(seedA, isNot(seedB));
  });
}
