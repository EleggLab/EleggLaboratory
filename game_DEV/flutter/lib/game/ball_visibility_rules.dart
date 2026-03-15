import 'dart:math' as math;
import 'dart:ui';

double resolveBallRadius({
  required double computedRadius,
  double minRadiusPx = 6.0,
}) {
  if (!computedRadius.isFinite || computedRadius <= 0) {
    return minRadiusPx;
  }
  return math.max(computedRadius, minRadiusPx);
}

Offset computeSpawnInsidePlayfield({
  required Rect playfieldRect,
  required double preferredX,
  required double preferredY,
  required double radius,
  double margin = 4.0,
}) {
  if (playfieldRect == Rect.zero ||
      playfieldRect.width <= 0 ||
      playfieldRect.height <= 0) {
    return Offset(preferredX, preferredY);
  }
  final minX = playfieldRect.left + radius + margin;
  final maxX = playfieldRect.right - radius - margin;
  final minY = playfieldRect.top + radius + margin;
  final maxY = playfieldRect.bottom - radius - margin;
  return Offset(
    preferredX.clamp(minX, maxX).toDouble(),
    preferredY.clamp(minY, maxY).toDouble(),
  );
}

bool isBallInsidePlayfield({
  required Offset screenPos,
  required Rect playfieldRect,
}) {
  if (playfieldRect == Rect.zero) {
    return false;
  }
  return playfieldRect.contains(screenPos);
}

class BallVisibilitySelfTestInput {
  const BallVisibilitySelfTestInput({
    required this.playfieldRect,
    required this.ballCount,
    required this.ballScreenPositions,
    required this.renderCallCount,
    required this.ballDebugEnabled,
  });

  final Rect playfieldRect;
  final int ballCount;
  final List<Offset> ballScreenPositions;
  final int renderCallCount;
  final bool ballDebugEnabled;
}

class BallVisibilitySelfTestResult {
  const BallVisibilitySelfTestResult({required this.ok, required this.reason});

  final bool ok;
  final String reason;
}

BallVisibilitySelfTestResult evaluateBallVisibilitySelfTest(
  BallVisibilitySelfTestInput input,
) {
  if (input.ballCount < 1) {
    return const BallVisibilitySelfTestResult(ok: false, reason: 'ballCount<1');
  }
  if (input.playfieldRect == Rect.zero ||
      input.playfieldRect.width <= 0 ||
      input.playfieldRect.height <= 0) {
    return const BallVisibilitySelfTestResult(
      ok: false,
      reason: 'playfieldInvalid',
    );
  }
  final insideCount = input.ballScreenPositions
      .where(
        (pos) => isBallInsidePlayfield(
          screenPos: pos,
          playfieldRect: input.playfieldRect,
        ),
      )
      .length;
  if (input.ballDebugEnabled && insideCount < 1) {
    return const BallVisibilitySelfTestResult(
      ok: false,
      reason: 'ballDebugNoBallInsidePlayfield',
    );
  }
  if (input.renderCallCount < 1 && insideCount < 1) {
    return const BallVisibilitySelfTestResult(
      ok: false,
      reason: 'ballRenderMissing',
    );
  }
  return const BallVisibilitySelfTestResult(ok: true, reason: 'ok');
}
