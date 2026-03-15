import '../data/catalog_data.dart';
import 'augment_data.dart';

enum ShopRarity { common, rare, epic }

enum ShopItemKind { augment, relic }

class RelicDefinitionData {
  const RelicDefinitionData({
    required this.id,
    required this.name,
    required this.description,
    required this.rarity,
    this.shopOnly = true,
    this.price,
  });

  final String id;
  final String name;
  final String description;
  final ShopRarity rarity;
  final bool shopOnly;
  final int? price;
}

class ShopItemData {
  const ShopItemData({
    required this.id,
    required this.kind,
    required this.rarity,
    required this.name,
    required this.description,
    required this.price,
    this.augmentId,
    this.relicId,
    this.stackable = false,
    this.maxStacks = 1,
  });

  final String id;
  final ShopItemKind kind;
  final ShopRarity rarity;
  final String name;
  final String description;
  final int price;
  final String? augmentId;
  final String? relicId;
  final bool stackable;
  final int maxStacks;

  bool get isAugment => kind == ShopItemKind.augment;

  bool get isRelic => kind == ShopItemKind.relic;

  String get runtimeId => isAugment ? (augmentId ?? '') : (relicId ?? '');

  int get sellPrice => (price * 0.5).floor();
}

class ShopCatalog {
  static const int baseRerollCost = 2;

  static const List<RelicDefinitionData> _defaultRelics = <RelicDefinitionData>[
    RelicDefinitionData(
      id: 'relic_magnet',
      rarity: ShopRarity.rare,
      name: 'Relic: Magnet',
      description: 'Spawns +1 extra Ball+1 pickup each turn.',
    ),
    RelicDefinitionData(
      id: 'relic_polish',
      rarity: ShopRarity.common,
      name: 'Relic: Polish',
      description: 'Ball speed +10%.',
    ),
    RelicDefinitionData(
      id: 'relic_shield',
      rarity: ShopRarity.epic,
      name: 'Relic: Shield',
      description: 'Mitigates deadzone penalty by 1.',
    ),
    RelicDefinitionData(
      id: 'relic_alchemy',
      rarity: ShopRarity.rare,
      name: 'Relic: Alchemy',
      description: 'Bomb explosions grant extra gold.',
    ),
    RelicDefinitionData(
      id: 'relic_focus',
      rarity: ShopRarity.common,
      name: 'Relic: Focus',
      description: 'Aim prediction line extends farther.',
    ),
  ];

  static List<RelicDefinitionData> _relicDefinitions =
      List<RelicDefinitionData>.from(_defaultRelics);
  static List<ShopItemData> _items = _buildItems(
    augments: GameCatalog.augments,
    relics: _defaultRelics,
  );

  static List<RelicDefinitionData> get relicDefinitions => _relicDefinitions;

  static List<ShopItemData> get items => _items;

  static void applyRelicDefinitions(List<RelicDefinitionData> definitions) {
    if (definitions.isEmpty) {
      _relicDefinitions = List<RelicDefinitionData>.from(_defaultRelics);
    } else {
      final byId = <String, RelicDefinitionData>{
        for (final item in _defaultRelics) item.id: item,
      };
      for (final item in definitions) {
        byId[item.id] = item;
      }
      _relicDefinitions = byId.values.toList();
    }
    _items = _buildItems(
      augments: GameCatalog.augments,
      relics: _relicDefinitions,
    );
  }

  static void refreshAugmentBackedItems() {
    _items = _buildItems(
      augments: GameCatalog.augments,
      relics: _relicDefinitions,
    );
  }

  static void resetRuntimeDefinitions() {
    _relicDefinitions = List<RelicDefinitionData>.from(_defaultRelics);
    _items = _buildItems(
      augments: GameCatalog.augments,
      relics: _relicDefinitions,
    );
  }

  static ShopItemData? byId(String id) {
    for (final item in items) {
      if (item.id == id) {
        return item;
      }
    }
    return null;
  }

  static List<ShopItemData> _buildItems({
    required List<AugmentData> augments,
    required List<RelicDefinitionData> relics,
  }) {
    final result = <ShopItemData>[];

    for (final augment in augments) {
      final rarity = _mapAugmentRarity(augment.rarity);
      result.add(
        ShopItemData(
          id: 'shop_${augment.id}',
          kind: ShopItemKind.augment,
          rarity: rarity,
          name: augment.name,
          description: augment.description,
          price: _priceForRarity(rarity),
          augmentId: augment.id,
          stackable: augment.stackMax > 1,
          maxStacks: augment.stackMax,
        ),
      );
    }

    for (final relic in relics) {
      result.add(
        ShopItemData(
          id: relic.id,
          kind: ShopItemKind.relic,
          rarity: relic.rarity,
          name: relic.name,
          description: relic.description,
          price: relic.price ?? _priceForRarity(relic.rarity),
          relicId: relic.id,
          stackable: false,
          maxStacks: 1,
        ),
      );
    }
    return result;
  }

  static ShopRarity _mapAugmentRarity(AugmentRarity rarity) {
    switch (rarity) {
      case AugmentRarity.common:
        return ShopRarity.common;
      case AugmentRarity.rare:
        return ShopRarity.rare;
      case AugmentRarity.epic:
        return ShopRarity.epic;
    }
  }

  static int _priceForRarity(ShopRarity rarity) {
    switch (rarity) {
      case ShopRarity.common:
        return 5;
      case ShopRarity.rare:
        return 10;
      case ShopRarity.epic:
        return 18;
    }
  }
}
