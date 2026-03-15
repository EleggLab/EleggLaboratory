import 'package:flutter/foundation.dart';

@immutable
class AimVisibilityState {
  const AimVisibilityState({
    required this.isAiming,
    required this.pointerDown,
    required this.dragStartedInBoard,
    required this.inputLocked,
  });

  final bool isAiming;
  final bool pointerDown;
  final bool dragStartedInBoard;
  final bool inputLocked;
}

bool shouldShowAimPreview(AimVisibilityState state) {
  if (!state.isAiming) {
    return false;
  }
  if (state.inputLocked) {
    return false;
  }
  if (!state.pointerDown) {
    return false;
  }
  if (!state.dragStartedInBoard) {
    return false;
  }
  return true;
}

@immutable
class AimVisibilitySelfTestResult {
  const AimVisibilitySelfTestResult({required this.ok, required this.reason});

  final bool ok;
  final String reason;
}

AimVisibilitySelfTestResult evaluateAimVisibilitySelfTest({
  required bool idleVisible,
  required bool dragVisible,
  required bool endVisible,
}) {
  if (idleVisible) {
    return const AimVisibilitySelfTestResult(
      ok: false,
      reason: 'idle_should_be_hidden',
    );
  }
  if (!dragVisible) {
    return const AimVisibilitySelfTestResult(
      ok: false,
      reason: 'drag_should_be_visible',
    );
  }
  if (endVisible) {
    return const AimVisibilitySelfTestResult(
      ok: false,
      reason: 'end_should_be_hidden',
    );
  }
  return const AimVisibilitySelfTestResult(ok: true, reason: 'ok');
}
