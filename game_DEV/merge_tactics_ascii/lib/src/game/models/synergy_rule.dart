enum SynergyType { race, job }

class SynergyRule {
  const SynergyRule({
    required this.type,
    required this.token,
    required this.displayName,
    required this.requiredCount,
    required this.effectText,
  });

  final SynergyType type;
  final String token;
  final String displayName;
  final int requiredCount;
  final String effectText;
}

class ActiveSynergy {
  const ActiveSynergy({required this.rule, required this.currentCount});

  final SynergyRule rule;
  final int currentCount;
}
