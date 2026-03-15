import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/game/aim_preview_rules.dart';
import 'package:gamedev/models/game_options.dart';

void main() {
  test('aim selftest emits FAIL log text when constraints are violated', () {
    final config = resolveAimPreviewConfig(
      preset: AimPreviewLength.standard,
      playfieldHeightPx: 680,
      hasFocusRelic: false,
    );
    final result = evaluateAimSelfTest(
      segments: config.maxSegments + 2,
      totalLengthPx: config.maxTotalLengthPx,
      predictMs: 2,
      config: config,
    );
    final log = formatAimSelfTestLog(
      result: result,
      segments: config.maxSegments + 2,
      totalLengthPx: config.maxTotalLengthPx,
      predictMs: 2,
    );

    expect(log.startsWith('AIM_SELFTEST_FAIL:'), isTrue);
  });

  test('aim selftest emits OK log text when all constraints pass', () {
    final config = resolveAimPreviewConfig(
      preset: AimPreviewLength.standard,
      playfieldHeightPx: 680,
      hasFocusRelic: true,
    );
    final result = evaluateAimSelfTest(
      segments: config.maxSegments,
      totalLengthPx: config.maxTotalLengthPx - 1,
      predictMs: 4,
      config: config,
    );
    final log = formatAimSelfTestLog(
      result: result,
      segments: config.maxSegments,
      totalLengthPx: config.maxTotalLengthPx - 1,
      predictMs: 4,
    );

    expect(log.startsWith('AIM_SELFTEST_OK '), isTrue);
  });
}
