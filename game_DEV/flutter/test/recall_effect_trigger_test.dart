import 'dart:math';

import 'package:flame/components.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/game/vfx_manager.dart';
import 'package:gamedev/models/game_options.dart';

void main() {
  test('recall effect triggers ghosts and event label', () {
    final manager = VfxManager(random: Random(21));
    manager.configure(
      sfxEnabled: false,
      vibrationEnabled: false,
      intensity: VfxIntensity.medium,
    );

    manager.onRecallPressed(
      ballPositions: <Vector2>[Vector2(80, 440), Vector2(120, 430)],
      bottomCollectY: 600,
    );

    expect(manager.recallGhostCount, greaterThan(0));
    expect(manager.debugEventLabel, startsWith('recall('));
  });
}
