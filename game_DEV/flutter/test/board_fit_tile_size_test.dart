import 'dart:ui';

import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/game/board_fit_rules.dart';

void main() {
  test('board fit tile size uses min(playfield.w/8, playfield.h/12)', () {
    const playfield = Rect.fromLTWH(0, 120, 336, 516);
    final result = computeBoardFit(
      playfieldRect: playfield,
      cols: 8,
      rows: 12,
      bottomAlign: true,
    );

    final expected = (playfield.width / 8) < (playfield.height / 12)
        ? (playfield.width / 8)
        : (playfield.height / 12);
    expect(result.tileSize, closeTo(expected, 1e-6));
    expect(result.boardRect.width, closeTo(result.tileSize * 8, 1e-6));
    expect(result.boardRect.height, closeTo(result.tileSize * 12, 1e-6));
  });
}
