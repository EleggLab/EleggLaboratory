enum AugmentRarity { common, rare, epic }

class AugmentData {
  const AugmentData({
    required this.id,
    required this.name,
    required this.description,
    required this.icon,
    this.rarity = AugmentRarity.common,
    this.shopOnly = false,
    this.stackMax = 1,
    this.effectId = '',
    this.tags = const <String>[],
  });

  final String id;
  final String name;
  final String description;
  final String icon;
  final AugmentRarity rarity;
  final bool shopOnly;
  final int stackMax;
  final String effectId;
  final List<String> tags;

  AugmentData copyWith({
    String? id,
    String? name,
    String? description,
    String? icon,
    AugmentRarity? rarity,
    bool? shopOnly,
    int? stackMax,
    String? effectId,
    List<String>? tags,
  }) {
    return AugmentData(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      icon: icon ?? this.icon,
      rarity: rarity ?? this.rarity,
      shopOnly: shopOnly ?? this.shopOnly,
      stackMax: stackMax ?? this.stackMax,
      effectId: effectId ?? this.effectId,
      tags: tags ?? this.tags,
    );
  }
}
