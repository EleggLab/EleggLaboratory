import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/game/run_goal_rules.dart';

void main() {
  test('milestone reward triggers for newly reached loops only', () {
    final result = evaluateMilestoneReward(loop: 35, claimedMilestones: {10});
    expect(result.reachedLoops, <int>[20, 30]);
    expect(result.rewardGold, 6);
  });

  test('milestone reward is empty when nothing new is reached', () {
    final result = evaluateMilestoneReward(
      loop: 20,
      claimedMilestones: {10, 20},
    );
    expect(result.reachedLoops, isEmpty);
    expect(result.rewardGold, 0);
  });
}
