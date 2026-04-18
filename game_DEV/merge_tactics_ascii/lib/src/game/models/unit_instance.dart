class UnitInstance {
  const UnitInstance({
    required this.instanceId,
    required this.definitionId,
    required this.cellIndex,
    required this.currentHealth,
    required this.mana,
    required this.isEnemy,
    this.shieldTicks = 0,
    this.stealthTicks = 0,
    this.stunTicks = 0,
    this.guaranteedCritical = false,
  });

  final int instanceId;
  final String definitionId;
  final int cellIndex;
  final int currentHealth;
  final int mana;
  final bool isEnemy;
  final int shieldTicks;
  final int stealthTicks;
  final int stunTicks;
  final bool guaranteedCritical;

  UnitInstance copyWith({
    int? cellIndex,
    int? currentHealth,
    int? mana,
    int? shieldTicks,
    int? stealthTicks,
    int? stunTicks,
    bool? guaranteedCritical,
  }) {
    return UnitInstance(
      instanceId: instanceId,
      definitionId: definitionId,
      cellIndex: cellIndex ?? this.cellIndex,
      currentHealth: currentHealth ?? this.currentHealth,
      mana: mana ?? this.mana,
      isEnemy: isEnemy,
      shieldTicks: shieldTicks ?? this.shieldTicks,
      stealthTicks: stealthTicks ?? this.stealthTicks,
      stunTicks: stunTicks ?? this.stunTicks,
      guaranteedCritical: guaranteedCritical ?? this.guaranteedCritical,
    );
  }
}
