import '../../models/augment_data.dart';
import '../../models/boss_data.dart';
import '../../models/game_options.dart';

String codexBossLockHint({
  required BossCodexData boss,
  required UiLanguage language,
}) {
  if (language == UiLanguage.ko) {
    final tierLabel = switch (boss.tier) {
      BossTier.weak => '약함',
      BossTier.medium => '중간',
      BossTier.strong => '강함',
    };
    return '루프 20 배수 구간에서 $tierLabel 보스를 만나면 잠금이 해제됩니다.';
  }
  return 'Unlocked when encountered as a ${boss.tier.name} boss on 20-loop intervals.';
}

String codexAugmentLockHint({
  required AugmentData augment,
  required UiLanguage language,
}) {
  if (augment.shopOnly) {
    return language == UiLanguage.ko
        ? '상점 전용 증강입니다. 런 도중 상점에서 구매하면 잠금이 해제됩니다.'
        : 'Shop-only augment. Discover it by purchasing from the shop.';
  }
  return language == UiLanguage.ko
      ? '런 진행 중 증강 선택 또는 상점에서 획득하면 잠금이 해제됩니다.'
      : 'Discover it from augment picks or shop during a run.';
}
