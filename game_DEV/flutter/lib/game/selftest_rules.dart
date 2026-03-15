import 'dart:ui';

import 'package:flutter/foundation.dart';

@immutable
class GameSelfTestInput {
  const GameSelfTestInput({
    required this.playfieldRect,
    required this.tileSize,
    required this.ballCount,
    required this.hasAimGuide,
  });

  final Rect playfieldRect;
  final double tileSize;
  final int ballCount;
  final bool hasAimGuide;
}

@immutable
class GameSelfTestResult {
  const GameSelfTestResult({required this.reasons});

  final List<String> reasons;

  bool get ok => reasons.isEmpty;
}

GameSelfTestResult evaluateGameSelfTest(GameSelfTestInput input) {
  final reasons = <String>[];
  if (input.playfieldRect.width <= 0 || input.playfieldRect.height <= 0) {
    reasons.add('playfieldRect<=0');
  }
  if (!input.tileSize.isFinite || input.tileSize <= 0) {
    reasons.add('tileSize<=0');
  }
  if (input.ballCount < 1) {
    reasons.add('ballCount<1');
  }
  return GameSelfTestResult(reasons: reasons);
}
