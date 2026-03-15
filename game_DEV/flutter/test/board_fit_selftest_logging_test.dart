import 'dart:ui';

import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/game/board_fit_rules.dart';

void main() {
  test(
    'board fit selftest reports fail reason and fail log when not aligned',
    () {
      const playfield = Rect.fromLTWH(0, 140, 360, 500);
      const board = Rect.fromLTWH(12, 140, 336, 420);
      const tileSize = 35.0;

      final result = evaluateBoardFitSelfTest(
        const BoardFitSelfTestInput(
          playfieldRect: playfield,
          boardRect: board,
          tileSize: tileSize,
          rows: 12,
          bottomTolerancePx: 2.0,
        ),
      );
      final log = formatBoardFitSelfTestLog(
        result: result,
        playfieldRect: playfield,
        boardRect: board,
        tileSize: tileSize,
      );

      expect(result.ok, isFalse);
      expect(result.reason, isNotEmpty);
      expect(log, contains('BOARD_FIT_FAIL'));
    },
  );
}
