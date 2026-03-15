import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/data/catalog_data.dart';
import 'package:gamedev/models/augment_data.dart';
import 'package:gamedev/models/game_options.dart';
import 'package:gamedev/ui/tabs/codex_hint_rules.dart';

void main() {
  test('codex lock hints expose meaningful unlock guidance', () {
    final bossHintKo = codexBossLockHint(
      boss: GameCatalog.bosses.first,
      language: UiLanguage.ko,
    );
    expect(bossHintKo, contains('猷⑦봽 20'));

    final shopOnlyAugment = GameCatalog.augments.firstWhere(
      (a) => a.shopOnly,
      orElse: () => const AugmentData(
        id: 'shop_only',
        name: 'ShopOnly',
        description: '',
        icon: 'S',
        shopOnly: true,
      ),
    );
    final shopHintKo = codexAugmentLockHint(
      augment: shopOnlyAugment,
      language: UiLanguage.ko,
    );
    expect(shopHintKo, contains('?곸젏'));

    final normalAugment = GameCatalog.augments.firstWhere(
      (a) => !a.shopOnly,
      orElse: () => const AugmentData(
        id: 'normal',
        name: 'Normal',
        description: '',
        icon: 'N',
      ),
    );
    final normalHintKo = codexAugmentLockHint(
      augment: normalAugment,
      language: UiLanguage.ko,
    );
    expect(normalHintKo, contains('利앷컯'));
  });
}

