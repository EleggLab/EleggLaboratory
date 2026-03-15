import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/ui/screens/voucher_runtime.dart';

void main() {
  test('coupon voucher is consumed once per purchase', () {
    final state = const VoucherRuntimeState().addCoupon().addCoupon();
    final consumedOnce = state.consumeCoupon();
    final consumedTwice = consumedOnce.consumeCoupon();
    final consumedThird = consumedTwice.consumeCoupon();

    expect(state.coupon, 2);
    expect(consumedOnce.coupon, 1);
    expect(consumedTwice.coupon, 0);
    expect(consumedThird.coupon, 0);
  });

  test('free reroll and lock-all vouchers consume one stack each use', () {
    final state = const VoucherRuntimeState().addFreeReroll(2).addLockAll(1);

    final rerollUse1 = state.consumeFreeReroll();
    final rerollUse2 = rerollUse1.consumeFreeReroll();
    final lockUse = rerollUse2.consumeLockAll();

    expect(rerollUse1.freeReroll, 1);
    expect(rerollUse2.freeReroll, 0);
    expect(lockUse.lockAll, 0);
  });
}
