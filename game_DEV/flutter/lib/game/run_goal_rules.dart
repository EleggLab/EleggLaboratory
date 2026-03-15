import '../models/game_options.dart';

enum RunGoalType { surviveLoop20, defeatBoss1, reachCombo40 }

class RunGoalDefinition {
  const RunGoalDefinition({
    required this.type,
    required this.id,
    required this.koTitle,
    required this.enTitle,
    required this.koDescription,
    required this.enDescription,
    required this.rewardGold,
    required this.rewardDiamonds,
  });

  final RunGoalType type;
  final String id;
  final String koTitle;
  final String enTitle;
  final String koDescription;
  final String enDescription;
  final int rewardGold;
  final int rewardDiamonds;
}

class MilestoneRewardResult {
  const MilestoneRewardResult({
    required this.reachedLoops,
    required this.rewardGold,
  });

  final List<int> reachedLoops;
  final int rewardGold;
}

const List<int> kRunMilestoneLoops = <int>[10, 20, 30, 40];

const List<RunGoalDefinition> kRunGoalDefinitions = <RunGoalDefinition>[
  RunGoalDefinition(
    type: RunGoalType.surviveLoop20,
    id: 'goal_survive_20',
    koTitle: '\u0032\u0030\ub8e8\ud504 \uc0dd\uc874',
    enTitle: 'Survive 20 Loops',
    koDescription:
        '\uc774\ubc88 \ub7f0\uc5d0\uc11c \ub8e8\ud504 \u0032\u0030\uc5d0 \ub3c4\ub2ec\ud558\uc138\uc694.',
    enDescription: 'Reach loop 20 or higher in this run.',
    rewardGold: 12,
    rewardDiamonds: 1,
  ),
  RunGoalDefinition(
    type: RunGoalType.defeatBoss1,
    id: 'goal_boss_1',
    koTitle: '\ubcf4\uc2a4 \u0031\ud68c \ucc98\uce58',
    enTitle: 'Defeat 1 Boss',
    koDescription:
        '\uc774\ubc88 \ub7f0\uc5d0\uc11c \ubcf4\uc2a4\ub97c \ud55c \ub9c8\ub9ac \ucc98\uce58\ud558\uc138\uc694.',
    enDescription: 'Defeat one boss in this run.',
    rewardGold: 12,
    rewardDiamonds: 1,
  ),
  RunGoalDefinition(
    type: RunGoalType.reachCombo40,
    id: 'goal_combo_40',
    koTitle: '\ucf64\ubcf4 \u0034\u0030 \ub2ec\uc131',
    enTitle: 'Reach Combo 40',
    koDescription:
        '\uc774\ubc88 \ub7f0\uc5d0\uc11c \ucd5c\ub300 \ucf64\ubcf4 \u0034\u0030\uc744 \ub2ec\uc131\ud558\uc138\uc694.',
    enDescription: 'Reach combo 40 or higher in this run.',
    rewardGold: 12,
    rewardDiamonds: 1,
  ),
];

RunGoalDefinition runGoalDefinition(RunGoalType type) {
  for (final definition in kRunGoalDefinitions) {
    if (definition.type == type) {
      return definition;
    }
  }
  return kRunGoalDefinitions.first;
}

RunGoalType runGoalTypeFromName(String? raw) {
  for (final type in RunGoalType.values) {
    if (type.name == raw) {
      return type;
    }
  }
  return RunGoalType.surviveLoop20;
}

RunGoalType selectRunGoalByRoll(int roll) {
  final normalized = roll < 0 ? -roll : roll;
  return RunGoalType.values[normalized % RunGoalType.values.length];
}

bool isRunGoalCleared({
  required RunGoalType goal,
  required int maxLoopReached,
  required int bossesKilled,
  required int maxComboReached,
}) {
  switch (goal) {
    case RunGoalType.surviveLoop20:
      return maxLoopReached >= 20;
    case RunGoalType.defeatBoss1:
      return bossesKilled >= 1;
    case RunGoalType.reachCombo40:
      return maxComboReached >= 40;
  }
}

String localizedRunGoalTitle(RunGoalType goal, UiLanguage language) {
  final definition = runGoalDefinition(goal);
  return language == UiLanguage.ko ? definition.koTitle : definition.enTitle;
}

String localizedRunGoalDescription(RunGoalType goal, UiLanguage language) {
  final definition = runGoalDefinition(goal);
  return language == UiLanguage.ko
      ? definition.koDescription
      : definition.enDescription;
}

String runGoalProgressText({
  required RunGoalType goal,
  required int maxLoopReached,
  required int bossesKilled,
  required int maxComboReached,
}) {
  switch (goal) {
    case RunGoalType.surviveLoop20:
      return '$maxLoopReached/20';
    case RunGoalType.defeatBoss1:
      return '$bossesKilled/1';
    case RunGoalType.reachCombo40:
      return '$maxComboReached/40';
  }
}

MilestoneRewardResult evaluateMilestoneReward({
  required int loop,
  required Set<int> claimedMilestones,
  int rewardGoldPerMilestone = 3,
  List<int> milestoneLoops = kRunMilestoneLoops,
}) {
  final reached = <int>[];
  for (final milestone in milestoneLoops) {
    if (loop >= milestone && !claimedMilestones.contains(milestone)) {
      reached.add(milestone);
    }
  }
  return MilestoneRewardResult(
    reachedLoops: reached,
    rewardGold: reached.length * rewardGoldPerMilestone,
  );
}
