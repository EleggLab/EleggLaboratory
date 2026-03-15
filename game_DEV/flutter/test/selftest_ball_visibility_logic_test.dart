import 'dart:ui';

import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/game/ball_visibility_rules.dart';

void main() {
  test(
    'ball visibility selftest fails when debug mode has no ball in playfield',
    () {
      const input = BallVisibilitySelfTestInput(
        playfieldRect: Rect.fromLTWH(10, 100, 320, 540),
        ballCount: 1,
        ballScreenPositions: <Offset>[Offset(2, 20)],
        renderCallCount: 0,
        ballDebugEnabled: true,
      );

      final result = evaluateBallVisibilitySelfTest(input);
      expect(result.ok, isFalse);
      expect(result.reason, 'ballDebugNoBallInsidePlayfield');
    },
  );
}
