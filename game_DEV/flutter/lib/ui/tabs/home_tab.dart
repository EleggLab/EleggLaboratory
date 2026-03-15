import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';

import '../../data/catalog_data.dart';
import '../../data/meta_catalog.dart';
import '../../models/daily_missions_data.dart';
import '../../models/game_options.dart';
import '../../models/meta_upgrades_data.dart';
import '../../models/run_record_data.dart';
import '../../services/replay_storage_service.dart';
import '../../state/app_state.dart';
import '../i18n/ui_text.dart';
import '../screens/game_screen.dart';
import '../theme/app_tokens.dart';
import '../widgets/avatar_placeholder.dart';
import '../widgets/app_toast.dart';
import '../widgets/game_card.dart';
import '../widgets/hub_chrome.dart';
import '../widgets/press_scale.dart';
import '../widgets/primary_button.dart';
import '../widgets/skin_asset.dart';
import '../widgets/ui_feedback.dart';

class HomeTab extends StatelessWidget {
  const HomeTab({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final bestCharacter = GameCatalog.characterById(
      appState.bestLoopCharacterId,
    );
    final bestScoreCharacter = GameCatalog.characterById(
      appState.bestScoreCharacterId,
    );
    final selectedCharacter = GameCatalog.characterById(
      appState.selectedCharacterId,
    );
    final theme = Theme.of(context);
    final options = appState.gameOptions;
    String t(String ko, String en) => trByLanguage(options, ko: ko, en: en);

    return SafeArea(
      top: false,
      child: Padding(
        padding: AppTokens.pagePadding,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Row(
              children: <Widget>[
                Expanded(
                  child: Text(
                    t('\ub300\uc2dc\ubcf4\ub4dc', 'Dashboard'),
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppTokens.space12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surface.withValues(alpha: 0.78),
                    borderRadius: BorderRadius.circular(AppTokens.radiusPill),
                    border: Border.all(
                      color: theme.colorScheme.outlineVariant.withValues(
                        alpha: 0.6,
                      ),
                    ),
                  ),
                  child: Text(
                    t('\uc900\ube44 \uc644\ub8cc', 'Ready'),
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppTokens.space12),
            Expanded(
              child: ListView(
                children: <Widget>[
                  _BestRecordCard(
                    bestLoop: appState.bestLoop,
                    bestCharacterName: bestCharacter.name,
                    bestCharacterId: bestCharacter.id,
                    bestCharacterIcon: bestCharacter.icon,
                    bestScore: appState.bestScore,
                    bestScoreCharacterName: bestScoreCharacter.name,
                    bestScoreCharacterId: bestScoreCharacter.id,
                    bestScoreCharacterIcon: bestScoreCharacter.icon,
                    options: options,
                  ),
                  const SizedBox(height: AppTokens.space12),
                  _SelectedCharacterCard(characterId: selectedCharacter.id),
                  const SizedBox(height: AppTokens.space12),
                  _DailyMissionsCard(appState: appState),
                  const SizedBox(height: AppTokens.space12),
                  _WeeklyLeagueCard(appState: appState),
                  const SizedBox(height: AppTokens.space12),
                  _RecentRunsCard(
                    runs: appState.runHistory,
                    onViewAll: () => _showRunHistorySheet(
                      context,
                      appState,
                      appState.runHistory,
                    ),
                  ),
                  const SizedBox(height: AppTokens.space12),
                ],
              ),
            ),
            const SizedBox(height: AppTokens.space12),
            Row(
              children: <Widget>[
                Expanded(
                  child: SizedBox(
                    height: 48,
                    child: PrimaryButton.secondary(
                      label: t('\uc77c\uc77c \ub7f0', 'Daily Run'),
                      onPressed: () {
                        final seed = appState.dailySeedForDate(DateTime.now());
                        Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => GameScreen.daily(seed: seed),
                          ),
                        );
                      },
                    ),
                  ),
                ),
                if (appState.hasActiveRun) ...<Widget>[
                  const SizedBox(width: AppTokens.space8),
                  Expanded(
                    child: SizedBox(
                      height: 48,
                      child: PrimaryButton.secondary(
                        label: t('\uacc4\uc18d\ud558\uae30', 'Resume Run'),
                        onPressed: () {
                          final snapshot = appState.activeRunSnapshot;
                          if (snapshot == null) {
                            return;
                          }
                          Navigator.of(context).push(
                            MaterialPageRoute<void>(
                              builder: (_) =>
                                  GameScreen.resume(resumeData: snapshot),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                ],
              ],
            ),
            const SizedBox(height: AppTokens.space8),
            SizedBox(
              height: 52,
              child: PrimaryButton.secondary(
                label: t('\uc5c5\uadf8\ub808\uc774\ub4dc', 'Upgrades'),
                onPressed: () => _showUpgradesSheet(context),
              ),
            ),
            const SizedBox(height: AppTokens.space8),
            SizedBox(
              height: 52,
              child: PrimaryButton.secondary(
                label: t('\ucf54\uc2a4\uba54\ud2f1', 'Cosmetics'),
                onPressed: () => _showCosmeticsSheet(context),
              ),
            ),
            const SizedBox(height: AppTokens.space8),
            _StartRunButton(
              label: t('\ub7f0 \uc2dc\uc791', 'Start Run'),
              onPressed: () {
                final seed = appState.createClassicSeed();
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => GameScreen.classic(seed: seed),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _BestRecordCard extends StatelessWidget {
  const _BestRecordCard({
    required this.bestLoop,
    required this.bestCharacterName,
    required this.bestCharacterId,
    required this.bestCharacterIcon,
    required this.bestScore,
    required this.bestScoreCharacterName,
    required this.bestScoreCharacterId,
    required this.bestScoreCharacterIcon,
    required this.options,
  });

  final int bestLoop;
  final String bestCharacterName;
  final String bestCharacterId;
  final String bestCharacterIcon;
  final int bestScore;
  final String bestScoreCharacterName;
  final String bestScoreCharacterId;
  final String bestScoreCharacterIcon;
  final GameOptionsData options;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = theme.colorScheme;
    String t(String ko, String en) => trByLanguage(options, ko: ko, en: en);
    final loopLabel = bestLoop > 0 ? '$bestLoop' : '-';

    return GameCard(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Container(
            width: 94,
            padding: const EdgeInsets.all(AppTokens.space12),
            decoration: BoxDecoration(
              color: color.primaryContainer.withValues(alpha: 0.75),
              borderRadius: BorderRadius.circular(AppTokens.radiusCard),
              border: Border.all(color: color.primary.withValues(alpha: 0.28)),
            ),
            child: Column(
              children: <Widget>[
                OptionalAssetIcon(
                  assetPath: 'assets/icons/trophy.png',
                  fallbackIcon: Icons.emoji_events_rounded,
                  color: color.primary,
                  size: 30,
                ),
                const SizedBox(height: 8),
                GameTitleText(
                  text: loopLabel,
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontSize: 34,
                    height: 1,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: AppTokens.space12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  t('\ucd5c\uace0 \ub8e8\ud504', 'Best Loop'),
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: AppTokens.space8),
                Text(
                  bestLoop > 0
                      ? t(
                          '\uae30\ub85d \ub2ec\uc131 \uce90\ub9ad\ud130',
                          'Record holder',
                        )
                      : t(
                          '\uc544\uc9c1 \uae30\ub85d\uc774 \uc5c6\uc2b5\ub2c8\ub2e4',
                          'No record yet',
                        ),
                  style: theme.textTheme.bodySmall,
                ),
                const SizedBox(height: AppTokens.space8),
                Row(
                  children: <Widget>[
                    CharacterAvatar(
                      characterId: bestCharacterId,
                      fallbackLabel: bestCharacterIcon,
                      size: 30,
                      circular: true,
                      locked: bestLoop <= 0,
                    ),
                    const SizedBox(width: AppTokens.space8),
                    Expanded(
                      child: Text(
                        bestLoop > 0
                            ? bestCharacterName
                            : t(
                                '\ub7f0\uc744 \uc2dc\uc791\ud574 \ubcf4\uc138\uc694',
                                'Start a run now',
                              ),
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppTokens.space8),
                Text(
                  t('\ucd5c\uace0 \uc810\uc218', 'Best Score'),
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: <Widget>[
                    CharacterAvatar(
                      characterId: bestScoreCharacterId,
                      fallbackLabel: bestScoreCharacterIcon,
                      size: 24,
                      circular: true,
                      locked: bestScore <= 0,
                    ),
                    const SizedBox(width: AppTokens.space8),
                    Text(
                      bestScore > 0
                          ? '$bestScore ($bestScoreCharacterName)'
                          : '-',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

Future<void> _showUpgradesSheet(BuildContext context) async {
  UiFeedback.tap();
  await showModalBottomSheet<void>(
    context: context,
    useSafeArea: true,
    showDragHandle: true,
    isScrollControlled: true,
    builder: (sheetContext) => const _UpgradesSheet(),
  );
}

class _UpgradesSheet extends StatelessWidget {
  const _UpgradesSheet();

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final meta = appState.metaUpgrades;
    final entries = <_UpgradeEntry>[
      _UpgradeEntry(
        type: MetaUpgradeType.startGold,
        title: 'Start Gold',
        description: 'Run start gold +3 per level.',
      ),
      _UpgradeEntry(
        type: MetaUpgradeType.rerollDiscount,
        title: 'Reroll Discount',
        description: 'Shop reroll cost -1 per level (min 1).',
      ),
      _UpgradeEntry(
        type: MetaUpgradeType.extraShopSlot,
        title: 'Extra Shop Slot',
        description: '+1 shop slot per level.',
      ),
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppTokens.space16,
        AppTokens.space8,
        AppTokens.space16,
        AppTokens.space16,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          Text(
            'Meta Upgrades',
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: AppTokens.space8),
          Text(
            'Spend diamonds to improve future runs.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: AppTokens.space12),
          SizedBox(
            height: MediaQuery.of(context).size.height * 0.52,
            child: ListView.separated(
              itemCount: entries.length,
              separatorBuilder: (context, index) =>
                  const SizedBox(height: AppTokens.space8),
              itemBuilder: (_, index) {
                final entry = entries[index];
                final level = meta.levelFor(entry.type);
                final maxLevel = meta.maxLevelFor(entry.type);
                final maxed = meta.isMaxLevel(entry.type);
                final nextCost = maxed ? 0 : meta.nextCostFor(entry.type);
                final canBuy = !maxed && appState.diamonds >= nextCost;

                return Card(
                  margin: EdgeInsets.zero,
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Row(
                          children: <Widget>[
                            Expanded(
                              child: Text(
                                entry.title,
                                style: Theme.of(context).textTheme.titleMedium
                                    ?.copyWith(fontWeight: FontWeight.w800),
                              ),
                            ),
                            Text(
                              'Lv.$level/$maxLevel',
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(fontWeight: FontWeight.w700),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          entry.description,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                        const SizedBox(height: AppTokens.space8),
                        Row(
                          children: <Widget>[
                            Expanded(
                              child: Text(
                                maxed ? 'MAX' : 'Cost: $nextCost diamonds',
                                style: Theme.of(context).textTheme.bodyMedium
                                    ?.copyWith(fontWeight: FontWeight.w700),
                              ),
                            ),
                            SizedBox(
                              height: 38,
                              child: PrimaryButton(
                                label: maxed ? 'Max' : 'Buy',
                                onPressed: (!maxed && canBuy)
                                    ? () => appState.purchaseMetaUpgrade(
                                        entry.type,
                                      )
                                    : null,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _UpgradeEntry {
  const _UpgradeEntry({
    required this.type,
    required this.title,
    required this.description,
  });

  final MetaUpgradeType type;
  final String title;
  final String description;
}

Future<void> _showCosmeticsSheet(BuildContext context) async {
  UiFeedback.tap();
  await showModalBottomSheet<void>(
    context: context,
    useSafeArea: true,
    showDragHandle: true,
    isScrollControlled: true,
    builder: (_) => const _CosmeticsSheet(),
  );
}

class _CosmeticsSheet extends StatelessWidget {
  const _CosmeticsSheet();

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppTokens.space16,
        AppTokens.space8,
        AppTokens.space16,
        AppTokens.space16,
      ),
      child: SizedBox(
        height: MediaQuery.of(context).size.height * 0.64,
        child: ListView(
          children: <Widget>[
            Text(
              'Cosmetics',
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: AppTokens.space8),
            Text(
              'Achievements ${appState.unlockedAchievementIds.length}/${MetaCatalog.achievements.length}',
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: AppTokens.space8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: MetaCatalog.achievements.map((ach) {
                final unlocked = appState.isAchievementUnlocked(ach.id);
                return Chip(
                  avatar: Icon(
                    unlocked
                        ? Icons.verified_rounded
                        : Icons.lock_outline_rounded,
                    size: 16,
                  ),
                  label: Text(unlocked ? ach.title : 'Locked'),
                );
              }).toList(),
            ),
            const SizedBox(height: AppTokens.space12),
            _CosmeticGroup(
              title: 'Background',
              items: MetaCatalog.cosmeticsByCategory(
                CosmeticCategory.background,
              ),
              selectedId: appState.selectedBackgroundStyleId,
              isUnlocked: appState.isCosmeticUnlocked,
              onSelect: appState.selectBackgroundStyle,
            ),
            const SizedBox(height: AppTokens.space8),
            _CosmeticGroup(
              title: 'Block Skin',
              items: MetaCatalog.cosmeticsByCategory(
                CosmeticCategory.blockSkin,
              ),
              selectedId: appState.selectedBlockSkinStyleId,
              isUnlocked: appState.isCosmeticUnlocked,
              onSelect: appState.selectBlockSkinStyle,
            ),
            const SizedBox(height: AppTokens.space8),
            _CosmeticGroup(
              title: 'Ball Trail',
              items: MetaCatalog.cosmeticsByCategory(
                CosmeticCategory.ballTrail,
              ),
              selectedId: appState.selectedBallTrailStyleId,
              isUnlocked: appState.isCosmeticUnlocked,
              onSelect: appState.selectBallTrailStyle,
            ),
          ],
        ),
      ),
    );
  }
}

class _CosmeticGroup extends StatelessWidget {
  const _CosmeticGroup({
    required this.title,
    required this.items,
    required this.selectedId,
    required this.isUnlocked,
    required this.onSelect,
  });

  final String title;
  final List<CosmeticCatalogItem> items;
  final String selectedId;
  final bool Function(String) isUnlocked;
  final void Function(String) onSelect;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              title,
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: AppTokens.space8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: items.map((item) {
                final unlocked = isUnlocked(item.id);
                final selected = selectedId == item.id;
                return FilterChip(
                  label: Text(unlocked ? item.name : 'Locked'),
                  selected: selected,
                  onSelected: unlocked ? (_) => onSelect(item.id) : null,
                  avatar: unlocked
                      ? null
                      : const Icon(Icons.lock_rounded, size: 16),
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }
}

class _SelectedCharacterCard extends StatelessWidget {
  const _SelectedCharacterCard({required this.characterId});

  final String characterId;

  @override
  Widget build(BuildContext context) {
    final character = GameCatalog.characterById(characterId);
    final theme = Theme.of(context);

    return GameCard(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          CharacterAvatar(
            characterId: character.id,
            fallbackLabel: character.icon,
            size: 92,
            circular: true,
          ),
          const SizedBox(width: AppTokens.space12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  'Current Character',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: AppTokens.space8),
                Text(
                  character.name,
                  style: theme.textTheme.bodyLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  character.description,
                  style: theme.textTheme.bodyMedium,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: AppTokens.space8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.secondaryContainer.withValues(
                      alpha: 0.88,
                    ),
                    borderRadius: BorderRadius.circular(AppTokens.radiusButton),
                  ),
                  child: Text(
                    'Mana ${character.skillManaCost}',
                    style: theme.textTheme.bodySmall?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DailyMissionsCard extends StatelessWidget {
  const _DailyMissionsCard({required this.appState});

  final AppState appState;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final missions = appState.dailyMissions.missions;

    return GameCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              Expanded(
                child: Text(
                  'Daily Missions',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              Text(
                appState.dailyMissions.date,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppTokens.space8),
          if (missions.isEmpty)
            Text('No missions today.', style: theme.textTheme.bodyMedium)
          else
            ...missions.map((mission) {
              final canClaim = mission.completed && !mission.claimed;
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: <Widget>[
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text(
                            _dailyMissionLabel(mission),
                            style: theme.textTheme.bodyMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${mission.clampedProgress}/${mission.target}  Reward ${mission.rewardDiamonds} diamonds',
                            style: theme.textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                    SizedBox(
                      height: 34,
                      child: mission.claimed
                          ? PrimaryButton.secondary(
                              label: 'Claimed',
                              minHeight: 34,
                              expand: false,
                              onPressed: null,
                            )
                          : PrimaryButton(
                              label: canClaim ? 'Claim' : 'Progress',
                              minHeight: 34,
                              expand: false,
                              onPressed: canClaim
                                  ? () {
                                      UiFeedback.tap();
                                      appState.claimDailyMission(mission.id);
                                    }
                                  : null,
                            ),
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }

  String _dailyMissionLabel(DailyMissionData mission) {
    switch (mission.type) {
      case DailyMissionType.reachLoop:
        return 'Reach loop ${mission.target}';
      case DailyMissionType.maxCombo:
        return 'Reach combo ${mission.target}';
      case DailyMissionType.bombBreakBlocks:
        return 'Break ${mission.target} blocks with bombs';
      case DailyMissionType.bossClear:
        return 'Defeat ${mission.target} boss';
      case DailyMissionType.pickupBallPlus:
        return 'Collect Ball+1 ${mission.target} times';
      case DailyMissionType.completeDailyRun:
        return 'Complete Daily Run';
      case DailyMissionType.useRecall:
        return 'Use Recall ${mission.target} times';
      case DailyMissionType.shopPurchase:
        return 'Buy ${mission.target} items in shop';
      case DailyMissionType.useReroll:
        return 'Use reroll ${mission.target} time';
      case DailyMissionType.gainAugments:
        return 'Gain ${mission.target} augments in one run';
    }
  }
}

class _WeeklyLeagueCard extends StatelessWidget {
  const _WeeklyLeagueCard({required this.appState});

  final AppState appState;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final league = appState.weeklyLeague;
    final weeklySeed = appState.weeklySeedForDate(DateTime.now());
    return GameCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              const Icon(Icons.emoji_events_rounded, size: 20),
              const SizedBox(width: AppTokens.space8),
              Expanded(
                child: Text(
                  'Weekly League',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: theme.colorScheme.secondaryContainer.withValues(
                    alpha: 0.82,
                  ),
                  borderRadius: BorderRadius.circular(AppTokens.radiusPill),
                ),
                child: Text(
                  league.currentTier.name.toUpperCase(),
                  style: theme.textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppTokens.space8),
          Text(
            'Week ${league.currentWeekKey} · Best ${league.weeklyBestScore} · Attempts ${league.weeklyAttempts}',
            style: theme.textTheme.bodyMedium,
          ),
          const SizedBox(height: AppTokens.space8),
          Row(
            children: <Widget>[
              Expanded(
                child: Text(
                  'Seed $weeklySeed',
                  style: theme.textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              SizedBox(
                height: 34,
                child: PrimaryButton.secondary(
                  label: 'Copy',
                  minHeight: 34,
                  expand: false,
                  onPressed: () async {
                    await Clipboard.setData(ClipboardData(text: '$weeklySeed'));
                    if (!context.mounted) {
                      return;
                    }
                    AppToast.show(
                      context,
                      message: 'Weekly seed copied: $weeklySeed',
                      icon: Icons.content_copy_rounded,
                    );
                    UiFeedback.tap();
                  },
                ),
              ),
              const SizedBox(width: AppTokens.space8),
              SizedBox(
                height: 34,
                child: PrimaryButton(
                  label: 'Play Weekly',
                  minHeight: 34,
                  expand: false,
                  onPressed: () {
                    UiFeedback.tap();
                    Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => GameScreen.weekly(seed: weeklySeed),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _RecentRunsCard extends StatelessWidget {
  const _RecentRunsCard({required this.runs, required this.onViewAll});

  final List<RunRecordData> runs;
  final VoidCallback onViewAll;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final preview = runs.take(3).toList();

    return GameCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              Expanded(
                child: Text(
                  'Recent Runs',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              if (runs.isNotEmpty)
                SizedBox(
                  height: 34,
                  child: PrimaryButton.secondary(
                    label: 'View All',
                    minHeight: 34,
                    expand: false,
                    onPressed: () {
                      UiFeedback.tap();
                      onViewAll();
                    },
                  ),
                ),
            ],
          ),
          const SizedBox(height: AppTokens.space8),
          if (preview.isEmpty)
            Text('No run history yet.', style: theme.textTheme.bodyMedium)
          else
            ...preview.map((run) {
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: <Widget>[
                    Expanded(
                      child: Text(
                        '${run.mode.toUpperCase()}  S:${run.score}  L:${run.maxLoop}  Seed:${run.seed}',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    Text(
                      _shortDate(run.timestamp),
                      style: theme.textTheme.bodySmall,
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }
}

Future<void> _showRunHistorySheet(
  BuildContext context,
  AppState appState,
  List<RunRecordData> runs,
) async {
  await showModalBottomSheet<void>(
    context: context,
    useSafeArea: true,
    showDragHandle: true,
    isScrollControlled: true,
    builder: (sheetContext) {
      final theme = Theme.of(sheetContext);
      return SizedBox(
        height: MediaQuery.of(sheetContext).size.height * 0.76,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(
            AppTokens.space16,
            AppTokens.space8,
            AppTokens.space16,
            AppTokens.space16,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              Text(
                'Run History',
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: AppTokens.space12),
              Expanded(
                child: runs.isEmpty
                    ? Center(
                        child: Text(
                          'No runs yet.',
                          style: theme.textTheme.bodyMedium,
                        ),
                      )
                    : ListView.separated(
                        itemCount: runs.length,
                        separatorBuilder: (context, index) =>
                            const SizedBox(height: AppTokens.space8),
                        itemBuilder: (_, index) {
                          final run = runs[index];
                          final replayEntry = appState.replayByRunId(run.runId);
                          return Card(
                            margin: EdgeInsets.zero,
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: <Widget>[
                                  Text(
                                    '${run.mode.toUpperCase()}  Score ${run.score}',
                                    style: theme.textTheme.titleSmall?.copyWith(
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Loop ${run.maxLoop} · Boss ${run.bossesKilled} · Combo ${run.maxCombo} · Seed ${run.seed}${run.weekKey.isNotEmpty ? ' · Week ${run.weekKey}' : ''}',
                                    style: theme.textTheme.bodySmall,
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    _shortDateTime(run.timestamp),
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      color: theme.colorScheme.onSurfaceVariant,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Wrap(
                                    spacing: 8,
                                    runSpacing: 8,
                                    children: <Widget>[
                                      SizedBox(
                                        height: 34,
                                        child: PrimaryButton.secondary(
                                          label: 'Copy Seed',
                                          minHeight: 34,
                                          expand: false,
                                          onPressed: () async {
                                            await Clipboard.setData(
                                              ClipboardData(
                                                text: '${run.seed}',
                                              ),
                                            );
                                            if (sheetContext.mounted) {
                                              context
                                                  .read<AppState>()
                                                  .markSeedCopiedAchievement();
                                              AppToast.show(
                                                sheetContext,
                                                message:
                                                    'Seed copied: ${run.seed}',
                                                icon:
                                                    Icons.content_copy_rounded,
                                              );
                                            }
                                          },
                                        ),
                                      ),
                                      SizedBox(
                                        height: 34,
                                        child: PrimaryButton.secondary(
                                          label: 'Share',
                                          minHeight: 34,
                                          expand: false,
                                          onPressed: () async {
                                            final text =
                                                'Augment Brick Run\n'
                                                'Mode: ${run.mode}\n'
                                                '${run.weekKey.isNotEmpty ? 'Week: ${run.weekKey}\n' : ''}'
                                                'Seed: ${run.seed}\n'
                                                'Score: ${run.score}\n'
                                                'Loop: ${run.maxLoop}\n'
                                                'Bosses: ${run.bossesKilled}\n'
                                                'Max Combo: ${run.maxCombo}\n'
                                                'Augments: ${run.augmentCount}\n'
                                                'Character: ${run.characterId}';
                                            try {
                                              await SharePlus.instance.share(
                                                ShareParams(text: text),
                                              );
                                            } catch (_) {}
                                          },
                                        ),
                                      ),
                                      if (replayEntry != null)
                                        SizedBox(
                                          height: 34,
                                          child: PrimaryButton.secondary(
                                            label: 'Watch Replay',
                                            minHeight: 34,
                                            expand: false,
                                            onPressed: () async {
                                              final replay =
                                                  await ReplayStorageService
                                                      .instance
                                                      .loadReplay(
                                                        replayEntry.path,
                                                      );
                                              if (!sheetContext.mounted) {
                                                return;
                                              }
                                              if (replay == null) {
                                                AppToast.show(
                                                  sheetContext,
                                                  message:
                                                      'Replay file not found.',
                                                  icon: Icons
                                                      .info_outline_rounded,
                                                );
                                                return;
                                              }
                                              Navigator.of(sheetContext).pop();
                                              if (!context.mounted) {
                                                return;
                                              }
                                              Navigator.of(context).push(
                                                MaterialPageRoute<void>(
                                                  builder: (_) =>
                                                      GameScreen.replay(
                                                        replay: replay,
                                                      ),
                                                ),
                                              );
                                            },
                                          ),
                                        ),
                                      SizedBox(
                                        height: 34,
                                        child: PrimaryButton(
                                          label: 'Start with Seed',
                                          minHeight: 34,
                                          expand: false,
                                          onPressed: () {
                                            Navigator.of(sheetContext).pop();
                                            Navigator.of(context).push(
                                              MaterialPageRoute<void>(
                                                builder: (_) =>
                                                    run.mode == 'daily'
                                                    ? GameScreen.daily(
                                                        seed: run.seed,
                                                      )
                                                    : run.mode == 'weekly'
                                                    ? GameScreen.weekly(
                                                        seed: run.seed,
                                                      )
                                                    : GameScreen.classic(
                                                        seed: run.seed,
                                                      ),
                                              ),
                                            );
                                          },
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      );
    },
  );
}

String _shortDate(DateTime date) {
  final month = date.month.toString().padLeft(2, '0');
  final day = date.day.toString().padLeft(2, '0');
  return '$month/$day';
}

String _shortDateTime(DateTime date) {
  final month = date.month.toString().padLeft(2, '0');
  final day = date.day.toString().padLeft(2, '0');
  final hour = date.hour.toString().padLeft(2, '0');
  final minute = date.minute.toString().padLeft(2, '0');
  return '${date.year}-$month-$day $hour:$minute';
}

class _StartRunButton extends StatelessWidget {
  const _StartRunButton({required this.onPressed, required this.label});

  final VoidCallback onPressed;
  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return PressScale(
      child: Material(
        color: Colors.transparent,
        child: Ink(
          height: 66,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: <Color>[
                theme.colorScheme.primary,
                theme.colorScheme.primary.withValues(alpha: 0.92),
                theme.colorScheme.secondary.withValues(alpha: 0.88),
              ],
            ),
            borderRadius: BorderRadius.circular(AppTokens.radiusButton),
            boxShadow: <BoxShadow>[
              BoxShadow(
                color: theme.colorScheme.primary.withValues(alpha: 0.18),
                blurRadius: 14,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: InkWell(
            borderRadius: BorderRadius.circular(AppTokens.radiusButton),
            onTap: () {
              UiFeedback.tap();
              onPressed();
            },
            child: Stack(
              children: <Widget>[
                Positioned.fill(
                  child: IgnorePointer(
                    child: Opacity(
                      opacity: 0.12,
                      child: Image.asset(
                        'assets/patterns/bg_pattern.png',
                        repeat: ImageRepeat.repeat,
                        errorBuilder: (_, _, _) => const SizedBox.shrink(),
                      ),
                    ),
                  ),
                ),
                Center(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: <Widget>[
                      const Icon(
                        Icons.play_circle_fill_rounded,
                        color: Colors.white,
                        size: 24,
                      ),
                      const SizedBox(width: AppTokens.space8),
                      Text(
                        label,
                        style: theme.textTheme.titleMedium?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(width: AppTokens.space8),
                      const Icon(
                        Icons.arrow_forward_rounded,
                        color: Colors.white,
                        size: 18,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
