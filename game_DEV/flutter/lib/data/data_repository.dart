import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

import '../models/augment_data.dart';
import '../models/boss_data.dart';
import '../models/shop_data.dart';
import '../models/weekly_league_data.dart';
import 'catalog_data.dart';
import 'league_catalog.dart';
import 'meta_catalog.dart';

class DataLoadSnapshot {
  const DataLoadSnapshot({
    required this.augments,
    required this.bosses,
    required this.relics,
    required this.achievements,
    required this.cosmetics,
    required this.leagueRules,
  });

  final List<AugmentData> augments;
  final List<BossCodexData> bosses;
  final List<RelicDefinitionData> relics;
  final List<AchievementCatalogItem> achievements;
  final List<CosmeticCatalogItem> cosmetics;
  final List<LeagueTierRule> leagueRules;
}

class DataRepository {
  DataRepository._();

  static final DataRepository instance = DataRepository._();
  bool _loaded = false;

  Future<void> loadAndApply({AssetBundle? bundle}) async {
    if (_loaded && bundle == null) {
      return;
    }
    final source = bundle ?? rootBundle;
    final snapshot = await loadSnapshot(bundle: source);
    GameCatalog.applyAugmentDefinitions(snapshot.augments);
    GameCatalog.applyBossDefinitions(snapshot.bosses);
    ShopCatalog.applyRelicDefinitions(snapshot.relics);
    ShopCatalog.refreshAugmentBackedItems();
    MetaCatalog.applyAchievementDefinitions(snapshot.achievements);
    MetaCatalog.applyCosmeticDefinitions(snapshot.cosmetics);
    LeagueCatalog.applyRules(snapshot.leagueRules);
    if (bundle == null) {
      _loaded = true;
    }
  }

  Future<DataLoadSnapshot> loadSnapshot({AssetBundle? bundle}) async {
    final source = bundle ?? rootBundle;
    final augments = await _loadAugments(source);
    final bosses = await _loadBosses(source);
    final relics = await _loadRelics(source);
    final achievements = await _loadAchievements(source);
    final cosmetics = await _loadCosmetics(source);
    final leagueRules = await _loadLeagueRules(source);
    return DataLoadSnapshot(
      augments: augments,
      bosses: bosses,
      relics: relics,
      achievements: achievements,
      cosmetics: cosmetics,
      leagueRules: leagueRules,
    );
  }

  Future<List<AugmentData>> _loadAugments(AssetBundle bundle) async {
    final parsed = await _loadJsonList(
      bundle: bundle,
      assetPath: 'assets/data/augments.json',
    );
    final result = <AugmentData>[];
    for (final entry in parsed) {
      final id = entry['id']?.toString() ?? '';
      if (id.isEmpty) {
        continue;
      }
      result.add(
        AugmentData(
          id: id,
          effectId: entry['effectId']?.toString() ?? id,
          name: entry['name']?.toString() ?? id,
          description: entry['description']?.toString() ?? '',
          icon: entry['icon']?.toString() ?? 'A',
          rarity: _parseAugmentRarity(entry['rarity']?.toString()),
          shopOnly: entry['shopOnly'] == true,
          stackMax: (entry['stackMax'] as num?)?.toInt() ?? 1,
          tags: (entry['tags'] is List)
              ? (entry['tags'] as List)
                    .map((value) => value.toString())
                    .where((value) => value.trim().isNotEmpty)
                    .toList()
              : const <String>[],
        ),
      );
    }
    return result;
  }

  Future<List<BossCodexData>> _loadBosses(AssetBundle bundle) async {
    final parsed = await _loadJsonList(
      bundle: bundle,
      assetPath: 'assets/data/bosses.json',
    );
    final result = <BossCodexData>[];
    for (final entry in parsed) {
      final id = entry['id']?.toString() ?? '';
      if (id.isEmpty) {
        continue;
      }
      result.add(
        BossCodexData(
          id: id,
          name: entry['name']?.toString() ?? id,
          description: entry['description']?.toString() ?? '',
          tier: _parseBossTier(entry['tier']?.toString()),
          width: (entry['width'] as num?)?.toInt() ?? 2,
          height: (entry['height'] as num?)?.toInt() ?? 2,
          icon: entry['icon']?.toString() ?? 'B',
          themeColorHex: entry['themeColor']?.toString() ?? '#7E57C2',
          introText: entry['introText']?.toString() ?? '',
          optionalAbilityType: entry['optionalAbilityType']?.toString() ?? '',
        ),
      );
    }
    return result;
  }

