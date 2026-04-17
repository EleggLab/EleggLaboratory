import 'dart:math';

import 'package:flame/components.dart';
import 'package:flame_audio/flame_audio.dart';

import '../data/skills.dart';
import '../data/asset_catalog.dart';
import '../components/battle_arena.dart';
import '../components/unit_component.dart';

enum BattlePhase { preparation, combat, result }

enum BattleResult { ongoing, playerWin, playerLose }

class BattleSystem {
  BattleSystem(this.arena);

  final BattleArena arena;
  void Function()? onSkillCast;
  void Function(BattleResult result)? onBattleFinished;
  BattlePhase phase = BattlePhase.preparation;
  BattleResult _result = BattleResult.ongoing;
  double _phaseElapsed = 0;

  static const double preparationDuration = 30;
  static const double combatDuration = 60;
  static const double resultDuration = 5;
  static const double _rangeScale = 90;
  static const double _moveSpeed = 90;
  static const double _attackSfxInterval = 0.08;
  double _attackSfxCooldown = 0;

  BattleResult get result => _result;
  bool get isPreparationPhase => phase == BattlePhase.preparation;
  bool get isCombatPhase => phase == BattlePhase.combat;
  bool get isResultPhase => phase == BattlePhase.result;

  double get phaseRemaining {
    switch (phase) {
      case BattlePhase.preparation:
        return max(0, preparationDuration - _phaseElapsed);
      case BattlePhase.combat:
        return max(0, combatDuration - _phaseElapsed);
      case BattlePhase.result:
        return max(0, resultDuration - _phaseElapsed);
    }
  }

  void update(double dt) {
    switch (phase) {
      case BattlePhase.preparation:
        _phaseElapsed += dt;
        if (_phaseElapsed >= preparationDuration) {
          startCombatPhase();
        }
        return;
      case BattlePhase.combat:
        _updateCombat(dt);
        return;
      case BattlePhase.result:
        _phaseElapsed += dt;
        if (_phaseElapsed >= resultDuration) {
          _startPreparationPhase(resetArena: true);
        }
        return;
    }
  }

  void startCombatPhase() {
    if (!isPreparationPhase) {
      return;
    }
    phase = BattlePhase.combat;
    _phaseElapsed = 0;
    _result = BattleResult.ongoing;

    for (final UnitComponent unit in _allUnits) {
      unit.resetCombatState(
        initialSkillCooldown: getSkillCooldown(unit.data.skill),
      );
    }
  }

  void resetToPreparation({bool resetArena = true}) {
    _startPreparationPhase(resetArena: resetArena);
  }

  List<UnitComponent> get activeUnits => <UnitComponent>[
    ...arena.allyUnits.where((UnitComponent unit) => unit.isAlive),
    ...arena.enemyUnits.where((UnitComponent unit) => unit.isAlive),
  ];

  void _updateCombat(double dt) {
    _phaseElapsed += dt;
    _attackSfxCooldown = max(0, _attackSfxCooldown - dt);

    for (final UnitComponent unit in List<UnitComponent>.from(activeUnits)) {
      if (!unit.isAlive) {
        continue;
      }

      unit.attackCooldown -= dt;
      final UnitComponent? target = findNearestEnemy(unit);
      if (target != null) {
        if (isInRange(unit, target) && unit.attackCooldown <= 0) {
          executeAttack(unit, target);
          unit.attackCooldown = 1.0 / max(0.1, unit.data.attackSpeed);
        } else if (!isInRange(unit, target)) {
          moveToward(unit, target, dt);
        }
      }

      unit.skillCooldown -= dt;
      if (unit.skillCooldown <= 0 && hasSkillTarget(unit)) {
        executeSkill(unit);
        unit.skillCooldown = getSkillCooldown(unit.data.skill);
      }
    }

    arena.cleanupDefeated();

    final BattleResult endState = checkBattleEnd();
    if (endState != BattleResult.ongoing) {
      _startResultPhase(endState);
      return;
    }

    if (_phaseElapsed >= combatDuration) {
      _startResultPhase(BattleResult.playerLose);
    }
  }

  UnitComponent? findNearestEnemy(UnitComponent unit) {
    UnitComponent? best;
    double shortest = double.infinity;

    for (final UnitComponent candidate in _enemiesFor(unit)) {
      if (!candidate.isAlive) {
        continue;
      }
      final double distance = unit.position.distanceTo(candidate.position);
      if (distance < shortest) {
        shortest = distance;
        best = candidate;
      }
    }
    return best;
  }

  bool isInRange(UnitComponent attacker, UnitComponent target) {
    final double distance = attacker.position.distanceTo(target.position);
    return distance <= max(60, attacker.data.range * _rangeScale);
  }

  void moveToward(UnitComponent unit, UnitComponent target, double dt) {
    final Vector2 offset = target.position - unit.position;
    final double distance = offset.length;
    if (distance < 1) {
      return;
    }

    final double desiredDistance = max(20, unit.data.range * _rangeScale * 0.8);
    if (distance <= desiredDistance) {
      return;
    }

    offset.normalize();
    final double step = min(_moveSpeed * dt, distance - desiredDistance);
    unit.position += offset * step;
    unit.position.x = unit.position.x
        .clamp(unit.size.x / 2, arena.size.x - unit.size.x / 2)
        .toDouble();
    unit.position.y = unit.position.y
        .clamp(unit.size.y / 2, arena.size.y - unit.size.y / 2)
        .toDouble();
  }

