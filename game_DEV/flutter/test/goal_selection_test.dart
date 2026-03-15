import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/game/run_goal_rules.dart';

void main() {
  test('run goal roll selects one of three goal types', () {
    final seen = <RunGoalType>{};
    for (var i = 0; i < 120; i++) {
      final goal = selectRunGoalByRoll(i);
      expect(RunGoalType.values, contains(goal));
      seen.add(goal);
    }
    expect(seen.length, RunGoalType.values.length);
  });
}
