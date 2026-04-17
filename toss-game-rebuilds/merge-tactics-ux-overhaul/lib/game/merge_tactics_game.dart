import 'package:flame/components.dart';
import 'package:flame/game.dart';
import 'package:flame_audio/flame_audio.dart';
import 'package:flutter/material.dart';

import 'components/battle_arena.dart';
import 'data/asset_catalog.dart';
import 'data/units.dart';
import 'systems/battle_system.dart';
import 'systems/merge_system.dart';
import 'systems/progression_system.dart';

class BattleSummary {
  const BattleSummary({
    required this.result,
    required this.trophyDelta,
    required this.goldDelta,
    required this.totalTrophies,
    required this.totalGold,
    required this.totalGems,
    required this.leagueName,
  });

  final BattleResult result;
  final int trophyDelta;
  final int goldDelta;
  final int totalTrophies;
  final int totalGold;
  final int totalGems;
  final String leagueName;
}

class MergeTacticsGame extends FlameGame {
  MergeTacticsGame({this.onBattleFinished, this.onProgressChanged});

  late final BattleArena battleArena;
  late final MergeSystem mergeSystem;
  late final BattleSystem battleSystem;
  final ProgressionSystem progressionSystem = ProgressionSystem(
    initialGold: 1000,
  );
  final void Function(BattleSummary summary)? onBattleFinished;
  final VoidCallback? onProgressChanged;
  BattlePhase _previousPhase = BattlePhase.preparation;
  BattleSummary? _lastBattleSummary;
  bool _systemsReady = false;

  @override
  Color backgroundColor() => const Color(0xFF0E1522);

  @override
  Future<void> onLoad() async {
    battleArena = BattleArena()..anchor = Anchor.topLeft;

    mergeSystem = MergeSystem(battleArena);
    battleSystem = BattleSystem(battleArena);
    mergeSystem.onMergeSuccess = () {
      progressionSystem.recordMerge();
      onProgressChanged?.call();
    };
    battleSystem.onSkillCast = () {
      progressionSystem.recordSkillUse();
      onProgressChanged?.call();
    };
    battleSystem.onBattleFinished = (BattleResult result) {
      final BattleProgressReward reward = progressionSystem.recordBattleOutcome(
        playerWon: result == BattleResult.playerWin,
      );
      _playResultJingle(result);
      _lastBattleSummary = BattleSummary(
        result: result,
        trophyDelta: reward.trophyDelta,
        goldDelta: reward.goldDelta,
        totalTrophies: progressionSystem.trophies,
        totalGold: progressionSystem.gold,
        totalGems: progressionSystem.gems,
        leagueName: progressionSystem.currentLeague.name,
      );
      onProgressChanged?.call();
      if (_lastBattleSummary != null) {
        onBattleFinished?.call(_lastBattleSummary!);
      }
    };

    battleArena.onAllyUnitDragReleased = mergeSystem.handleDropMerge;
    battleArena.canDragAllies = () => battleSystem.isPreparationPhase;
    battleArena.allyStatMultiplierResolver = (UnitData data) {
      return progressionSystem.statMultiplierForUnit(data.id);
    };
    add(battleArena);
    _layoutArena();
    _previousPhase = battleSystem.phase;
    _systemsReady = true;
  }

  @override
  void update(double dt) {
    super.update(dt);
    if (!hasLayout || !_systemsReady) {
      return;
    }
    battleSystem.update(dt);
    if (_previousPhase != battleSystem.phase) {
      _previousPhase = battleSystem.phase;
      onProgressChanged?.call();
    }
  }

  void mergeTierOneWarriors() {
    if (!isLoaded || !battleSystem.isPreparationPhase) {
      return;
    }
    mergeSystem.tryMerge('warrior_1');
  }

  void startCombatNow() {
    if (!isLoaded) {
      return;
    }
    battleSystem.startCombatPhase();
  }

  void prepareBattle() {
    if (!isLoaded) {
      return;
    }
    battleSystem.resetToPreparation(resetArena: true);
  }

  void addGold(int amount) {
    progressionSystem.addGold(amount);
    onProgressChanged?.call();
  }

  void addGems(int amount) {
    progressionSystem.addGems(amount);
    onProgressChanged?.call();
  }

  void addCardCopies(String unitId, int copies) {
    progressionSystem.addCardCopies(unitId, copies);
    onProgressChanged?.call();
  }

  bool upgradeCard(String unitId) {
    final bool upgraded = progressionSystem.upgradeCard(unitId);
    if (upgraded) {
      _playUiSfx(AudioAssets.levelUp);
      onProgressChanged?.call();
    }
    return upgraded;
  }

  CardCollection cardCollection(String unitId) {
    return progressionSystem.cardByUnitId(unitId);
  }

  List<QuestProgress> get dailyQuestProgress {
    return progressionSystem.quests.values.toList(growable: false);
  }

  QuestReward? claimQuestReward(String questId) {
    final QuestReward? reward = progressionSystem.claimQuestReward(questId);
    if (reward != null) {
      onProgressChanged?.call();
    }
    return reward;
  }

  int statBonusPercentForUnit(String unitId) {
    return progressionSystem.statBonusPercentForUnit(unitId);
  }

  int cardsNeededForUpgrade(String unitId) {
    final CardCollection card = progressionSystem.cardByUnitId(unitId);
    return progressionSystem.cardUpgradeSystem.cardsRequiredForNextLevel(
      card.level,
    );
  }

  int goldNeededForUpgrade(String unitId) {
    final CardCollection card = progressionSystem.cardByUnitId(unitId);
    return progressionSystem.cardUpgradeSystem.goldCostForNextLevel(card.level);
  }

  int get phaseRemainingSeconds => _systemsReady
      ? battleSystem.phaseRemaining.ceil()
      : BattleSystem.preparationDuration.toInt();
  BattlePhase get phase =>
      _systemsReady ? battleSystem.phase : BattlePhase.preparation;
  BattleSummary? get lastBattleSummary => _lastBattleSummary;
  List<UnitData> get unitCatalogList => units;
  int get trophies => progressionSystem.trophies;
  int get gold => progressionSystem.gold;
  int get gems => progressionSystem.gems;
  String get leagueName => progressionSystem.currentLeague.name;

  @override
  @mustCallSuper
  void onGameResize(Vector2 size) {
    super.onGameResize(size);
    if (!isLoaded) {
      return;
    }
    _layoutArena();
  }

  Future<void> _playResultJingle(BattleResult result) async {
    final String sfx = result == BattleResult.playerWin
        ? AudioAssets.winJingle
        : AudioAssets.loseJingle;
    await _playUiSfx(sfx);
  }

  Future<void> _playUiSfx(String path) async {
    try {
      await FlameAudio.play(path);
    } catch (_) {
      // Result SFX can be absent in local asset setup.
    }
  }

  void _layoutArena() {
    if (!hasLayout) {
      return;
    }
    final double x = (size.x - battleArena.size.x) / 2;
    final double y = (size.y - battleArena.size.y) / 2;
    battleArena.position = Vector2(
      x.isFinite ? x.clamp(8, size.x) : 8,
      y.isFinite ? y.clamp(8, size.y) : 8,
    );
  }
}
