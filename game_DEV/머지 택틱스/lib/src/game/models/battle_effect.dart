enum CellEffectType { summon, merge, meleeTrail, rangedTrail, hitFlash }

class CellEffect {
  const CellEffect({
    required this.id,
    required this.cellIndex,
    required this.type,
    required this.createdAt,
    required this.duration,
  });

  final int id;
  final int cellIndex;
  final CellEffectType type;
  final DateTime createdAt;
  final Duration duration;
}

class DamagePopup {
  const DamagePopup({
    required this.id,
    required this.cellIndex,
    required this.text,
    required this.critical,
    required this.createdAt,
    required this.duration,
  });

  final int id;
  final int cellIndex;
  final String text;
  final bool critical;
  final DateTime createdAt;
  final Duration duration;
}
