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

    test('used energy respects bounds 0 to 19', () {
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

    test('reset keeps the selected theme but clears counters', () {
      final state = const ArenaCounterState.initial()
          .changeTheme(ArenaThemeId.arcana)
          .leaderLevelUp()
          .increaseDamage()
          .increaseUsedEnergy();

      final reset = state.resetCounter();

      expect(reset.themeId, ArenaThemeId.arcana);
      expect(reset.turnState, TurnState.waiting);
      expect(reset.leaderLevel, 0);
      expect(reset.damageZone, 0);
      expect(reset.usedEnergy, 0);
      expect(reset.maxEnergy, 0);
    });
  });
}
