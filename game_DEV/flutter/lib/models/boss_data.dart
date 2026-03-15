enum BossTier { weak, medium, strong }

class BossCodexData {
  const BossCodexData({
    required this.id,
    required this.name,
    required this.description,
    required this.tier,
    required this.width,
    required this.height,
    required this.icon,
    this.themeColorHex = '#7E57C2',
    this.introText = '',
    this.optionalAbilityType = '',
  });

  final String id;
  final String name;
  final String description;
  final BossTier tier;
  final int width;
  final int height;
  final String icon;
  final String themeColorHex;
  final String introText;
  final String optionalAbilityType;

  BossCodexData copyWith({
    String? id,
    String? name,
    String? description,
    BossTier? tier,
    int? width,
    int? height,
    String? icon,
    String? themeColorHex,
    String? introText,
    String? optionalAbilityType,
  }) {
    return BossCodexData(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      tier: tier ?? this.tier,
      width: width ?? this.width,
      height: height ?? this.height,
      icon: icon ?? this.icon,
      themeColorHex: themeColorHex ?? this.themeColorHex,
      introText: introText ?? this.introText,
      optionalAbilityType: optionalAbilityType ?? this.optionalAbilityType,
    );
  }
}
