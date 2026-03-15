import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/game/perf_rules.dart';

void main() {
  test('aim style is downgraded when p95 exceeds threshold during drag', () {
    final shouldDowngrade = shouldDowngradeAimStyleForPerf(
      isDraggingAim: true,
      usingAnimatedAimStyle: true,
      p95FrameMs: 45,
    );
    expect(shouldDowngrade, isTrue);
  });

  test('aim style is not downgraded when not dragging', () {
    final shouldDowngrade = shouldDowngradeAimStyleForPerf(
      isDraggingAim: false,
      usingAnimatedAimStyle: true,
      p95FrameMs: 60,
    );
    expect(shouldDowngrade, isFalse);
  });
}
