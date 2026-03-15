import 'dart:ui';

import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/models/playfield_layout.dart';

void main() {
  test('playfield rect reflects safe/hud reserved heights', () {
    const layout = PlayfieldLayout(
      safeTop: 24,
      safeBottom: 34,
      topHudHeight: 108,
      bottomHudHeight: 112,
      horizontalPadding: 12,
    );

    final rect = layout.playfieldRect(const Size(360, 800));
    expect(rect.left, 12);
    expect(rect.right, 348);
    expect(rect.top, 132);
    expect(rect.bottom, 654);
    expect(rect.height, 522);
  });
}
