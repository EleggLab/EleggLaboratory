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
  });

  final String id;
  final String name;
  final String description;
  final BossTier tier;
  final int width;
  final int height;
  final String icon;
}


