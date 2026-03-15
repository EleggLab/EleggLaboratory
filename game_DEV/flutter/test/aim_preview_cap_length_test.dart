import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/game/aim_preview_rules.dart';
import 'package:gamedev/models/game_options.dart';

void main() {
  test('preview total length is capped by maxTotalLengthPx', () {
    final config = resolveAimPreviewConfig(
      preset: AimPreviewLength.long,
      playfieldHeightPx: 900,
      hasFocusRelic: false,
    );

    final result = evaluateAimSelfTest(
      segments: config.maxSegments,
      totalLengthPx: config.maxTotalLengthPx + 10,
      predictMs: 2,
      config: config,
    );

    expect(result.ok, isFalse);
    expect(result.reason, 'lengthOverflow');
  });
}
