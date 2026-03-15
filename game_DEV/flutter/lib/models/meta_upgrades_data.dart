import 'package:flutter/foundation.dart';

enum MetaUpgradeType { startGold, rerollDiscount, extraShopSlot }

@immutable
class MetaUpgradesData {
  const MetaUpgradesData({
    required this.startGoldLevel,
    required this.rerollDiscountLevel,
    required this.extraShopSlotLevel,
  });

  final int startGoldLevel;
  final int rerollDiscountLevel;
  final int extraShopSlotLevel;

  static const MetaUpgradesData defaults = MetaUpgradesData(
    startGoldLevel: 0,
    rerollDiscountLevel: 0,
    extraShopSlotLevel: 0,
  );

  int get startGoldBonus => startGoldLevel * 3;

  int get rerollDiscount => rerollDiscountLevel;

  int get extraShopSlots => extraShopSlotLevel;

  int levelFor(MetaUpgradeType type) {
    switch (type) {
      case MetaUpgradeType.startGold:
        return startGoldLevel;
      case MetaUpgradeType.rerollDiscount:
        return rerollDiscountLevel;
      case MetaUpgradeType.extraShopSlot:
        return extraShopSlotLevel;
    }
  }

  int maxLevelFor(MetaUpgradeType type) {
    switch (type) {
      case MetaUpgradeType.startGold:
        return 10;
      case MetaUpgradeType.rerollDiscount:
        return 3;
      case MetaUpgradeType.extraShopSlot:
        return 4;
    }
  }

  int nextCostFor(MetaUpgradeType type) {
    final current = levelFor(type);
    switch (type) {
      case MetaUpgradeType.startGold:
        return 5 + (current * 4);
      case MetaUpgradeType.rerollDiscount:
        return 12 + (current * 10);
      case MetaUpgradeType.extraShopSlot:
        return 10 + (current * 8);
    }
  }

  bool isMaxLevel(MetaUpgradeType type) {
    return levelFor(type) >= maxLevelFor(type);
  }

  MetaUpgradesData upgrade(MetaUpgradeType type) {
    if (isMaxLevel(type)) {
      return this;
    }
    switch (type) {
      case MetaUpgradeType.startGold:
        return copyWith(startGoldLevel: startGoldLevel + 1);
      case MetaUpgradeType.rerollDiscount:
        return copyWith(rerollDiscountLevel: rerollDiscountLevel + 1);
      case MetaUpgradeType.extraShopSlot:
        return copyWith(extraShopSlotLevel: extraShopSlotLevel + 1);
    }
  }

  MetaUpgradesData copyWith({
    int? startGoldLevel,
    int? rerollDiscountLevel,
    int? extraShopSlotLevel,
  }) {
    return MetaUpgradesData(
      startGoldLevel: startGoldLevel ?? this.startGoldLevel,
      rerollDiscountLevel: rerollDiscountLevel ?? this.rerollDiscountLevel,
      extraShopSlotLevel: extraShopSlotLevel ?? this.extraShopSlotLevel,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'startGoldLevel': startGoldLevel,
      'rerollDiscountLevel': rerollDiscountLevel,
      'extraShopSlotLevel': extraShopSlotLevel,
    };
  }

  factory MetaUpgradesData.fromJson(Map<String, dynamic> json) {
    return MetaUpgradesData(
      startGoldLevel: (json['startGoldLevel'] as int?) ?? 0,
      rerollDiscountLevel: (json['rerollDiscountLevel'] as int?) ?? 0,
      extraShopSlotLevel: (json['extraShopSlotLevel'] as int?) ?? 0,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) {
      return true;
    }
    return other is MetaUpgradesData &&
        other.startGoldLevel == startGoldLevel &&
        other.rerollDiscountLevel == rerollDiscountLevel &&
        other.extraShopSlotLevel == extraShopSlotLevel;
  }

  @override
  int get hashCode =>
      Object.hash(startGoldLevel, rerollDiscountLevel, extraShopSlotLevel);
}
