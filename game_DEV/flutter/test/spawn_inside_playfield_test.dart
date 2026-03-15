import 'dart:ui';

import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/game/ball_visibility_rules.dart';

void main() {
  test(
    'computeSpawnInsidePlayfield clamps spawn position inside playfield',
    () {
      const rect = Rect.fromLTWH(10, 120, 320, 500);
      final spawn = computeSpawnInsidePlayfield(
        playfieldRect: rect,
        preferredX: -999,
        preferredY: 9999,
        radius: 8,
        margin: 4,
      );

      expect(spawn.dx, greaterThanOrEqualTo(rect.left + 12));
      expect(spawn.dx, lessThanOrEqualTo(rect.right - 12));
      expect(spawn.dy, greaterThanOrEqualTo(rect.top + 12));
      expect(spawn.dy, lessThanOrEqualTo(rect.bottom - 12));
    },
  );
}
