import '../models/weekly_league_data.dart';

class LeagueCatalog {
  static const List<LeagueTierRule> _defaultRules = <LeagueTierRule>[
    LeagueTierRule(tier: WeeklyTier.bronze, promoteScore: 5000, demoteScore: 0),
    LeagueTierRule(
      tier: WeeklyTier.silver,
      promoteScore: 11000,
      demoteScore: 3000,
    ),
    LeagueTierRule(
      tier: WeeklyTier.gold,
      promoteScore: 18000,
      demoteScore: 8000,
    ),
    LeagueTierRule(
      tier: WeeklyTier.platinum,
      promoteScore: 26000,
      demoteScore: 14000,
    ),
    LeagueTierRule(
      tier: WeeklyTier.diamond,
      promoteScore: 999999999,
      demoteScore: 22000,
    ),
  ];

  static List<LeagueTierRule> _rules = List<LeagueTierRule>.from(_defaultRules);

  static List<LeagueTierRule> get rules => _rules;

  static void applyRules(List<LeagueTierRule> custom) {
    if (custom.isEmpty) {
      _rules = List<LeagueTierRule>.from(_defaultRules);
      return;
    }
    final byTier = <WeeklyTier, LeagueTierRule>{
      for (final rule in _defaultRules) rule.tier: rule,
    };
    for (final rule in custom) {
      byTier[rule.tier] = rule;
    }
    _rules = WeeklyTier.values
        .map((tier) => byTier[tier]!)
        .toList(growable: false);
  }

  static LeagueTierRule ruleFor(WeeklyTier tier) {
    return _rules.firstWhere(
      (rule) => rule.tier == tier,
      orElse: () => _defaultRules.firstWhere((rule) => rule.tier == tier),
    );
  }
}
