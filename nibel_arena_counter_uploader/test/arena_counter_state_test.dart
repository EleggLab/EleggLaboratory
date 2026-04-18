import 'package:flutter_test/flutter_test.dart';
import 'package:nibel_arena_counter/src/models/arena_counter_state.dart';

void main() {
  group('ArenaCounterState', () {
    test('starts in waiting state with zeroed counters', () {
      const state = ArenaCounterState.initial();

      expect(state.turnState, TurnState.waiting);
      expect(state.initiative, Initiative.first);
      expect(state.leaderLevel, 0);
      expect(state.damageZone, 0);
      expect(state.usedEnergy, 0);
      expect(state.maxEnergy, 0);
      expect(state.isWaiting, isTrue);
      expect(state.isActive, isFalse);
    });

    test('first leader level up starts the turn at level 2', () {
      const state = ArenaCounterState.initial();
      final next = state.leaderLevelUp();

      expect(next.turnState, TurnState.active);
      expect(next.leaderLevel, 2);
      expect(next.maxEnergy, 2);
    });

    test('leader level is capped at 10', () {
      var state = const ArenaCounterState.initial().leaderLevelUp();

      for (var index = 0; index < 20; index++) {
        state = state.leaderLevelUp();
      }

      expect(state.leaderLevel, 10);
      expect(state.canLevelUp, isFalse);
    });

    test('guilty leader adds +1 size from leader level 6 and shows display', () {
      var state = const ArenaCounterState.initial().changeTheme(
        ArenaThemeId.guiltyLeader,
      );

      state = state.leaderLevelUp(); // 2
      state = state.leaderLevelUp(); // 3
      state = state.leaderLevelUp(); // 4
      state = state.leaderLevelUp(); // 5
      state = state.leaderLevelUp(); // 6

      expect(state.leaderLevel, 6);
      expect(state.guiltyLeaderBonus, 1);
      expect(state.leaderLevelDisplay, '6+1');
      expect(state.maxEnergy, 7);
    });

    test('damage zone stays locked while waiting', () {
      const state = ArenaCounterState.initial();

      expect(state.increaseDamage().damageZone, 0);
      expect(state.decreaseDamage().damageZone, 0);
      expect(state.canIncreaseDamage, isFalse);
      expect(state.canDecreaseDamage, isFalse);
    });

    test('damage zone respects bounds 0 to 9', () {
      var state = const ArenaCounterState.initial().leaderLevelUp();

      for (var index = 0; index < 20; index++) {
        state = state.increaseDamage();
      }
      expect(state.damageZone, 9);
      expect(state.canIncreaseDamage, isFalse);

      for (var index = 0; index < 20; index++) {
        state = state.decreaseDamage();
      }
      expect(state.damageZone, 0);
      expect(state.canDecreaseDamage, isFalse);
    });

    test('used energy stays locked while waiting', () {
      const state = ArenaCounterState.initial();

      expect(state.increaseUsedEnergy().usedEnergy, 0);
      expect(state.decreaseUsedEnergy().usedEnergy, 0);
      expect(state.canIncreaseUsedEnergy, isFalse);
      expect(state.canDecreaseUsedEnergy, isFalse);
    });

    test('used energy respects bounds 0 to 19 in default themes', () {
      var state = const ArenaCounterState.initial().leaderLevelUp();

      for (var index = 0; index < 30; index++) {
        state = state.increaseUsedEnergy();
      }
      expect(state.usedEnergy, 19);
      expect(state.canIncreaseUsedEnergy, isFalse);

      for (var index = 0; index < 30; index++) {
        state = state.decreaseUsedEnergy();
      }
      expect(state.usedEnergy, 0);
      expect(state.canDecreaseUsedEnergy, isFalse);
    });

    test('special themes raise used cost cap to their own maximums', () {
      var guilty = const ArenaCounterState.initial().changeTheme(
        ArenaThemeId.guiltyLeader,
      ).leaderLevelUp();
      var debi = const ArenaCounterState.initial().changeTheme(
        ArenaThemeId.debiMarlene,
      ).leaderLevelUp();

      expect(guilty.usedEnergyLimit, 20);
      expect(debi.usedEnergyLimit, 24);

      for (var index = 0; index < 40; index++) {
        guilty = guilty.increaseUsedEnergy();
        debi = debi.increaseUsedEnergy();
      }

      expect(guilty.usedEnergy, 20);
      expect(guilty.canIncreaseUsedEnergy, isFalse);
      expect(debi.usedEnergy, 24);
      expect(debi.canIncreaseUsedEnergy, isFalse);
    });

    test('overflow warning turns on only after max energy is exceeded', () {
      var state = const ArenaCounterState.initial().leaderLevelUp();

      state = state.increaseUsedEnergy();
      state = state.increaseUsedEnergy();
      expect(state.isUsedEnergyOverflow, isFalse);

      state = state.increaseUsedEnergy();
      expect(state.usedEnergy, 3);
      expect(state.maxEnergy, 2);
      expect(state.isUsedEnergyOverflow, isTrue);
    });

    test('initiative toggles between first and second', () {
      const state = ArenaCounterState.initial();

      expect(state.toggleInitiative().initiative, Initiative.second);
      expect(
        state.toggleInitiative().toggleInitiative().initiative,
        Initiative.first,
      );
    });

    test('debi and marlene effect toggles +5 size only at leader level 10', () {
      var state = const ArenaCounterState.initial().changeTheme(
        ArenaThemeId.debiMarlene,
      );

      expect(state.canToggleDebiMarleneEffect, isFalse);
      expect(state.toggleDebiMarleneEffect().debiMarleneEffectActive, isFalse);

      state = state.leaderLevelUp();
      for (var index = 0; index < 8; index++) {
        state = state.leaderLevelUp();
      }

      expect(state.leaderLevel, 10);
      expect(state.maxEnergy, 10);
      expect(state.canToggleDebiMarleneEffect, isTrue);

      state = state.toggleDebiMarleneEffect();
      expect(state.debiMarleneEffectActive, isTrue);
      expect(state.debiMarleneBonus, 5);
      expect(state.maxEnergy, 15);

      state = state.toggleDebiMarleneEffect();
      expect(state.debiMarleneEffectActive, isFalse);
      expect(state.maxEnergy, 10);
    });

    test('changing away from debi and marlene clears the +5 effect', () {
      var state = const ArenaCounterState.initial().changeTheme(
        ArenaThemeId.debiMarlene,
      );

      state = state.leaderLevelUp();
      for (var index = 0; index < 8; index++) {
        state = state.leaderLevelUp();
      }
      state = state.toggleDebiMarleneEffect();

      final next = state.changeTheme(ArenaThemeId.guiltyLeader);

      expect(next.debiMarleneEffectActive, isFalse);
      expect(next.debiMarleneBonus, 0);
    });

    test('changing to a lower-cap theme clamps used cost to that theme cap', () {
      var state = const ArenaCounterState.initial().changeTheme(
        ArenaThemeId.debiMarlene,
      ).leaderLevelUp();

      for (var index = 0; index < 24; index++) {
        state = state.increaseUsedEnergy();
      }

      final next = state.changeTheme(ArenaThemeId.cookingOil);

      expect(next.usedEnergyLimit, 19);
      expect(next.usedEnergy, 19);
    });

    test('reset keeps the selected theme but clears counters', () {
      final state = const ArenaCounterState.initial()
          .changeTheme(ArenaThemeId.debiMarlene)
          .leaderLevelUp()
          .increaseDamage()
          .increaseUsedEnergy()
          .copyWith(debiMarleneEffectActive: true);

      final reset = state.resetCounter();

      expect(reset.themeId, ArenaThemeId.debiMarlene);
      expect(reset.turnState, TurnState.waiting);
      expect(reset.leaderLevel, 0);
      expect(reset.damageZone, 0);
      expect(reset.usedEnergy, 0);
      expect(reset.maxEnergy, 0);
      expect(reset.debiMarleneEffectActive, isFalse);
    });
  });
}
