enum CosmeticCategory { background, blockSkin, ballTrail }

class AchievementCatalogItem {
  const AchievementCatalogItem({
    required this.id,
    required this.title,
    required this.description,
    this.rewardDiamonds = 3,
    this.unlockHint = '',
  });

  final String id;
  final String title;
  final String description;
  final int rewardDiamonds;
  final String unlockHint;
}

class CosmeticCatalogItem {
  const CosmeticCatalogItem({
    required this.id,
    required this.category,
    required this.name,
    required this.unlockAchievementId,
  });

  final String id;
  final CosmeticCategory category;
  final String name;
  final String? unlockAchievementId;
}

class MetaCatalog {
  static const String defaultBackgroundId = 'bg_default';
  static const String defaultBlockSkinId = 'block_default';
  static const String defaultBallTrailId = 'trail_default';

  static const List<AchievementCatalogItem> _defaultAchievements =
      <AchievementCatalogItem>[
        AchievementCatalogItem(
          id: 'ach_loop_10',
          title: 'Loop 10',
          description: 'Reach loop 10 in a run.',
          rewardDiamonds: 3,
          unlockHint: 'Reach loop 10 in any run.',
        ),
        AchievementCatalogItem(
          id: 'ach_loop_20',
          title: 'Loop 20',
          description: 'Reach loop 20 in a run.',
          rewardDiamonds: 4,
          unlockHint: 'Reach loop 20 in any run.',
        ),
        AchievementCatalogItem(
          id: 'ach_loop_50',
          title: 'Loop 50',
          description: 'Reach loop 50 in a run.',
          rewardDiamonds: 6,
          unlockHint: 'Reach loop 50 in any run.',
        ),
        AchievementCatalogItem(
          id: 'ach_boss_first',
          title: 'Boss Hunter',
          description: 'Defeat your first boss.',
          rewardDiamonds: 4,
          unlockHint: 'Defeat any boss once.',
        ),
        AchievementCatalogItem(
          id: 'ach_combo_30',
          title: 'Combo 30',
          description: 'Reach combo 30.',
          rewardDiamonds: 4,
          unlockHint: 'Hit combo 30 in one turn.',
        ),
        AchievementCatalogItem(
          id: 'ach_combo_60',
          title: 'Combo 60',
          description: 'Reach combo 60.',
          rewardDiamonds: 6,
          unlockHint: 'Hit combo 60 in one turn.',
        ),
        AchievementCatalogItem(
          id: 'ach_unlock_3_chars',
          title: 'Crew Up',
          description: 'Unlock 3 characters.',
          rewardDiamonds: 5,
          unlockHint: 'Unlock any 3 characters.',
        ),
        AchievementCatalogItem(
          id: 'ach_unlock_all_chars',
          title: 'Full Roster',
          description: 'Unlock all characters.',
          rewardDiamonds: 8,
          unlockHint: 'Unlock every character in codex.',
        ),
        AchievementCatalogItem(
          id: 'ach_buy_epic_shop',
          title: 'Luxury Buyer',
          description: 'Buy an Epic item in shop.',
          rewardDiamonds: 5,
          unlockHint: 'Purchase one Epic offer in shop.',
        ),
        AchievementCatalogItem(
          id: 'ach_daily_complete',
          title: 'Daily Challenger',
          description: 'Complete one Daily Run.',
          rewardDiamonds: 4,
          unlockHint: 'Finish one Daily run.',
        ),
        AchievementCatalogItem(
          id: 'ach_seed_copy',
          title: 'Seed Sharer',
          description: 'Copy a run seed.',
          rewardDiamonds: 3,
          unlockHint: 'Use the Copy Seed action once.',
        ),
        AchievementCatalogItem(
          id: 'ach_run_clear',
          title: 'Run Clear',
          description: 'Reach run clear condition.',
          rewardDiamonds: 10,
          unlockHint: 'Reach loop 100 or defeat 5 bosses in one run.',
        ),
      ];

