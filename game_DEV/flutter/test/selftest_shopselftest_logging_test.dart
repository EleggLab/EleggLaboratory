import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/ui/screens/shop_selftest_rules.dart';

void main() {
  test('shop selftest fails when buy button is missing', () {
    final result = evaluateShopSelfTest(
      const ShopSelfTestInput(
        shopVisible: true,
        hasBuyButton: false,
        buyButtonLaidOut: false,
        overflowDetected: false,
      ),
    );
    expect(result.ok, isFalse);
    expect(result.reason, 'buy_button_missing');
  });

  test('shop selftest fails on layout overflow', () {
    final result = evaluateShopSelfTest(
      const ShopSelfTestInput(
        shopVisible: true,
        hasBuyButton: true,
        buyButtonLaidOut: true,
        overflowDetected: true,
      ),
    );
    expect(result.ok, isFalse);
    expect(result.reason, 'layout_overflow');
  });

  test('shop selftest passes when shop elements are laid out', () {
    final result = evaluateShopSelfTest(
      const ShopSelfTestInput(
        shopVisible: true,
        hasBuyButton: true,
        buyButtonLaidOut: true,
        overflowDetected: false,
        hasSellButton: true,
        sellButtonLaidOut: true,
      ),
    );
    expect(result.ok, isTrue);
    expect(result.reason, 'ok');
  });
}
