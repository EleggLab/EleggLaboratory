import 'dart:math' as math;
import 'dart:ui';

class BoardFitResult {
  const BoardFitResult({required this.tileSize, required this.boardRect});

  final double tileSize;
  final Rect boardRect;
}

BoardFitResult computeBoardFit({
  required Rect playfieldRect,
  required int cols,
  required int rows,
  bool bottomAlign = true,
}) {
  if (playfieldRect == Rect.zero ||
      playfieldRect.width <= 0 ||
      playfieldRect.height <= 0 ||
      cols <= 0 ||
      rows <= 0) {
    return const BoardFitResult(tileSize: 0, boardRect: Rect.zero);
  }

  final tileSize = math.min(
    playfieldRect.width / cols,
    playfieldRect.height / rows,
  );
  final boardW = tileSize * cols;
  final boardH = tileSize * rows;
  final dx = playfieldRect.width - boardW;
  final dy = playfieldRect.height - boardH;
  final left = playfieldRect.left + (dx * 0.5);
  final top = bottomAlign
      ? playfieldRect.top + dy
      : playfieldRect.top + (dy * 0.5);
  return BoardFitResult(
    tileSize: tileSize,
    boardRect: Rect.fromLTWH(left, top, boardW, boardH),
  );
}

class BoardFitSelfTestInput {
  const BoardFitSelfTestInput({
    required this.playfieldRect,
    required this.boardRect,
    required this.tileSize,
    required this.rows,
    this.bottomTolerancePx = 3.0,
    this.heightTolerancePx = 1.5,
  });

  final Rect playfieldRect;
  final Rect boardRect;
  final double tileSize;
  final int rows;
  final double bottomTolerancePx;
  final double heightTolerancePx;
}

class BoardFitSelfTestResult {
  const BoardFitSelfTestResult({required this.ok, required this.reason});

  final bool ok;
  final String reason;
}

BoardFitSelfTestResult evaluateBoardFitSelfTest(BoardFitSelfTestInput input) {
  if (input.playfieldRect == Rect.zero ||
      input.playfieldRect.width <= 0 ||
      input.playfieldRect.height <= 0) {
    return const BoardFitSelfTestResult(ok: false, reason: 'playfield_invalid');
  }
  if (input.boardRect == Rect.zero ||
      input.boardRect.width <= 0 ||
      input.boardRect.height <= 0) {
    return const BoardFitSelfTestResult(ok: false, reason: 'board_invalid');
  }
  if (!input.tileSize.isFinite || input.tileSize <= 0) {
    return const BoardFitSelfTestResult(ok: false, reason: 'tile_size_invalid');
  }

  final expectedHeight = input.tileSize * input.rows;
  if ((input.boardRect.height - expectedHeight).abs() >
      input.heightTolerancePx) {
    return const BoardFitSelfTestResult(
      ok: false,
      reason: 'board_height_mismatch',
    );
  }

  final bottomDelta = (input.playfieldRect.bottom - input.boardRect.bottom)
      .abs();
  if (bottomDelta > input.bottomTolerancePx) {
    return const BoardFitSelfTestResult(
      ok: false,
      reason: 'board_not_bottom_aligned',
    );
  }

  return const BoardFitSelfTestResult(ok: true, reason: 'ok');
}

String formatBoardFitSelfTestLog({
  required BoardFitSelfTestResult result,
  required Rect playfieldRect,
  required Rect boardRect,
  required double tileSize,
}) {
  final payload =
      'tile=${tileSize.toStringAsFixed(2)} '
      'playfield=(${playfieldRect.left.toStringAsFixed(1)},${playfieldRect.top.toStringAsFixed(1)},'
      '${playfieldRect.right.toStringAsFixed(1)},${playfieldRect.bottom.toStringAsFixed(1)}) '
      'board=(${boardRect.left.toStringAsFixed(1)},${boardRect.top.toStringAsFixed(1)},'
      '${boardRect.right.toStringAsFixed(1)},${boardRect.bottom.toStringAsFixed(1)})';
  if (result.ok) {
    return 'BOARD_FIT_OK $payload';
  }
  return 'BOARD_FIT_FAIL:${result.reason} $payload';
}
