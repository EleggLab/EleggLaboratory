enum UnitRace { human, elf, orc, goblin }

extension UnitRaceX on UnitRace {
  String get key {
    switch (this) {
      case UnitRace.human:
        return 'human';
      case UnitRace.elf:
        return 'elf';
      case UnitRace.orc:
        return 'orc';
      case UnitRace.goblin:
        return 'goblin';
    }
  }

  String get label {
    switch (this) {
      case UnitRace.human:
        return '인간';
      case UnitRace.elf:
        return '엘프';
      case UnitRace.orc:
        return '오크';
      case UnitRace.goblin:
        return '고블린';
    }
  }
}

enum UnitJob { warrior, archer, knight, assassin, destroyer, brute }

extension UnitJobX on UnitJob {
  String get key {
    switch (this) {
      case UnitJob.warrior:
        return 'warrior';
      case UnitJob.archer:
        return 'archer';
      case UnitJob.knight:
        return 'knight';
      case UnitJob.assassin:
        return 'assassin';
      case UnitJob.destroyer:
        return 'destroyer';
      case UnitJob.brute:
        return 'brute';
    }
  }

  String get label {
    switch (this) {
      case UnitJob.warrior:
        return '전사';
      case UnitJob.archer:
        return '궁수';
      case UnitJob.knight:
        return '기사';
      case UnitJob.assassin:
        return '암살자';
      case UnitJob.destroyer:
        return '파괴자';
      case UnitJob.brute:
        return '난전';
    }
  }
}

class UnitDefinition {
  const UnitDefinition({
    required this.id,
    required this.name,
    required this.tier,
    required this.race,
    required this.job,
    required this.baseHealth,
    required this.baseAttack,
    required this.attackRange,
    required this.skillName,
    required this.skillDescription,
    required this.placeholderAsset,
    required this.maxMana,
    this.nextTierId,
    this.isEnemy = false,
  });

  final String id;
  final String name;
  final int tier;
  final UnitRace race;
  final UnitJob job;
  final int baseHealth;
  final int baseAttack;
  final int attackRange;
  final String skillName;
  final String skillDescription;
  final String placeholderAsset;
  final int maxMana;
  final String? nextTierId;
  final bool isEnemy;

  bool get isMelee => attackRange <= 1;
}

class EnemyWaveDefinition {
  const EnemyWaveDefinition({required this.wave, required this.enemies});

  final int wave;
  final Map<String, int> enemies;
}
