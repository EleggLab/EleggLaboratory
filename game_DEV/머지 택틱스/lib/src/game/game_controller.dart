import 'dart:math';

import 'package:flutter/foundation.dart';

import '../app/player_profile.dart';
import '../audio/sfx_service.dart';
import '../resources/resource_map.dart';
import 'data/game_data.dart';
import 'models/battle_effect.dart';
import 'models/synergy_rule.dart';
import 'models/unit_definition.dart';
import 'models/unit_instance.dart';

class GameController extends ChangeNotifier {
  GameController({required this.profile});

  static const int boardColumns = 5;
  static const int boardRows = 6;
  static const int boardCellCount = boardColumns * boardRows;
  static const int summonCost = 10;
  static const int roundIncome = 10;

  final PlayerProfile profile;
  final Random _random = Random();

  final List<UnitInstance> _allies = <UnitInstance>[];
  final List<UnitInstance> _enemies = <UnitInstance>[];
  List<ActiveSynergy> _activeSynergies = <ActiveSynergy>[];

  final List<CellEffect> _cellEffects = <CellEffect>[];
  final List<DamagePopup> _damagePopups = <DamagePopup>[];

  int _nextInstanceId = 1;
  int _nextEffectId = 1;

  bool isCombatPhase = false;
  bool isDefeated = false;
  bool criticalOverlayVisible = false;
  int wave = 1;
  String statusMessage = '유닛을 소환하고 머지하여 전투를 준비하세요.';

  List<UnitInstance> get allies => List<UnitInstance>.unmodifiable(_allies);
  List<UnitInstance> get enemies => List<UnitInstance>.unmodifiable(_enemies);
  List<ActiveSynergy> get activeSynergies =>
      List<ActiveSynergy>.unmodifiable(_activeSynergies);
  List<CellEffect> get cellEffects =>
      List<CellEffect>.unmodifiable(_cellEffects);
  List<DamagePopup> get damagePopups =>
      List<DamagePopup>.unmodifiable(_damagePopups);

  bool get canInteract => !isCombatPhase && !isDefeated;

  UnitDefinition definitionOf(String definitionId) {
    return unitCatalog[definitionId]!;
  }

  UnitInstance? allyAt(int cellIndex) {
    for (final UnitInstance unit in _allies) {
      if (unit.cellIndex == cellIndex) {
        return unit;
      }
    }
    return null;
  }

  Map<String, int> get enemySummaryByName {
    final Map<String, int> summary = <String, int>{};
    for (final UnitInstance enemy in _enemies) {
      final String name = definitionOf(enemy.definitionId).name;
      summary[name] = (summary[name] ?? 0) + 1;
    }
    return summary;
  }

  void summonRandomTier1Unit() {
    if (!canInteract) {
      _setStatus('전투 중에는 소환할 수 없습니다.');
      return;
    }
    if (!profile.spendGold(summonCost)) {
      _setStatus('골드가 부족합니다.');
      return;
    }

    final List<int> emptyCells = _emptyCells();
    if (emptyCells.isEmpty) {
      profile.addGold(summonCost);
      _setStatus('전장이 가득 찼습니다. 머지를 먼저 시도하세요.');
      return;
    }

    final String unitId =
        summonableTier1UnitIds[_random.nextInt(summonableTier1UnitIds.length)];
    final UnitDefinition definition = definitionOf(unitId);
    final int selectedCell = emptyCells[_random.nextInt(emptyCells.length)];

    _allies.add(
      UnitInstance(
        instanceId: _nextInstanceId++,
        definitionId: unitId,
        cellIndex: selectedCell,
        currentHealth: definition.baseHealth,
        mana: 0,
        isEnemy: false,
      ),
    );
    profile.unlockUnit(unitId);
    _emitCellEffect(
      selectedCell,
      CellEffectType.summon,
      const Duration(milliseconds: 300),
    );
    SfxService.instance.play(ResourceMap.audioPowerup, volume: 0.75);
    _refreshSynergies();
    _setStatus('${definition.name} 소환 완료');
  }

