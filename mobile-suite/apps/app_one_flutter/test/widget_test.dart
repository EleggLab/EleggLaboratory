import 'package:app_one_flutter/core/idle_core.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('tap and generator purchase flow works', () {
    final s = createStarterCore();
    expect(s.currency, 0);

    s.tap();
    expect(s.currency, 1);

    for (var i = 0; i < 20; i++) {
      s.tap();
    }

    final bought = s.buyGenerator(0);
    expect(bought, isTrue);
    expect(s.generators[0].count, 1);
    expect(s.totalIncomePerSec > 0, isTrue);
  });
}