  static const List<CosmeticCatalogItem> _defaultCosmetics =
      <CosmeticCatalogItem>[
        CosmeticCatalogItem(
          id: defaultBackgroundId,
          category: CosmeticCategory.background,
          name: 'Default Background',
          unlockAchievementId: null,
        ),
        CosmeticCatalogItem(
          id: 'bg_sunset',
          category: CosmeticCategory.background,
          name: 'Sunset',
          unlockAchievementId: 'ach_loop_20',
        ),
        CosmeticCatalogItem(
          id: 'bg_terminal',
          category: CosmeticCategory.background,
          name: 'Terminal',
          unlockAchievementId: 'ach_seed_copy',
        ),
        CosmeticCatalogItem(
          id: 'bg_royal',
          category: CosmeticCategory.background,
          name: 'Royal',
          unlockAchievementId: 'ach_buy_epic_shop',
        ),
        CosmeticCatalogItem(
          id: defaultBlockSkinId,
          category: CosmeticCategory.blockSkin,
          name: 'Default Block Skin',
          unlockAchievementId: null,
        ),
        CosmeticCatalogItem(
          id: 'block_metal',
          category: CosmeticCategory.blockSkin,
          name: 'Metal',
          unlockAchievementId: 'ach_boss_first',
        ),
        CosmeticCatalogItem(
          id: 'block_neon',
          category: CosmeticCategory.blockSkin,
          name: 'Neon',
          unlockAchievementId: 'ach_combo_60',
        ),
        CosmeticCatalogItem(
          id: 'block_pastel',
          category: CosmeticCategory.blockSkin,
          name: 'Pastel',
          unlockAchievementId: 'ach_daily_complete',
        ),
        CosmeticCatalogItem(
          id: defaultBallTrailId,
          category: CosmeticCategory.ballTrail,
          name: 'Default Trail',
          unlockAchievementId: null,
        ),
        CosmeticCatalogItem(
          id: 'trail_long',
          category: CosmeticCategory.ballTrail,
          name: 'Long Trail',
          unlockAchievementId: 'ach_loop_10',
        ),
        CosmeticCatalogItem(
          id: 'trail_dots',
          category: CosmeticCategory.ballTrail,
          name: 'Dot Trail',
          unlockAchievementId: 'ach_unlock_3_chars',
        ),
        CosmeticCatalogItem(
          id: 'trail_comet',
          category: CosmeticCategory.ballTrail,
          name: 'Comet Trail',
          unlockAchievementId: 'ach_run_clear',
        ),
      ];

  static List<AchievementCatalogItem> _achievements =
      List<AchievementCatalogItem>.from(_defaultAchievements);
  static List<CosmeticCatalogItem> _cosmetics = List<CosmeticCatalogItem>.from(
    _defaultCosmetics,
  );

  static List<AchievementCatalogItem> get achievements => _achievements;

  static List<CosmeticCatalogItem> get cosmetics => _cosmetics;

  static void applyAchievementDefinitions(List<AchievementCatalogItem> defs) {
    if (defs.isEmpty) {
      _achievements = List<AchievementCatalogItem>.from(_defaultAchievements);
      return;
    }
    final byId = <String, AchievementCatalogItem>{
      for (final entry in _defaultAchievements) entry.id: entry,
    };
    for (final entry in defs) {
      byId[entry.id] = entry;
    }
    _achievements = byId.values.toList();
  }

  static void applyCosmeticDefinitions(List<CosmeticCatalogItem> defs) {
    if (defs.isEmpty) {
      _cosmetics = List<CosmeticCatalogItem>.from(_defaultCosmetics);
      return;
    }
    final byId = <String, CosmeticCatalogItem>{
      for (final entry in _defaultCosmetics) entry.id: entry,
    };
    for (final entry in defs) {
      byId[entry.id] = entry;
    }
    _cosmetics = byId.values.toList();
  }

  static void resetRuntimeDefinitions() {
    _achievements = List<AchievementCatalogItem>.from(_defaultAchievements);
    _cosmetics = List<CosmeticCatalogItem>.from(_defaultCosmetics);
  }

  static List<CosmeticCatalogItem> cosmeticsByCategory(
    CosmeticCategory category,
  ) {
    return cosmetics.where((entry) => entry.category == category).toList();
  }

  static bool isKnownBackground(String id) {
    return cosmetics.any(
      (entry) =>
          entry.category == CosmeticCategory.background && entry.id == id,
    );
  }

  static bool isKnownBlockSkin(String id) {
    return cosmetics.any(
      (entry) => entry.category == CosmeticCategory.blockSkin && entry.id == id,
    );
  }

  static bool isKnownBallTrail(String id) {
    return cosmetics.any(
      (entry) => entry.category == CosmeticCategory.ballTrail && entry.id == id,
    );
  }
}

class RunAchievementInput {
  const RunAchievementInput({
    required this.mode,
    required this.maxLoop,
    required this.maxCombo,
    required this.bossesKilled,
    required this.clearAchieved,
    required this.purchasedEpicInShop,
    required this.unlockedCharacterCount,
    required this.totalCharacterCount,
    required this.seedCopied,
  });

  final String mode;
  final int maxLoop;
  final int maxCombo;
  final int bossesKilled;
  final bool clearAchieved;
  final bool purchasedEpicInShop;
  final int unlockedCharacterCount;
  final int totalCharacterCount;
  final bool seedCopied;
}
