int calculateSalePrice({
  required int basePrice,
  required bool onSale,
  double saleRate = 0.30,
}) {
  final safeBase = basePrice < 1 ? 1 : basePrice;
  if (!onSale) {
    return safeBase;
  }
  final discounted = (safeBase * (1 - saleRate)).round();
  return discounted < 1 ? 1 : discounted;
}

int applyCouponDiscount({
  required int price,
  required bool couponActive,
  double couponRate = 0.50,
}) {
  final safe = price < 1 ? 1 : price;
  if (!couponActive) {
    return safe;
  }
  final discounted = (safe * (1 - couponRate)).round();
  return discounted < 1 ? 1 : discounted;
}