  bool tryMergeUnits(int sourceInstanceId, int targetInstanceId) {
    if (!canInteract) {
      _setStatus('전투 중에는 머지할 수 없습니다.');
      return false;
    }
    if (sourceInstanceId == targetInstanceId) {
      return false;
    }

    final UnitInstance? source = _findById(_allies, sourceInstanceId);
    final UnitInstance? target = _findById(_allies, targetInstanceId);
    if (source == null || target == null) {
      return false;
    }
    if (source.definitionId != target.definitionId) {
      _setStatus('같은 유닛 3개를 모아야 머지할 수 있습니다.');
      return false;
    }

    final List<UnitInstance> sameUnits = _allies
        .where((UnitInstance unit) => unit.definitionId == source.definitionId)
        .toList();
    if (sameUnits.length < 3) {
      _setStatus('${definitionOf(source.definitionId).name} 3개가 필요합니다.');
      return false;
    }

    final UnitDefinition baseDefinition = definitionOf(source.definitionId);
    final String? nextTierId = baseDefinition.nextTierId;
    if (nextTierId == null) {
      _setStatus('이미 최고 티어 유닛입니다.');
      return false;
    }

    final List<UnitInstance> mergeTargets = <UnitInstance>[source, target];
    for (final UnitInstance candidate in sameUnits) {
      if (mergeTargets.length >= 3) {
        break;
      }
      if (candidate.instanceId == source.instanceId ||
          candidate.instanceId == target.instanceId) {
        continue;
      }
      mergeTargets.add(candidate);
    }
    if (mergeTargets.length < 3) {
      _setStatus('머지 대상 3개를 찾지 못했습니다.');
      return false;
    }

    final Set<int> consumedIds = mergeTargets
        .map((UnitInstance unit) => unit.instanceId)
        .toSet();
    _allies.removeWhere(
      (UnitInstance unit) => consumedIds.contains(unit.instanceId),
    );

    final UnitDefinition mergedDefinition = definitionOf(nextTierId);
    _allies.add(
      UnitInstance(
        instanceId: _nextInstanceId++,
        definitionId: nextTierId,
        cellIndex: target.cellIndex,
        currentHealth: mergedDefinition.baseHealth,
        mana: 0,
        isEnemy: false,
      ),
    );
    profile.unlockUnit(nextTierId);

    _emitCellEffect(
      target.cellIndex,
      CellEffectType.merge,
      const Duration(milliseconds: 420),
    );
    SfxService.instance.play(ResourceMap.audioEquip, volume: 0.72);
    _refreshSynergies();
    _setStatus('${baseDefinition.name} x3 -> ${mergedDefinition.name}');
    return true;
  }

  void startCombat() {
    if (!canInteract) {
      return;
    }
    if (_allies.isEmpty) {
      _setStatus('최소 1개의 유닛을 소환하세요.');
      return;
    }

    isCombatPhase = true;
    _spawnWaveEnemies(wave);
    _setStatus('웨이브 $wave 전투 시작');
    notifyListeners();
    _runCombat();
  }

  void openShopPlaceholder() {
    _setStatus('상점 시스템은 현재 프로토타입 단계입니다.');
    SfxService.instance.play(ResourceMap.audioSelect, volume: 0.6);
  }

  void resetRun() {
    isCombatPhase = false;
    isDefeated = false;
    wave = 1;
    statusMessage = '유닛을 소환하고 머지하여 전투를 준비하세요.';
    _allies.clear();
    _enemies.clear();
    _activeSynergies = <ActiveSynergy>[];
    _cellEffects.clear();
    _damagePopups.clear();
    criticalOverlayVisible = false;
    _nextInstanceId = 1;
    notifyListeners();
  }

  Future<void> _runCombat() async {
    int tick = 0;
    while (isCombatPhase && _allies.isNotEmpty && _enemies.isNotEmpty) {
      tick += 1;
      _performTeamTurn(attackerIsAlly: true);
      _cleanupDeadUnits();
      if (_enemies.isEmpty) {
        break;
      }

      _performTeamTurn(attackerIsAlly: false);
      _cleanupDeadUnits();

      _applyTickDecay();
      _applyRegenerationIfNeeded(tick);
      _cleanupExpiredVfx();
      notifyListeners();
      await Future<void>.delayed(const Duration(milliseconds: 280));
    }

    if (!isCombatPhase) {
      return;
    }

    if (_enemies.isEmpty && _allies.isNotEmpty) {
      _onVictory();
    } else {
      _onDefeat();
    }
  }

