import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/game/ball_visibility_rules.dart';

void main() {
  test('resolveBallRadius keeps minimum radius when computed is too small', () {
    final radius = resolveBallRadius(computedRadius: 1.5, minRadiusPx: 8);
    expect(radius, 8);
  });

  test('resolveBallRadius keeps minimum radius when computed is invalid', () {
    final radius = resolveBallRadius(
      computedRadius: double.nan,
      minRadiusPx: 7,
    );
    expect(radius, 7);
  });
}
