import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/game/boss_spawn_rules.dart';

void main() {
  test('boss placement is marked forced when preferred area is occupied', () {
    const boardCols = 8;
    const boardRows = 12;
    const bossWidth = 3;
    const bossHeight = 2;
    const preferredCol = 2;
    const preferredRow = 0;

    final occupied = <int>{
      // One cell inside preferred spawn footprint.
      (0 * boardCols) + 3,
    };

    final placement = planBossSpawnPlacement(
      boardCols: boardCols,
      boardRows: boardRows,
      bossWidth: bossWidth,
      bossHeight: bossHeight,
      preferredCol: preferredCol,
      preferredRow: preferredRow,
      occupiedCellKeys: occupied,
    );

    expect(placement.col, preferredCol);
    expect(placement.row, preferredRow);
    expect(placement.forced, isTrue);
  });
}
