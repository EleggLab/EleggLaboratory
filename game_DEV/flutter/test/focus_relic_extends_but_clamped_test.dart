import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/game/aim_preview_rules.dart';
import 'package:gamedev/models/game_options.dart';

void main() {
  test('focus relic extends preview but stays within hard caps', () {
    final base = resolveAimPreviewConfig(
      preset: AimPreviewLength.long,
      playfieldHeightPx: 1000,
      hasFocusRelic: false,
    );
    final focused = resolveAimPreviewConfig(
      preset: AimPreviewLength.long,
      playfieldHeightPx: 1000,
      hasFocusRelic: true,
    );

    expect(focused.maxTotalLengthPx, greaterThan(base.maxTotalLengthPx));
    expect(focused.maxTotalLengthPx, lessThanOrEqualTo(850.0));
    expect(focused.maxTotalLengthPx, lessThanOrEqualTo(720.0));
    expect(focused.maxBounces, lessThanOrEqualTo(4));
  });
}
