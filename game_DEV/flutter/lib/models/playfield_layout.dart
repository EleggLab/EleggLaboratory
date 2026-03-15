import 'dart:ui';

import 'package:flutter/foundation.dart';

@immutable
class PlayfieldLayout {
  const PlayfieldLayout({
    required this.safeTop,
    required this.safeBottom,
    required this.topHudHeight,
    required this.bottomHudHeight,
    this.horizontalPadding = 0,
  });

  final double safeTop;
  final double safeBottom;
  final double topHudHeight;
  final double bottomHudHeight;
  final double horizontalPadding;

  Rect playfieldRect(Size screenSize) {
    final topInset = (safeTop + topHudHeight).clamp(0.0, screenSize.height);
    final bottomInset = (safeBottom + bottomHudHeight).clamp(
      0.0,
      screenSize.height,
    );
    final minHeight = 32.0;
    final rawBottom = screenSize.height - bottomInset;
    final bottom = rawBottom.clamp(topInset + minHeight, screenSize.height);

    final maxPad = (screenSize.width * 0.5) - 1;
    final pad = horizontalPadding.clamp(0.0, maxPad);
    final left = pad;
    final right = (screenSize.width - pad).clamp(left + 1.0, screenSize.width);
    return Rect.fromLTRB(left, topInset, right, bottom);
  }

  bool closeTo(PlayfieldLayout other, {double epsilon = 0.5}) {
    return (safeTop - other.safeTop).abs() <= epsilon &&
        (safeBottom - other.safeBottom).abs() <= epsilon &&
        (topHudHeight - other.topHudHeight).abs() <= epsilon &&
        (bottomHudHeight - other.bottomHudHeight).abs() <= epsilon &&
        (horizontalPadding - other.horizontalPadding).abs() <= epsilon;
  }
}