  void executeAttack(UnitComponent attacker, UnitComponent target) {
    final int damage = calculateDamage(attacker, target);
    target.receiveDamage(damage.toDouble());
    _playAttackSfx(attacker);
  }

  int calculateDamage(UnitComponent attacker, UnitComponent defender) {
    final double baseDamage = attacker.attackPower;
    final double defense = defender.defensePower;
    final double reduction = defense / (defense + 100.0);
    final int finalDamage = (baseDamage * (1 - reduction)).round();
    return max(1, finalDamage);
  }

  BattleResult checkBattleEnd() {
    final int playerUnitsAlive = arena.allyUnits
        .where((UnitComponent unit) => unit.isAlive)
        .length;
    final int enemyUnitsAlive = arena.enemyUnits
        .where((UnitComponent unit) => unit.isAlive)
        .length;

    if (enemyUnitsAlive == 0) {
      return BattleResult.playerWin;
    }
    if (playerUnitsAlive == 0) {
      return BattleResult.playerLose;
    }
    return BattleResult.ongoing;
  }

  bool hasSkillTarget(UnitComponent unit) {
    final SkillData? skillData = skills[unit.data.skill];
    if (skillData == null) {
      return false;
    }

    if (skillData.healAmount != null && skillData.healAmount! > 0) {
      return _alliesFor(unit).any(
        (UnitComponent ally) => ally.isAlive && ally.currentHp < ally.maxHp,
      );
    }

    return findNearestEnemy(unit) != null;
  }

  void executeSkill(UnitComponent caster) {
    final SkillData? skillData = skills[caster.data.skill];
    if (skillData == null) {
      return;
    }
    onSkillCast?.call();

    if (skillData.healAmount != null && skillData.healAmount! > 0) {
      _executeHealSkill(caster, skillData);
      return;
    }
    _executeDamageSkill(caster, skillData);
  }

  double getSkillCooldown(String skillId) {
    return skills[skillId]?.cooldown ?? 6;
  }

  void _executeDamageSkill(UnitComponent caster, SkillData skillData) {
    final UnitComponent? primaryTarget = findNearestEnemy(caster);
    if (primaryTarget == null) {
      return;
    }

    final int damage = max(
      1,
      (caster.attackPower * (skillData.damage ?? 1.8)).round(),
    );

    if (skillData.type == 'aoe' && skillData.radius != null) {
      final double radius = skillData.radius! * _rangeScale;
      for (final UnitComponent target in _enemiesFor(caster)) {
        if (target.isAlive &&
            target.position.distanceTo(primaryTarget.position) <= radius) {
          target.receiveDamage(damage.toDouble());
        }
      }
      return;
    }

    if (skillData.type == 'multi_shot') {
      final List<UnitComponent> targets =
          _enemiesFor(
            caster,
          ).where((UnitComponent unit) => unit.isAlive).toList()..sort(
            (UnitComponent a, UnitComponent b) => caster.position
                .distanceTo(a.position)
                .compareTo(caster.position.distanceTo(b.position)),
          );

      for (final UnitComponent target in targets.take(2)) {
        target.receiveDamage(damage.toDouble());
      }
      return;
    }

    primaryTarget.receiveDamage(damage.toDouble());
  }

  void _executeHealSkill(UnitComponent caster, SkillData skillData) {
    final double healAmount = max(
      1,
      caster.maxHp * (skillData.healAmount ?? 0.2),
    );

    if (skillData.type == 'ally_aoe') {
      final double radius = (skillData.radius ?? 2.0) * _rangeScale;
      for (final UnitComponent ally in _alliesFor(caster)) {
        if (ally.isAlive &&
            ally.position.distanceTo(caster.position) <= radius) {
          ally.heal(healAmount);
        }
      }
      return;
    }

    UnitComponent? mostInjured;
    double mostMissingHp = 0;
    for (final UnitComponent ally in _alliesFor(caster)) {
      if (!ally.isAlive) {
        continue;
      }
      final double missing = ally.maxHp - ally.currentHp;
      if (missing > mostMissingHp) {
        mostMissingHp = missing;
        mostInjured = ally;
      }
    }
    mostInjured?.heal(healAmount);
  }

  Iterable<UnitComponent> get _allUnits sync* {
    yield* arena.allyUnits;
    yield* arena.enemyUnits;
  }

  Iterable<UnitComponent> _enemiesFor(UnitComponent unit) {
    return unit.isEnemy ? arena.allyUnits : arena.enemyUnits;
  }

  Iterable<UnitComponent> _alliesFor(UnitComponent unit) {
    return unit.isEnemy ? arena.enemyUnits : arena.allyUnits;
  }

  void _startResultPhase(BattleResult result) {
    _result = result;
    phase = BattlePhase.result;
    _phaseElapsed = 0;
    onBattleFinished?.call(result);
  }

  void _startPreparationPhase({required bool resetArena}) {
    if (resetArena) {
      arena.resetToInitialState();
    }
    _result = BattleResult.ongoing;
    phase = BattlePhase.preparation;
    _phaseElapsed = 0;
  }

  void _playAttackSfx(UnitComponent attacker) {
    if (_attackSfxCooldown > 0) {
      return;
    }
    _attackSfxCooldown = _attackSfxInterval;

    final String sfx = attacker.data.range <= 1.5
        ? AudioAssets.attackMelee
        : AudioAssets.attackRanged;
    _fireAndForgetSfx(sfx);
  }

  Future<void> _fireAndForgetSfx(String path) async {
    try {
      await FlameAudio.play(path);
    } catch (_) {
      // Combat audio is optional during scaffold stage.
    }
  }
}
