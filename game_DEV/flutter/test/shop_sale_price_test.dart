import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/ui/screens/shop_pricing.dart';

void main() {
  test('sale price applies 30 percent discount with floor of 1', () {
    expect(calculateSalePrice(basePrice: 10, onSale: true), 7);
    expect(calculateSalePrice(basePrice: 1, onSale: true), 1);
    expect(calculateSalePrice(basePrice: 0, onSale: true), 1);
  });

  test('coupon discount applies after price resolution with floor of 1', () {
    expect(applyCouponDiscount(price: 7, couponActive: true), 4);
    expect(applyCouponDiscount(price: 1, couponActive: true), 1);
    expect(applyCouponDiscount(price: 8, couponActive: false), 8);
  });
}
