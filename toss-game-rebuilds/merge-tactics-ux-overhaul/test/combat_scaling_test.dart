import 'package:flame/components.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merge_tactics/game/components/battle_arena.dart';
import 'package:merge_tactics/game/components/unit_component.dart';
import 'package:merge_tactics/game/data/units.dart';
import 'package:merge_tactics/game/systems/battle_system.dart';

void main() {
  test('unit component applies card multiplier to combat stats', () {
    final UnitData data = unitById('warrior_1');
    final UnitComponent unit = UnitComponent(
      data: data,
      isEnemy: false,
      position: Vector2.zero(),
      statMultiplier: 1.2,
    );

    expect(unit.maxHp, closeTo(data.hp * 1.2, 0.001));
    expect(unit.attackPower, closeTo(data.attack * 1.2, 0.001));
    expect(unit.defensePower, closeTo(data.defense * 1.2, 0.001));
  });

  test('battle damage calculation respects effective defense scaling', () {
    final BattleSystem battleSystem = BattleSystem(BattleArena());
    final UnitComponent attacker = UnitComponent(
      data: unitById('warrior_1'),
      isEnemy: false,
      position: Vector2.zero(),
      statMultiplier: 1.5,
    );
    final UnitComponent lowDefenseTarget = UnitComponent(
      data: unitById('archer_1'),
      isEnemy: true,
      position: Vector2.zero(),
      statMultiplier: 1.0,
    );
    final UnitComponent highDefenseTarget = UnitComponent(
      data: unitById('tank_1'),
      isEnemy: true,
      position: Vector2.zero(),
      statMultiplier: 1.4,
    );

    final int lowDefenseDamage = battleSystem.calculateDamage(
      attacker,
      lowDefenseTarget,
    );
    final int highDefenseDamage = battleSystem.calculateDamage(
      attacker,
      highDefenseTarget,
    );

    expect(lowDefenseDamage, greaterThan(highDefenseDamage));
  });
}
