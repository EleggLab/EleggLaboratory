import 'package:flame/components.dart';

import '../data/units.dart';
import 'grid_component.dart';
import 'unit_component.dart';

class BattleArena extends PositionComponent {
  BattleArena()
    : grid = GridComponent(columns: 3, rows: 3, cellSize: Vector2(90, 90)),
      super(size: Vector2(270, 270));

  final GridComponent grid;
  final List<UnitComponent> allyUnits = <UnitComponent>[];
  final List<UnitComponent> enemyUnits = <UnitComponent>[];
  void Function(UnitComponent source)? onAllyUnitDragReleased;
  bool Function()? canDragAllies;
  double Function(UnitData data)? allyStatMultiplierResolver;

  @override
  Future<void> onLoad() async {
    add(grid);
    _spawnInitialUnits();
  }

  UnitComponent spawnUnitAtCell({
    required String unitId,
    required bool enemy,
    required int col,
    required int row,
  }) {
    final UnitData data = unitById(unitId);
    final UnitComponent unit = UnitComponent(
      data: data,
      isEnemy: enemy,
      statMultiplier: enemy
          ? 1.0
          : (allyStatMultiplierResolver?.call(data) ?? 1.0),
      position: grid.cellCenter(col, row),
      onDragReleased: enemy ? null : onAllyUnitDragReleased,
      canStartDrag: enemy ? null : canDragAllies,
    );
    add(unit);
    if (enemy) {
      enemyUnits.add(unit);
    } else {
      allyUnits.add(unit);
    }
    return unit;
  }

  UnitComponent spawnUnitByPosition({
    required String unitId,
    required bool enemy,
    required Vector2 position,
  }) {
    final UnitData data = unitById(unitId);
    final UnitComponent unit = UnitComponent(
      data: data,
      isEnemy: enemy,
      statMultiplier: enemy
          ? 1.0
          : (allyStatMultiplierResolver?.call(data) ?? 1.0),
      position: position.clone(),
      onDragReleased: enemy ? null : onAllyUnitDragReleased,
      canStartDrag: enemy ? null : canDragAllies,
    );
    add(unit);
    if (enemy) {
      enemyUnits.add(unit);
    } else {
      allyUnits.add(unit);
    }
    return unit;
  }

  void cleanupDefeated() {
    allyUnits.removeWhere((UnitComponent unit) {
      final bool defeated = !unit.isAlive;
      if (defeated) {
        unit.removeFromParent();
      }
      return defeated;
    });
    enemyUnits.removeWhere((UnitComponent unit) {
      final bool defeated = !unit.isAlive;
      if (defeated) {
        unit.removeFromParent();
      }
      return defeated;
    });
  }

  void removeAllyUnit(UnitComponent unit) {
    allyUnits.remove(unit);
    unit.removeFromParent();
  }

  void resetToInitialState() {
    for (final UnitComponent unit in <UnitComponent>[
      ...allyUnits,
      ...enemyUnits,
    ]) {
      unit.removeFromParent();
    }
    allyUnits.clear();
    enemyUnits.clear();
    _spawnInitialUnits();
  }

  void _spawnInitialUnits() {
    spawnUnitAtCell(unitId: 'warrior_1', enemy: false, col: 0, row: 0);
    spawnUnitAtCell(unitId: 'warrior_1', enemy: false, col: 0, row: 1);
    spawnUnitAtCell(unitId: 'warrior_1', enemy: false, col: 0, row: 2);
    spawnUnitAtCell(unitId: 'archer_1', enemy: false, col: 1, row: 1);

    spawnUnitAtCell(unitId: 'tank_1', enemy: true, col: 2, row: 0);
    spawnUnitAtCell(unitId: 'mage_1', enemy: true, col: 2, row: 1);
    spawnUnitAtCell(unitId: 'tank_1', enemy: true, col: 2, row: 2);
  }
}
