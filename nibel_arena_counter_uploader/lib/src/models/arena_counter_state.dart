import 'package:flutter/foundation.dart';
import 'dart:math' as math;

enum TurnState { waiting, active }

enum Initiative { first, second }

enum ArenaThemeId {
  cookingOil,
  goddessSquad,
  infinityRail,
  arcana,
  guiltyLeader,
  debiMarlene,
}

@immutable
class ArenaCounterState {
  const ArenaCounterState({
    required this.turnState,
    required this.initiative,
    required this.leaderLevel,
    required this.damageZone,
    required this.usedEnergy,
    required this.themeId,
    required this.debiMarleneEffectActive,
  });

  const ArenaCounterState.initial({
    ArenaThemeId themeId = ArenaThemeId.cookingOil,
  }) : this(
         turnState: TurnState.waiting,
         initiative: Initiative.first,
         leaderLevel: 0,
         damageZone: 0,
         usedEnergy: 0,
         themeId: themeId,
         debiMarleneEffectActive: false,
       );

  final TurnState turnState;
  final Initiative initiative;
  final int leaderLevel;
  final int damageZone;
  final int usedEnergy;
  final ArenaThemeId themeId;
  final bool debiMarleneEffectActive;

  bool get isWaiting => turnState == TurnState.waiting;

  bool get isActive => turnState == TurnState.active;

  bool get isGuiltyLeaderTheme => themeId == ArenaThemeId.guiltyLeader;

  bool get isDebiMarleneTheme => themeId == ArenaThemeId.debiMarlene;

  int get guiltyLeaderBonus =>
      isActive && isGuiltyLeaderTheme && leaderLevel >= 6 ? 1 : 0;

  int get debiMarleneBonus =>
      isActive && isDebiMarleneTheme && debiMarleneEffectActive ? 5 : 0;

  int get maxEnergy => isWaiting
      ? 0
      : leaderLevel + damageZone + guiltyLeaderBonus + debiMarleneBonus;

  int get usedEnergyLimit => switch (themeId) {
    ArenaThemeId.guiltyLeader => 20,
    ArenaThemeId.debiMarlene => 24,
    _ => 19,
  };

  String get leaderLevelDisplay =>
      guiltyLeaderBonus > 0 ? '$leaderLevel+1' : '$leaderLevel';

  bool get isUsedEnergyOverflow => usedEnergy > maxEnergy;

  bool get canLevelUp => isWaiting || leaderLevel < 10;

  bool get canIncreaseDamage => isActive && damageZone < 9;

  bool get canDecreaseDamage => isActive && damageZone > 0;

  bool get canIncreaseUsedEnergy => isActive && usedEnergy < usedEnergyLimit;

  bool get canDecreaseUsedEnergy => isActive && usedEnergy > 0;

  bool get canToggleDebiMarleneEffect =>
      isDebiMarleneTheme && isActive && leaderLevel >= 10;

  ArenaCounterState leaderLevelUp() {
    if (isWaiting) {
      return copyWith(turnState: TurnState.active, leaderLevel: 2);
    }

    if (leaderLevel >= 10) {
      return this;
    }

    return copyWith(leaderLevel: leaderLevel + 1);
  }

  ArenaCounterState increaseDamage() {
    if (!canIncreaseDamage) {
      return this;
    }

    return copyWith(damageZone: damageZone + 1);
  }

  ArenaCounterState decreaseDamage() {
    if (!canDecreaseDamage) {
      return this;
    }

    return copyWith(damageZone: damageZone - 1);
  }

  ArenaCounterState increaseUsedEnergy() {
    if (!canIncreaseUsedEnergy) {
      return this;
    }

    return copyWith(usedEnergy: usedEnergy + 1);
  }

  ArenaCounterState decreaseUsedEnergy() {
    if (!canDecreaseUsedEnergy) {
      return this;
    }

    return copyWith(usedEnergy: usedEnergy - 1);
  }

  ArenaCounterState toggleInitiative() {
    return copyWith(
      initiative: initiative == Initiative.first
          ? Initiative.second
          : Initiative.first,
    );
  }

  ArenaCounterState toggleDebiMarleneEffect() {
    if (!canToggleDebiMarleneEffect) {
      return this;
    }

    return copyWith(
      debiMarleneEffectActive: !debiMarleneEffectActive,
    );
  }

  ArenaCounterState changeTheme(ArenaThemeId nextThemeId) {
    final nextDebiEffectActive = nextThemeId == ArenaThemeId.debiMarlene
        ? debiMarleneEffectActive
        : false;
    final nextUsedEnergyLimit = switch (nextThemeId) {
      ArenaThemeId.guiltyLeader => 20,
      ArenaThemeId.debiMarlene => 24,
      _ => 19,
    };

    return copyWith(
      themeId: nextThemeId,
      debiMarleneEffectActive: nextDebiEffectActive,
      usedEnergy: math.min(usedEnergy, nextUsedEnergyLimit),
    );
  }

  ArenaCounterState resetCounter() {
    return ArenaCounterState.initial(themeId: themeId);
  }

  ArenaCounterState copyWith({
    TurnState? turnState,
    Initiative? initiative,
    int? leaderLevel,
    int? damageZone,
    int? usedEnergy,
    ArenaThemeId? themeId,
    bool? debiMarleneEffectActive,
  }) {
    return ArenaCounterState(
      turnState: turnState ?? this.turnState,
      initiative: initiative ?? this.initiative,
      leaderLevel: leaderLevel ?? this.leaderLevel,
      damageZone: damageZone ?? this.damageZone,
      usedEnergy: usedEnergy ?? this.usedEnergy,
      themeId: themeId ?? this.themeId,
      debiMarleneEffectActive:
          debiMarleneEffectActive ?? this.debiMarleneEffectActive,
    );
  }
}
