class ShopSelfTestInput {
  const ShopSelfTestInput({
    required this.shopVisible,
    required this.hasBuyButton,
    required this.buyButtonLaidOut,
    required this.overflowDetected,
    this.hasSellButton = false,
    this.sellButtonLaidOut = true,
  });

  final bool shopVisible;
  final bool hasBuyButton;
  final bool buyButtonLaidOut;
  final bool overflowDetected;
  final bool hasSellButton;
  final bool sellButtonLaidOut;
}

class ShopSelfTestResult {
  const ShopSelfTestResult._({required this.ok, required this.reason});

  final bool ok;
  final String reason;

  factory ShopSelfTestResult.ok() =>
      const ShopSelfTestResult._(ok: true, reason: 'ok');

  factory ShopSelfTestResult.fail(String reason) =>
      ShopSelfTestResult._(ok: false, reason: reason);
}

ShopSelfTestResult evaluateShopSelfTest(ShopSelfTestInput input) {
  if (!input.shopVisible) {
    return ShopSelfTestResult.fail('shop_not_visible');
  }
  if (input.overflowDetected) {
    return ShopSelfTestResult.fail('layout_overflow');
  }
  if (!input.hasBuyButton) {
    return ShopSelfTestResult.fail('buy_button_missing');
  }
  if (!input.buyButtonLaidOut) {
    return ShopSelfTestResult.fail('buy_button_not_laid_out');
  }
  if (input.hasSellButton && !input.sellButtonLaidOut) {
    return ShopSelfTestResult.fail('sell_button_not_laid_out');
  }
  return ShopSelfTestResult.ok();
}
