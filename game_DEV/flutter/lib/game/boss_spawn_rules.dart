import 'dart:ui';

import 'package:flutter/foundation.dart';

bool shouldSpawnBoss({required int loop, required bool bossAlive}) {
  return loop > 0 && loop % 20 == 0 && !bossAlive;
}

String bossSpawnSkipReason({required int loop, required bool bossAlive}) {
  if (bossAlive) {
    return 'boss_alive';
  }
  if (loop <= 0) {
    return 'loop<=0';
  }
  if (loop % 20 != 0) {
    return 'not_multiple_of_20';
  }
  return '-';
}

@immutable
class BossSpawnPlacementPlan {
  const BossSpawnPlacementPlan({
    required this.col,
    required this.row,
    required this.forced,
  });

  final int col;
  final int row;
  final bool forced;
}

BossSpawnPlacementPlan planBossSpawnPlacement({
  required int boardCols,
  required int boardRows,
  required int bossWidth,
  required int bossHeight,
  required int preferredCol,
  required int preferredRow,
  required Set<int> occupiedCellKeys,
}) {
  final clampedCol = preferredCol.clamp(0, boardCols - bossWidth).toInt();
  final clampedRow = preferredRow.clamp(0, boardRows - bossHeight).toInt();
  var forced = clampedCol != preferredCol || clampedRow != preferredRow;

  for (var row = clampedRow; row < clampedRow + bossHeight; row++) {
    for (var col = clampedCol; col < clampedCol + bossWidth; col++) {
      final key = (row * boardCols) + col;
      if (occupiedCellKeys.contains(key)) {
        forced = true;
      }
    }
  }

  return BossSpawnPlacementPlan(
    col: clampedCol,
    row: clampedRow,
    forced: forced,
  );
}

String formatBossCheckLog({
  required int loop,
  required bool bossAlive,
  required bool shouldSpawn,
  required String reasonSkip,
}) {
  return 'BOSS_CHECK loop=$loop bossAlive=$bossAlive should=$shouldSpawn reasonSkip=$reasonSkip';
}

String formatBossSpawnLog({
  required int attempt,
  required bool forced,
  required Rect rect,
  required String timing,
  required int loop,
}) {
  return 'BOSS_SPAWN attempt=$attempt forced=$forced rect=(${rect.left.toStringAsFixed(1)},${rect.top.toStringAsFixed(1)},${rect.right.toStringAsFixed(1)},${rect.bottom.toStringAsFixed(1)}) timing=$timing loop=$loop';
}
