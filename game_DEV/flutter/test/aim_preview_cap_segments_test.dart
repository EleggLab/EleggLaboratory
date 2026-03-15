import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/game/aim_preview_rules.dart';
import 'package:gamedev/models/game_options.dart';

void main() {
  test('segments never exceed configured maxSegments', () {
    final config = resolveAimPreviewConfig(
      preset: AimPreviewLength.standard,
      playfieldHeightPx: 640,
      hasFocusRelic: false,
    );

    final result = evaluateAimSelfTest(
      segments: config.maxSegments + 1,
      totalLengthPx: config.maxTotalLengthPx - 1,
      predictMs: 1,
      config: config,
    );

    expect(result.ok, isFalse);
    expect(result.reason, 'segmentsOverflow');
  });
}
