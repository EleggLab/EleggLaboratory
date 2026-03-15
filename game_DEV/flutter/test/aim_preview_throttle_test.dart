import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/game/aim_preview_rules.dart';

void main() {
  test('aim preview compute throttle respects maxComputeHz', () {
    expect(
      shouldThrottleAimRecompute(
        nowSec: 1.00,
        lastComputeSec: 0.97,
        maxComputeHz: 20,
      ),
      isTrue,
    );

    expect(
      shouldThrottleAimRecompute(
        nowSec: 1.20,
        lastComputeSec: 1.00,
        maxComputeHz: 20,
      ),
      isFalse,
    );
  });
}
