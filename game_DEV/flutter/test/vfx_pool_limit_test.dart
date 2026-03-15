import 'dart:math';

import 'package:flame/components.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/game/vfx_manager.dart';
import 'package:gamedev/models/game_options.dart';

void main() {
  test('vfx manager caps pooled effect counts', () {
    final manager = VfxManager(random: Random(7));
    manager.configure(
      sfxEnabled: false,
      vibrationEnabled: false,
      intensity: VfxIntensity.high,
    );

    for (var i = 0; i < 240; i++) {
      final pos = Vector2(120 + (i % 9).toDouble(), 220 + (i % 7).toDouble());
      manager.onBlockHit(cellCol: i % 8, cellRow: i % 12, position: pos);
      manager.onBlockBreak(
        cellCol: i % 8,
        cellRow: i % 12,
        position: pos,
        type: VfxBlockType.normal,
      );
      manager.onBombExplode(position: pos, affectedCellsCount: 6);
      manager.onRecallPressed(
        ballPositions: <Vector2>[pos, pos + Vector2(3, -8)],
        bottomCollectY: 680,
      );
    }

    expect(manager.sparkCount, lessThanOrEqualTo(VfxManager.maxSparkCount));
    expect(manager.ringCount, lessThanOrEqualTo(VfxManager.maxRingCount));
    expect(manager.flashCount, lessThanOrEqualTo(VfxManager.maxFlashCount));
    expect(
      manager.recallGhostCount,
      lessThanOrEqualTo(VfxManager.maxRecallGhostCount),
    );
  });
}
