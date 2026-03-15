import 'dart:ui';

import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/game/selftest_rules.dart';

void main() {
  test('selftest reports failure when ball count is zero', () {
    const input = GameSelfTestInput(
      playfieldRect: Rect.fromLTWH(0, 120, 320, 420),
      tileSize: 32,
      ballCount: 0,
      hasAimGuide: true,
    );
    final result = evaluateGameSelfTest(input);
    expect(result.ok, isFalse);
    expect(result.reasons.join(','), contains('ballCount<1'));
  });

  test('selftest passes when required values are valid', () {
    const input = GameSelfTestInput(
      playfieldRect: Rect.fromLTWH(0, 120, 320, 420),
      tileSize: 32,
      ballCount: 1,
      hasAimGuide: true,
    );
    final result = evaluateGameSelfTest(input);
    expect(result.ok, isTrue);
    expect(result.reasons, isEmpty);
  });
}
