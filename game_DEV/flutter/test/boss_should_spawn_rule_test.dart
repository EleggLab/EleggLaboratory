import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/game/boss_spawn_rules.dart';

void main() {
  test('boss should spawn at loop 20 and 40 when no alive boss', () {
    expect(shouldSpawnBoss(loop: 20, bossAlive: false), isTrue);
    expect(shouldSpawnBoss(loop: 40, bossAlive: false), isTrue);
  });

  test('boss should not spawn when already alive', () {
    expect(shouldSpawnBoss(loop: 20, bossAlive: true), isFalse);
  });
}