  void _performTeamTurn({required bool attackerIsAlly}) {
    final List<UnitInstance> attackers = attackerIsAlly ? _allies : _enemies;
    final List<UnitInstance> defenders = attackerIsAlly ? _enemies : _allies;
    final List<UnitInstance> turnOrder = List<UnitInstance>.from(attackers);

    for (final UnitInstance original in turnOrder) {
      final UnitInstance? attacker = _findById(attackers, original.instanceId);
      if (attacker == null || attacker.currentHealth <= 0) {
        continue;
      }
      if (attacker.stunTicks > 0) {
        continue;
      }

      UnitInstance? target =
          _nearestTarget(attacker, defenders) ??
          _nearestTarget(attacker, defenders, ignoreStealth: true);
      if (target == null) {
        continue;
      }

      final UnitDefinition attackerDef = definitionOf(attacker.definitionId);
      final bool isCritical =
          attacker.guaranteedCritical || _random.nextDouble() < 0.15;
      final int damage = _calculateDamage(
        attacker: attacker,
        target: target,
        critical: isCritical,
        attackerIsAlly: attackerIsAlly,
      );

      _emitCellEffect(
        attacker.cellIndex,
        attackerDef.isMelee
            ? CellEffectType.meleeTrail
            : CellEffectType.rangedTrail,
        const Duration(milliseconds: 120),
      );

      SfxService.instance.play(
        attackerDef.isMelee
            ? ResourceMap.audioImpactHeavy
            : ResourceMap.audioLaser,
        volume: 0.65,
      );

      _applyDamage(
        targetId: target.instanceId,
        damage: damage,
        targetList: defenders,
        critical: isCritical,
      );
      _gainMana(attacker.instanceId, attackers, 24);
      _gainMana(target.instanceId, defenders, 14);

      if (attacker.guaranteedCritical) {
        _updateUnit(
          attackers,
          attacker.instanceId,
          (UnitInstance unit) => unit.copyWith(guaranteedCritical: false),
        );
      }

      _triggerPassive(attacker, defenders);
      _tryCastSkill(attacker.instanceId, attackers, defenders, attackerIsAlly);
      _cleanupDeadUnits();

      if (_allies.isEmpty || _enemies.isEmpty) {
        break;
      }
    }
  }

  int _calculateDamage({
    required UnitInstance attacker,
    required UnitInstance target,
    required bool critical,
    required bool attackerIsAlly,
  }) {
    final UnitDefinition attackerDef = definitionOf(attacker.definitionId);
    final UnitDefinition targetDef = definitionOf(target.definitionId);

    double result = attackerDef.baseAttack.toDouble();

    if (attackerDef.id == 'orc_berserker_t2' &&
        attacker.currentHealth <= (attackerDef.baseHealth / 2).round()) {
      result *= 1.30;
    }
    if (critical) {
      result *= 1.60;
    }
    if (target.shieldTicks > 0) {
      result *= 0.50;
    }

    if (!attackerIsAlly) {
      result -= _allyDefenseBonus().toDouble();
    }
    if (attackerIsAlly &&
        attackerDef.job == UnitJob.archer &&
        _hasArcherSkillSynergy()) {
      result *= 1.20;
    }

    result = max(1, result);
    final int tierGap = max(0, attackerDef.tier - targetDef.tier);
    return (result + (tierGap * 2)).round();
  }

  void _applyDamage({
    required int targetId,
    required int damage,
    required List<UnitInstance> targetList,
    required bool critical,
  }) {
    final UnitInstance? current = _findById(targetList, targetId);
    if (current == null) {
      return;
    }
    final int nextHealth = current.currentHealth - damage;
    _updateUnit(
      targetList,
      targetId,
      (UnitInstance unit) => unit.copyWith(currentHealth: nextHealth),
    );

    if (!current.isEnemy && current.cellIndex >= 0) {
      _emitCellEffect(
        current.cellIndex,
        CellEffectType.hitFlash,
        const Duration(milliseconds: 100),
      );
      _emitDamagePopup(current.cellIndex, '$damage', critical: critical);
      if (critical) {
        _toggleCriticalOverlay();
      }
    }
  }

