import 'dart:ui';

import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/game/board_fit_rules.dart';

void main() {
  test('board fit keeps board bottom aligned to playfield bottom', () {
    const playfield = Rect.fromLTWH(12, 132, 336, 522);
    final result = computeBoardFit(
      playfieldRect: playfield,
      cols: 8,
      rows: 12,
      bottomAlign: true,
    );

    expect(result.boardRect.bottom, closeTo(playfield.bottom, 1e-6));
    expect(result.boardRect.left, greaterThanOrEqualTo(playfield.left));
    expect(result.boardRect.right, lessThanOrEqualTo(playfield.right));
  });
}