  Future<List<RelicDefinitionData>> _loadRelics(AssetBundle bundle) async {
    final parsed = await _loadJsonList(
      bundle: bundle,
      assetPath: 'assets/data/relics.json',
    );
    final result = <RelicDefinitionData>[];
    for (final entry in parsed) {
      final id = entry['id']?.toString() ?? '';
      if (id.isEmpty) {
        continue;
      }
      result.add(
        RelicDefinitionData(
          id: id,
          name: entry['name']?.toString() ?? id,
          description: entry['description']?.toString() ?? '',
          rarity: _parseShopRarity(entry['rarity']?.toString()),
          shopOnly: entry['shopOnly'] != false,
          price: (entry['price'] as num?)?.toInt(),
        ),
      );
    }
    return result;
  }

  Future<List<AchievementCatalogItem>> _loadAchievements(
    AssetBundle bundle,
  ) async {
    final parsed = await _loadJsonList(
      bundle: bundle,
      assetPath: 'assets/data/achievements.json',
    );
    final result = <AchievementCatalogItem>[];
    for (final entry in parsed) {
      final id = entry['id']?.toString() ?? '';
      if (id.isEmpty) {
        continue;
      }
      result.add(
        AchievementCatalogItem(
          id: id,
          title: entry['title']?.toString() ?? id,
          description: entry['description']?.toString() ?? '',
          rewardDiamonds: (entry['rewardDiamonds'] as num?)?.toInt() ?? 3,
          unlockHint: entry['unlockHint']?.toString() ?? '',
        ),
      );
    }
    return result;
  }

  Future<List<CosmeticCatalogItem>> _loadCosmetics(AssetBundle bundle) async {
    final parsed = await _loadJsonList(
      bundle: bundle,
      assetPath: 'assets/data/cosmetics.json',
    );
    final result = <CosmeticCatalogItem>[];
    for (final entry in parsed) {
      final id = entry['id']?.toString() ?? '';
      if (id.isEmpty) {
        continue;
      }
      result.add(
        CosmeticCatalogItem(
          id: id,
          category: _parseCosmeticCategory(entry['category']?.toString()),
          name: entry['name']?.toString() ?? id,
          unlockAchievementId: entry['unlockAchievementId']?.toString(),
        ),
      );
    }
    return result;
  }

  Future<List<LeagueTierRule>> _loadLeagueRules(AssetBundle bundle) async {
    final parsed = await _loadJsonList(
      bundle: bundle,
      assetPath: 'assets/data/league_tiers.json',
    );
    final result = <LeagueTierRule>[];
    for (final entry in parsed) {
      result.add(LeagueTierRule.fromJson(entry));
    }
    return result;
  }

  Future<List<Map<String, dynamic>>> _loadJsonList({
    required AssetBundle bundle,
    required String assetPath,
  }) async {
    try {
      final raw = await bundle.loadString(assetPath);
      final decoded = jsonDecode(raw);
      if (decoded is List) {
        return decoded
            .whereType<Map>()
            .map((entry) => Map<String, dynamic>.from(entry))
            .toList();
      }
    } catch (error) {
      debugPrint('DataRepository fallback for $assetPath: $error');
    }
    return const <Map<String, dynamic>>[];
  }

  AugmentRarity _parseAugmentRarity(String? raw) {
    switch (raw) {
      case 'rare':
        return AugmentRarity.rare;
      case 'epic':
        return AugmentRarity.epic;
      case 'common':
      default:
        return AugmentRarity.common;
    }
  }

  ShopRarity _parseShopRarity(String? raw) {
    switch (raw) {
      case 'rare':
        return ShopRarity.rare;
      case 'epic':
        return ShopRarity.epic;
      case 'common':
      default:
        return ShopRarity.common;
    }
  }

  CosmeticCategory _parseCosmeticCategory(String? raw) {
    switch (raw) {
      case 'blockSkin':
        return CosmeticCategory.blockSkin;
      case 'ballTrail':
        return CosmeticCategory.ballTrail;
      case 'background':
      default:
        return CosmeticCategory.background;
    }
  }

  BossTier _parseBossTier(String? raw) {
    switch (raw) {
      case 'weak':
        return BossTier.weak;
      case 'strong':
        return BossTier.strong;
      case 'medium':
      default:
        return BossTier.medium;
    }
  }
}
