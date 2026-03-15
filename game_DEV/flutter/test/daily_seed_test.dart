import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/game/deterministic_rng.dart';

void main() {
  test('same date key yields same seed', () {
    const key = '2026-02-24';
    expect(dailySeedFromDateKey(key), dailySeedFromDateKey(key));
  });

  test('different date keys usually yield different seeds', () {
    const a = '2026-02-24';
    const b = '2026-02-25';
    expect(dailySeedFromDateKey(a), isNot(dailySeedFromDateKey(b)));
  });
}