  void _triggerPassive(UnitInstance attacker, List<UnitInstance> defenders) {
    if (attacker.definitionId == 'orc_destroyer_t3' &&
        _random.nextDouble() < 0.20) {
      UnitInstance? target = _nearestTarget(
        attacker,
        defenders,
        ignoreStealth: true,
      );
      if (target == null) {
        return;
      }
      _updateUnit(
        defenders,
        target.instanceId,
        (UnitInstance unit) => unit.copyWith(stunTicks: 1),
      );
      _setStatus('파괴자의 분쇄! 적이 잠시 기절했습니다.');
    }
  }

  void _tryCastSkill(
    int casterId,
    List<UnitInstance> casterList,
    List<UnitInstance> enemyList,
    bool casterIsAlly,
  ) {
    final UnitInstance? caster = _findById(casterList, casterId);
    if (caster == null) {
      return;
    }
    final UnitDefinition definition = definitionOf(caster.definitionId);
    if (definition.maxMana <= 0 || caster.mana < definition.maxMana) {
      return;
    }

    switch (definition.id) {
      case 'human_heavy_swordsman_t2':
        _updateUnit(
          casterList,
          casterId,
          (UnitInstance unit) => unit.copyWith(shieldTicks: 3, mana: 0),
        );
        _setStatus('중갑 검사가 방패 올리기를 시전했습니다.');
        break;
      case 'elf_sharpshooter_t2':
        _updateUnit(
          casterList,
          casterId,
          (UnitInstance unit) =>
              unit.copyWith(guaranteedCritical: true, mana: 0),
        );
        _setStatus('명사수가 약점 조준을 준비했습니다.');
        break;
      case 'human_paladin_t3':
        final UnitInstance? lowest = _lowestHealthUnit(casterList);
        if (lowest != null) {
          final UnitDefinition lowDef = definitionOf(lowest.definitionId);
          final int healed = min(lowDef.baseHealth, lowest.currentHealth + 100);
          _updateUnit(
            casterList,
            lowest.instanceId,
            (UnitInstance unit) => unit.copyWith(currentHealth: healed),
          );
        }
        _updateUnit(
          casterList,
          casterId,
          (UnitInstance unit) => unit.copyWith(mana: 0),
        );
        _setStatus('성기사의 신성한 빛이 아군을 회복했습니다.');
        break;
      case 'elf_shadow_archer_t3':
        _updateUnit(
          casterList,
          casterId,
          (UnitInstance unit) => unit.copyWith(stealthTicks: 3, mana: 0),
        );
        _setStatus('그림자 궁수가 은신 상태가 되었습니다.');
        break;
      default:
        _updateUnit(
          casterList,
          casterId,
          (UnitInstance unit) => unit.copyWith(mana: 0),
        );
    }

    if (casterIsAlly && enemyList.isNotEmpty) {
      notifyListeners();
    }
  }

  void _gainMana(int unitId, List<UnitInstance> side, int amount) {
    final UnitInstance? current = _findById(side, unitId);
    if (current == null) {
      return;
    }
    final UnitDefinition definition = definitionOf(current.definitionId);
    if (definition.maxMana <= 0) {
      return;
    }
    final int nextMana = min(definition.maxMana, current.mana + amount);
    _updateUnit(
      side,
      unitId,
      (UnitInstance unit) => unit.copyWith(mana: nextMana),
    );
  }

  void _applyTickDecay() {
    for (final UnitInstance ally in List<UnitInstance>.from(_allies)) {
      _updateUnit(
        _allies,
        ally.instanceId,
        (UnitInstance unit) => unit.copyWith(
          shieldTicks: max(0, unit.shieldTicks - 1),
          stealthTicks: max(0, unit.stealthTicks - 1),
          stunTicks: max(0, unit.stunTicks - 1),
        ),
      );
    }
    for (final UnitInstance enemy in List<UnitInstance>.from(_enemies)) {
      _updateUnit(
        _enemies,
        enemy.instanceId,
        (UnitInstance unit) => unit.copyWith(
          shieldTicks: max(0, unit.shieldTicks - 1),
          stealthTicks: max(0, unit.stealthTicks - 1),
          stunTicks: max(0, unit.stunTicks - 1),
        ),
      );
    }
  }

