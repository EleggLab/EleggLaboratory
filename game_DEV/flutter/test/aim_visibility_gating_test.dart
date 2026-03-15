import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/game/aim_visibility_rules.dart';

void main() {
  test('aim preview is hidden on idle', () {
    final visible = shouldShowAimPreview(
      const AimVisibilityState(
        isAiming: true,
        pointerDown: false,
        dragStartedInBoard: false,
        inputLocked: false,
      ),
    );
    expect(visible, isFalse);
  });

  test('aim preview is visible while dragging in aiming state', () {
    final visible = shouldShowAimPreview(
      const AimVisibilityState(
        isAiming: true,
        pointerDown: true,
        dragStartedInBoard: true,
        inputLocked: false,
      ),
    );
    expect(visible, isTrue);
  });

  test('aim preview hides again after pointer up', () {
    final result = evaluateAimVisibilitySelfTest(
      idleVisible: false,
      dragVisible: true,
      endVisible: false,
    );
    expect(result.ok, isTrue);
    expect(result.reason, 'ok');
  });
}
