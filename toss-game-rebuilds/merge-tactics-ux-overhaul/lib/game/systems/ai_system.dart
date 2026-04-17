import 'package:flame/components.dart';

import '../components/battle_arena.dart';
import '../components/unit_component.dart';

class AiSystem {
  AiSystem(this.arena);

  final BattleArena arena;
  double _accumulator = 0;
  static const double _thinkInterval = 0.2;

  void update(double dt) {
    _accumulator += dt;
    if (_accumulator < _thinkInterval) {
      return;
    }
    _accumulator = 0;
    _stepEnemyFormation();
  }

  void _stepEnemyFormation() {
    for (final UnitComponent enemy in arena.enemyUnits) {
      final UnitComponent? target = _nearestAlly(enemy);
      if (target == null) {
        continue;
      }
      final Vector2 direction = target.position - enemy.position;
      final double distance = direction.length;
      if (distance < 1) {
        continue;
      }
      direction.normalize();
      enemy.position += direction * 3;
    }
  }

  UnitComponent? _nearestAlly(UnitComponent enemy) {
    UnitComponent? nearest;
    double shortest = double.infinity;
    for (final UnitComponent ally in arena.allyUnits) {
      if (!ally.isAlive) {
        continue;
      }
      final double distance = enemy.position.distanceTo(ally.position);
      if (distance < shortest) {
        shortest = distance;
        nearest = ally;
      }
    }
    return nearest;
  }
}
