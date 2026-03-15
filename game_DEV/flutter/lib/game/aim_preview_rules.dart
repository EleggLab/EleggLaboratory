import 'dart:math' as math;
import 'dart:ui';

import 'package:flutter/foundation.dart';

import '../models/game_options.dart';

const int kAimPreviewHardIterationCap = 32;
const int kAimPreviewHardMaxBounces = 4;
const int kAimPreviewHardMaxSegments = 8;
const int kAimPreviewMaxComputeHz = 20;
const double kAimPreviewAngleEpsilonDeg = 0.25;
const double kAimPreviewMaxAbsoluteLengthPx = 720;
const double kAimPreviewHardHeightRatioCap = 0.85;
const double kAimSelfTestPredictMsTarget = 8.0;
const double kAimSelfTestPredictMsCeiling = 12.0;

@immutable
class AimPreviewConfig {
  const AimPreviewConfig({
    required this.maxSegments,
    required this.maxBounces,
    required this.maxTotalLengthPx,
    required this.maxComputeHz,
    required this.angleEpsilonDeg,
    this.hardIterationCap = kAimPreviewHardIterationCap,
  });

  final int maxSegments;
  final int maxBounces;
  final double maxTotalLengthPx;
  final int maxComputeHz;
  final double angleEpsilonDeg;
  final int hardIterationCap;

  double get minComputeIntervalSec => 1.0 / maxComputeHz;
}

double _lengthRatioForPreset(AimPreviewLength preset) {
  switch (preset) {
    case AimPreviewLength.short:
      return 0.45;
    case AimPreviewLength.long:
      return 0.70;
    case AimPreviewLength.standard:
      return 0.55;
  }
}

int _segmentCountForPreset(AimPreviewLength preset) {
  switch (preset) {
    case AimPreviewLength.short:
      return 4;
    case AimPreviewLength.long:
      return 6;
    case AimPreviewLength.standard:
      return 5;
  }
}

int _bounceCountForPreset(AimPreviewLength preset) {
  switch (preset) {
    case AimPreviewLength.short:
      return 1;
    case AimPreviewLength.long:
      return 3;
    case AimPreviewLength.standard:
      return 2;
  }
}

double _baseMaxLength({
  required AimPreviewLength preset,
  required double playfieldHeightPx,
}) {
  final ratio = _lengthRatioForPreset(preset);
  final candidate = playfieldHeightPx * ratio;
  return candidate.clamp(120.0, kAimPreviewMaxAbsoluteLengthPx).toDouble();
}

double _hardLengthCapForHeight(double playfieldHeightPx) {
  final byHeight = playfieldHeightPx * kAimPreviewHardHeightRatioCap;
  return byHeight.clamp(120.0, kAimPreviewMaxAbsoluteLengthPx).toDouble();
}

AimPreviewConfig resolveAimPreviewConfig({
  required AimPreviewLength preset,
  required double playfieldHeightPx,
  required bool hasFocusRelic,
}) {
  var maxSegments = _segmentCountForPreset(preset);
  var maxBounces = _bounceCountForPreset(preset);
  var maxTotalLengthPx = _baseMaxLength(
    preset: preset,
    playfieldHeightPx: playfieldHeightPx,
  );

  if (hasFocusRelic) {
    maxSegments += 1;
    maxBounces += 1;
    maxTotalLengthPx *= 1.14;
  }

  maxSegments = maxSegments.clamp(2, kAimPreviewHardMaxSegments);
  maxBounces = maxBounces.clamp(0, kAimPreviewHardMaxBounces);
  maxTotalLengthPx = math.min(
    maxTotalLengthPx,
    _hardLengthCapForHeight(playfieldHeightPx),
  );

  return AimPreviewConfig(
    maxSegments: maxSegments,
    maxBounces: maxBounces,
    maxTotalLengthPx: maxTotalLengthPx,
    maxComputeHz: kAimPreviewMaxComputeHz,
    angleEpsilonDeg: kAimPreviewAngleEpsilonDeg,
  );
}

double normalizeAimAngleDeg(double angleDeg) {
  var value = angleDeg % 360.0;
  if (value < 0) {
    value += 360.0;
  }
  return value;
}

double minAngleDeltaDeg(double aDeg, double bDeg) {
  final a = normalizeAimAngleDeg(aDeg);
  final b = normalizeAimAngleDeg(bDeg);
  final delta = (a - b).abs();
  return math.min(delta, 360.0 - delta);
}

bool shouldThrottleAimRecompute({
  required double nowSec,
  required double lastComputeSec,
  required int maxComputeHz,
}) {
  if (!lastComputeSec.isFinite) {
    return false;
  }
  if (maxComputeHz <= 0) {
    return false;
  }
  final minInterval = 1.0 / maxComputeHz;
  return (nowSec - lastComputeSec) < minInterval;
}

bool shouldReuseAimPreviewCache({
  required double currentAngleDeg,
  required double? cachedAngleDeg,
  required double angleEpsilonDeg,
}) {
  if (cachedAngleDeg == null || !cachedAngleDeg.isFinite) {
    return false;
  }
  return minAngleDeltaDeg(currentAngleDeg, cachedAngleDeg) <= angleEpsilonDeg;
}

bool shouldComputeAimPreview({
  required bool isAiming,
  required bool isDragging,
  required bool inputLocked,
}) {
  return isAiming && isDragging && !inputLocked;
}

int computeAimPreviewPointsHash(List<Offset> points) {
  var hash = 17;
  for (final point in points) {
    hash = 37 * hash + point.dx.round();
    hash = 37 * hash + point.dy.round();
  }
  return hash;
}

bool shouldRebuildAimPictureCache({
  required int previousHash,
  required int nextHash,
}) {
  return previousHash != nextHash;
}

double calculatePolylineLength(List<Offset> points) {
  if (points.length < 2) {
    return 0;
  }
  var total = 0.0;
  for (var i = 0; i < points.length - 1; i++) {
    total += (points[i + 1] - points[i]).distance;
  }
  return total;
}

@immutable
class AimSelfTestResult {
  const AimSelfTestResult({required this.ok, required this.reason});

  final bool ok;
  final String reason;
}

AimSelfTestResult evaluateAimSelfTest({
  required int segments,
  required double totalLengthPx,
  required double predictMs,
  required AimPreviewConfig config,
  double maxPredictMs = kAimSelfTestPredictMsCeiling,
}) {
  if (segments > config.maxSegments) {
    return const AimSelfTestResult(ok: false, reason: 'segmentsOverflow');
  }
  if (totalLengthPx > config.maxTotalLengthPx + 1.0) {
    return const AimSelfTestResult(ok: false, reason: 'lengthOverflow');
  }
  if (predictMs > maxPredictMs) {
    return const AimSelfTestResult(ok: false, reason: 'predictTooSlow');
  }
  return const AimSelfTestResult(ok: true, reason: 'ok');
}

String formatAimSelfTestLog({
  required AimSelfTestResult result,
  required int segments,
  required double totalLengthPx,
  required double predictMs,
}) {
  if (result.ok) {
    return 'AIM_SELFTEST_OK segments=$segments len=${totalLengthPx.toStringAsFixed(1)} ms=${predictMs.toStringAsFixed(2)}';
  }
  return 'AIM_SELFTEST_FAIL:${result.reason} segments=$segments len=${totalLengthPx.toStringAsFixed(1)} ms=${predictMs.toStringAsFixed(2)}';
}