  void _applyRegenerationIfNeeded(int tick) {
    if (!_hasHumanTier4Synergy() || tick % 2 != 0) {
      return;
    }
    for (final UnitInstance ally in List<UnitInstance>.from(_allies)) {
      final UnitDefinition definition = definitionOf(ally.definitionId);
      final int healed = min(definition.baseHealth, ally.currentHealth + 5);
      _updateUnit(
        _allies,
        ally.instanceId,
        (UnitInstance unit) => unit.copyWith(currentHealth: healed),
      );
    }
  }

  void _spawnWaveEnemies(int waveNumber) {
    _enemies.clear();
    final EnemyWaveDefinition waveDef =
        waveDefinitions[waveNumber] ?? waveDefinitions[1]!;

    int startCell = boardCellCount;
    for (final MapEntry<String, int> entry in waveDef.enemies.entries) {
      final UnitDefinition definition = definitionOf(entry.key);
      for (int i = 0; i < entry.value; i++) {
        _enemies.add(
          UnitInstance(
            instanceId: _nextInstanceId++,
            definitionId: definition.id,
            cellIndex: startCell++,
            currentHealth: definition.baseHealth,
            mana: 0,
            isEnemy: true,
          ),
        );
      }
    }
  }

  void _cleanupDeadUnits() {
    _allies.removeWhere((UnitInstance unit) => unit.currentHealth <= 0);
    _enemies.removeWhere((UnitInstance unit) => unit.currentHealth <= 0);
    _refreshSynergies();
  }

  void _onVictory() {
    isCombatPhase = false;
    final int reward = roundIncome + (10 + wave * 2);
    profile.addGold(reward);
    profile.grantAccountExp(40);
    profile.grantBattlePassExp(35);
    _enemies.clear();
    _setStatus('웨이브 $wave 승리! +$reward 골드');
    SfxService.instance.play(ResourceMap.audioJingleWin, volume: 0.7);
    wave += 1;
    notifyListeners();
  }

  void _onDefeat() {
    isCombatPhase = false;
    isDefeated = true;
    profile.grantAccountExp(18);
    _enemies.clear();
    _setStatus('패배했습니다. 전열을 정비한 뒤 재도전하세요.');
    SfxService.instance.play(ResourceMap.audioJingleLose, volume: 0.7);
    notifyListeners();
  }

  void _refreshSynergies() {
    final Map<String, int> raceCounts = <String, int>{};
    final Map<String, int> jobCounts = <String, int>{};

    for (final UnitInstance unit in _allies) {
      final UnitDefinition definition = definitionOf(unit.definitionId);
      raceCounts[definition.race.key] =
          (raceCounts[definition.race.key] ?? 0) + 1;
      jobCounts[definition.job.key] = (jobCounts[definition.job.key] ?? 0) + 1;
    }

    _activeSynergies = <ActiveSynergy>[];
    for (final SynergyRule rule in synergyRules) {
      final int currentCount = switch (rule.type) {
        SynergyType.race => raceCounts[rule.token] ?? 0,
        SynergyType.job => jobCounts[rule.token] ?? 0,
      };
      if (currentCount >= rule.requiredCount) {
        _activeSynergies.add(
          ActiveSynergy(rule: rule, currentCount: currentCount),
        );
      }
    }
  }

  int _allyDefenseBonus() {
    if (_hasHumanTier4Synergy()) {
      return 25;
    }
    if (_activeSynergies.any(
      (ActiveSynergy active) =>
          active.rule.type == SynergyType.race &&
          active.rule.token == 'human' &&
          active.rule.requiredCount == 2,
    )) {
      return 10;
    }
    return 0;
  }

  bool _hasHumanTier4Synergy() {
    return _activeSynergies.any(
      (ActiveSynergy active) =>
          active.rule.type == SynergyType.race &&
          active.rule.token == 'human' &&
          active.rule.requiredCount == 4,
    );
  }

  bool _hasArcherSkillSynergy() {
    return _activeSynergies.any(
      (ActiveSynergy active) =>
          active.rule.type == SynergyType.job &&
          active.rule.token == 'archer' &&
          active.rule.requiredCount == 3,
    );
  }

