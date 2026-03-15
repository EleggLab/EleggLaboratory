import 'dart:ui';

import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/game/boss_spawn_rules.dart';

void main() {
  test('boss check log contains loop and spawn decision fields', () {
    final line = formatBossCheckLog(
      loop: 20,
      bossAlive: false,
      shouldSpawn: true,
      reasonSkip: '-',
    );

    expect(line, contains('BOSS_CHECK'));
    expect(line, contains('loop=20'));
    expect(line, contains('bossAlive=false'));
    expect(line, contains('should=true'));
  });

  test('boss spawn log contains attempt and forced placement marker', () {
    final line = formatBossSpawnLog(
      attempt: 2,
      forced: true,
      rect: const Rect.fromLTWH(10, 20, 30, 40),
      timing: 'resolving_end',
      loop: 20,
    );

    expect(line, contains('BOSS_SPAWN'));
    expect(line, contains('attempt=2'));
    expect(line, contains('forced=true'));
    expect(line, contains('timing=resolving_end'));
    expect(line, contains('loop=20'));
  });
}
