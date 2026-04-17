import 'package:flutter_test/flutter_test.dart';
import 'package:merge_tactics/game/systems/progression_system.dart';

void main() {
  group('league table', () {
    test('resolves league by trophy range', () {
      expect(leagueByTrophy(0).name, '나무 리그');
      expect(leagueByTrophy(400).name, '돌 리그');
      expect(leagueByTrophy(1400).name, '금 리그');
      expect(leagueByTrophy(99999).name, '전설 리그');
    });
  });

  group('card upgrade', () {
    test('consumes cards and gold on upgrade', () {
      final ProgressionSystem progression = ProgressionSystem(
        initialGold: 2000,
      );

      progression.addCardCopies('warrior_1', 2);
      final bool upgraded = progression.upgradeCard('warrior_1');

      expect(upgraded, isTrue);
      expect(progression.gold, 1800);
      expect(progression.cardByUnitId('warrior_1').level, 2);
      expect(progression.cardByUnitId('warrior_1').copies, 0);
    });
  });

  group('quest and trophy progression', () {
    test('battle win updates trophies, gold, and quests', () {
      final ProgressionSystem progression = ProgressionSystem(initialGold: 0);

      progression.recordBattleOutcome(playerWon: true);

      expect(progression.trophies, 30);
      expect(progression.gold, progression.currentLeague.reward);
      expect(progression.quests['win_3']?.progress, 1);
      expect(progression.quests['reach_trophy']?.progress, 30);
    });

    test('merge and skill usage accumulate daily quests', () {
      final ProgressionSystem progression = ProgressionSystem();

      progression.recordMerge(count: 5);
      progression.recordSkillUse(count: 10);

      expect(progression.quests['merge_5']?.isCompleted, isTrue);
      expect(progression.quests['use_skill_10']?.isCompleted, isTrue);
    });
  });
}
