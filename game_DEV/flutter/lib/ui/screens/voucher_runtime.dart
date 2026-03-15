class VoucherRuntimeState {
  const VoucherRuntimeState({
    this.coupon = 0,
    this.freeReroll = 0,
    this.lockAll = 0,
  });

  final int coupon;
  final int freeReroll;
  final int lockAll;

  bool get hasCoupon => coupon > 0;

  bool get hasFreeReroll => freeReroll > 0;

  bool get hasLockAll => lockAll > 0;

  VoucherRuntimeState addCoupon([int amount = 1]) {
    return VoucherRuntimeState(
      coupon: coupon + amount,
      freeReroll: freeReroll,
      lockAll: lockAll,
    );
  }

  VoucherRuntimeState addFreeReroll([int amount = 1]) {
    return VoucherRuntimeState(
      coupon: coupon,
      freeReroll: freeReroll + amount,
      lockAll: lockAll,
    );
  }

  VoucherRuntimeState addLockAll([int amount = 1]) {
    return VoucherRuntimeState(
      coupon: coupon,
      freeReroll: freeReroll,
      lockAll: lockAll + amount,
    );
  }

  VoucherRuntimeState consumeCoupon() {
    return VoucherRuntimeState(
      coupon: coupon > 0 ? coupon - 1 : 0,
      freeReroll: freeReroll,
      lockAll: lockAll,
    );
  }

  VoucherRuntimeState consumeFreeReroll() {
    return VoucherRuntimeState(
      coupon: coupon,
      freeReroll: freeReroll > 0 ? freeReroll - 1 : 0,
      lockAll: lockAll,
    );
  }

  VoucherRuntimeState consumeLockAll() {
    return VoucherRuntimeState(
      coupon: coupon,
      freeReroll: freeReroll,
      lockAll: lockAll > 0 ? lockAll - 1 : 0,
    );
  }
}