  UnitInstance? _nearestTarget(
    UnitInstance attacker,
    List<UnitInstance> candidates, {
    bool ignoreStealth = false,
  }) {
    UnitInstance? nearest;
    int shortest = 1 << 30;
    for (final UnitInstance candidate in candidates) {
      if (candidate.currentHealth <= 0) {
        continue;
      }
      if (!ignoreStealth && candidate.stealthTicks > 0) {
        continue;
      }
      final int distance = _distance(attacker.cellIndex, candidate.cellIndex);
      if (distance < shortest) {
        shortest = distance;
        nearest = candidate;
      }
    }
    return nearest;
  }

  int _distance(int firstIndex, int secondIndex) {
    final int r1 = firstIndex ~/ boardColumns;
    final int c1 = firstIndex % boardColumns;
    final int r2 = secondIndex ~/ boardColumns;
    final int c2 = secondIndex % boardColumns;
    return (r1 - r2).abs() + (c1 - c2).abs();
  }

  UnitInstance? _lowestHealthUnit(List<UnitInstance> side) {
    UnitInstance? lowest;
    double lowestRatio = 1.1;
    for (final UnitInstance unit in side) {
      final UnitDefinition definition = definitionOf(unit.definitionId);
      final double ratio = unit.currentHealth / definition.baseHealth;
      if (ratio < lowestRatio) {
        lowestRatio = ratio;
        lowest = unit;
      }
    }
    return lowest;
  }

  void _updateUnit(
    List<UnitInstance> side,
    int id,
    UnitInstance Function(UnitInstance unit) mapper,
  ) {
    final int index = side.indexWhere(
      (UnitInstance unit) => unit.instanceId == id,
    );
    if (index < 0) {
      return;
    }
    side[index] = mapper(side[index]);
  }

  UnitInstance? _findById(List<UnitInstance> side, int id) {
    for (final UnitInstance unit in side) {
      if (unit.instanceId == id) {
        return unit;
      }
    }
    return null;
  }

  List<int> _emptyCells() {
    final List<int> indexes = List<int>.generate(
      boardCellCount,
      (int index) => index,
    );
    return indexes
        .where(
          (int index) =>
              _allies.every((UnitInstance ally) => ally.cellIndex != index),
        )
        .toList();
  }

  void _emitCellEffect(int cellIndex, CellEffectType type, Duration duration) {
    if (cellIndex < 0 || cellIndex >= boardCellCount) {
      return;
    }
    final int id = _nextEffectId++;
    _cellEffects.add(
      CellEffect(
        id: id,
        cellIndex: cellIndex,
        type: type,
        createdAt: DateTime.now(),
        duration: duration,
      ),
    );
    notifyListeners();
    Future<void>.delayed(duration, () {
      _cellEffects.removeWhere((CellEffect effect) => effect.id == id);
      notifyListeners();
    });
  }

  void _emitDamagePopup(int cellIndex, String text, {required bool critical}) {
    if (cellIndex < 0 || cellIndex >= boardCellCount) {
      return;
    }
    final int id = _nextEffectId++;
    final Duration duration = const Duration(milliseconds: 550);
    _damagePopups.add(
      DamagePopup(
        id: id,
        cellIndex: cellIndex,
        text: text,
        critical: critical,
        createdAt: DateTime.now(),
        duration: duration,
      ),
    );
    notifyListeners();
    Future<void>.delayed(duration, () {
      _damagePopups.removeWhere((DamagePopup popup) => popup.id == id);
      notifyListeners();
    });
  }

  void _toggleCriticalOverlay() {
    criticalOverlayVisible = true;
    notifyListeners();
    Future<void>.delayed(const Duration(milliseconds: 80), () {
      criticalOverlayVisible = false;
      notifyListeners();
    });
  }

  void _cleanupExpiredVfx() {
    final DateTime now = DateTime.now();
    _cellEffects.removeWhere(
      (CellEffect effect) => now.difference(effect.createdAt) > effect.duration,
    );
    _damagePopups.removeWhere(
      (DamagePopup popup) => now.difference(popup.createdAt) > popup.duration,
    );
  }

  void _setStatus(String message) {
    statusMessage = message;
    notifyListeners();
  }
}
