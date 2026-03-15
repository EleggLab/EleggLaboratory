class CharacterData {
  const CharacterData({
    required this.id,
    required this.name,
    required this.description,
    required this.skillManaCost,
    required this.icon,
  });

  final String id;
  final String name;
  final String description;
  final int skillManaCost;
  final String icon;
}
