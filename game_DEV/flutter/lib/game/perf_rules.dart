import 'package:flutter/foundation.dart';

const double kAimPerfDowngradeThresholdMs = 40.0;
const double kAimPerfSelfTestSevereThresholdMs = 50.0;

bool shouldDowngradeAimStyleForPerf({
  required bool isDraggingAim,
  required bool usingAnimatedAimStyle,
  required double p95FrameMs,
  double thresholdMs = kAimPerfDowngradeThresholdMs,
}) {
  if (!isDraggingAim || !usingAnimatedAimStyle) {
    return false;
  }
  if (!p95FrameMs.isFinite) {
    return false;
  }
  return p95FrameMs >= thresholdMs;
}

@immutable
class PerfSelfTestResult {
  const PerfSelfTestResult({required this.ok, required this.reason});

  final bool ok;
  final String reason;
}

PerfSelfTestResult evaluatePerfSelfTest({
  required double p95FrameMs,
  double severeThresholdMs = kAimPerfSelfTestSevereThresholdMs,
}) {
  if (!p95FrameMs.isFinite || p95FrameMs <= 0) {
    return const PerfSelfTestResult(ok: false, reason: 'no_samples');
  }
  if (p95FrameMs > severeThresholdMs) {
    return const PerfSelfTestResult(ok: false, reason: 'p95_too_high');
  }
  return const PerfSelfTestResult(ok: true, reason: 'ok');
}
