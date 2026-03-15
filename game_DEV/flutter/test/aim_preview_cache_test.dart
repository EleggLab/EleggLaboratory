import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/game/aim_preview_rules.dart';

void main() {
  test('angle epsilon reuses preview cache for tiny angle changes', () {
    expect(
      shouldReuseAimPreviewCache(
        currentAngleDeg: 30.20,
        cachedAngleDeg: 30.0,
        angleEpsilonDeg: 0.25,
      ),
      isTrue,
    );

    expect(
      shouldReuseAimPreviewCache(
        currentAngleDeg: 30.30,
        cachedAngleDeg: 30.0,
        angleEpsilonDeg: 0.25,
      ),
      isFalse,
    );
  });
}
