import 'package:flutter/foundation.dart';

enum TurnState { waiting, active }

enum Initiative { first, second }

enum ArenaThemeId { cookingOil, goddessSquad, infinityRail, arcana }

@immutable
class ArenaCounterState {
  const ArenaCounterState({
    required this.turnState,
    required this.initiative,
    required this.leaderLevel,
    required this.damageZone,
    required this.usedEnergy,
    required this.themeId,
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
       );

  final TurnState turnState;
  final Initiative initiative;
  final int leaderLevel;
  final int damageZone;
  final int usedEnergy;
  final ArenaThemeId themeId;

  bool get isWaiting => turnState == TurnState.waiting;

  bool get isActive => turnState == TurnState.active;

  int get maxEnergy => isWaiting ? 0 : leaderLevel + damageZone;

  bool get isUsedEnergyOverflow => usedEnergy > maxEnergy;

  bool get canLevelUp => isWaiting || leaderLevel < 10;

  bool get canIncreaseDamage => isActive && damageZone < 9;

  bool get canDecreaseDamage => isActive && damageZone > 0;

  bool get canIncreaseUsedEnergy => isActive && usedEnergy < 19;

  bool get canDecreaseUsedEnergy => isActive && usedEnergy > 0;

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

  ArenaCounterState changeTheme(ArenaThemeId nextThemeId) {
    return copyWith(themeId: nextThemeId);
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
  }) {
    return ArenaCounterState(
      turnState: turnState ?? this.turnState,
      initiative: initiative ?? this.initiative,
      leaderLevel: leaderLevel ?? this.leaderLevel,
      damageZone: damageZone ?? this.damageZone,
      usedEnergy: usedEnergy ?? this.usedEnergy,
      themeId: themeId ?? this.themeId,
    );
  }
}
