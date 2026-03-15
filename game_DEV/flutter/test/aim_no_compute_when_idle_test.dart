import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/game/aim_preview_rules.dart';

void main() {
  test('aim preview compute is skipped on idle', () {
    final shouldCompute = shouldComputeAimPreview(
      isAiming: true,
      isDragging: false,
      inputLocked: false,
    );
    expect(shouldCompute, isFalse);
  });

  test('aim preview compute is skipped when input is locked', () {
    final shouldCompute = shouldComputeAimPreview(
      isAiming: true,
      isDragging: true,
      inputLocked: true,
    );
    expect(shouldCompute, isFalse);
  });
}
