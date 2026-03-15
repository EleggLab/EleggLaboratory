import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../data/catalog_data.dart';
import '../../data/meta_catalog.dart';
import '../../models/augment_data.dart';
import '../../models/boss_data.dart';
import '../../models/character_data.dart';
import '../../models/game_options.dart';
import '../../state/app_state.dart';
import '../i18n/ui_text.dart';
import '../theme/app_tokens.dart';
import '../widgets/app_toast.dart';
import '../widgets/avatar_placeholder.dart';
import '../widgets/game_card.dart';
import '../widgets/primary_button.dart';
import '../widgets/skin_asset.dart';
import 'codex_hint_rules.dart';

enum _CodexSection { character, boss, augment, achievement }

class CodexTab extends StatefulWidget {
  const CodexTab({super.key});

  @override
  State<CodexTab> createState() => _CodexTabState();
}

class _CodexTabState extends State<CodexTab> {
  _CodexSection _section = _CodexSection.character;

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final options = appState.gameOptions;
    String t(String ko, String en) => trByLanguage(options, ko: ko, en: en);

    return SafeArea(
      top: false,
      child: Padding(
        padding: AppTokens.pagePadding,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            SegmentedButton<_CodexSection>(
              segments: <ButtonSegment<_CodexSection>>[
                ButtonSegment<_CodexSection>(
                  value: _CodexSection.character,
                  label: Text(t('\uce90\ub9ad\ud130', 'Character')),
                  icon: Icon(Icons.groups_rounded),
                ),
                ButtonSegment<_CodexSection>(
                  value: _CodexSection.boss,
                  label: Text(t('\ubcf4\uc2a4', 'Boss')),
                  icon: Icon(Icons.shield_rounded),
                ),
                ButtonSegment<_CodexSection>(
                  value: _CodexSection.augment,
                  label: Text(t('\uc99d\uac15', 'Augment')),
                  icon: Icon(Icons.auto_awesome_rounded),
                ),
                ButtonSegment<_CodexSection>(
                  value: _CodexSection.achievement,
                  label: Text(t('\uc5c5\uc801', 'Achievement')),
                  icon: Icon(Icons.workspace_premium_rounded),
                ),
              ],
              selected: <_CodexSection>{_section},
              onSelectionChanged: (selection) {
                if (selection.isEmpty) {
                  return;
                }
                setState(() {
                  _section = selection.first;
                });
              },
            ),
            const SizedBox(height: AppTokens.space12),
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 220),
                reverseDuration: const Duration(milliseconds: 170),
                transitionBuilder: (child, animation) {
                  final curved = CurvedAnimation(
                    parent: animation,
                    curve: Curves.easeOutCubic,
                    reverseCurve: Curves.easeInCubic,
                  );
                  return FadeTransition(
                    opacity: curved,
                    child: SlideTransition(
                      position: Tween<Offset>(
                        begin: const Offset(0.02, 0),
                        end: Offset.zero,
                      ).animate(curved),
                      child: child,
                    ),
                  );
                },
                child: KeyedSubtree(
                  key: ValueKey<_CodexSection>(_section),
                  child: switch (_section) {
                    _CodexSection.character => _buildCharacterGrid(
                      context,
                      appState,
                      options,
                    ),
                    _CodexSection.boss => _buildBossGrid(
                      context,
                      appState,
                      options,
                    ),
                    _CodexSection.augment => _buildAugmentGrid(
                      context,
                      appState,
                      options,
                    ),
                    _CodexSection.achievement => _buildAchievementList(
                      context,
                      appState,
                      options,
                    ),
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCharacterGrid(
    BuildContext context,
    AppState appState,
    GameOptionsData options,
  ) {
    String t(String ko, String en) => trByLanguage(options, ko: ko, en: en);
    return GridView.builder(
      itemCount: GameCatalog.characters.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: AppTokens.space12,
        mainAxisSpacing: AppTokens.space12,
        childAspectRatio: 0.84,
      ),
      itemBuilder: (context, index) {
        final character = GameCatalog.characters[index];
        final unlocked = appState.unlockedCharacterIds.contains(character.id);
        final selected = appState.selectedCharacterId == character.id;

        return _CodexTile(
          title: unlocked ? character.name : '???',
          subtitle: unlocked
              ? (selected
                    ? t('\uc7a5\ucc29 \uc911', 'Equipped')
                    : t('\ubcf4\uc720 \uc911', 'Owned'))
              : t('\uc7a0\uae40', 'Locked'),
          isLocked: !unlocked,
          avatar: CharacterAvatar(
            characterId: character.id,
            fallbackLabel: character.icon,
            locked: !unlocked,
            size: 72,
          ),
          onTap: () => _showCharacterSheet(context, character),
        );
      },
    );
  }

  Widget _buildBossGrid(
    BuildContext context,
    AppState appState,
    GameOptionsData options,
  ) {
    String t(String ko, String en) => trByLanguage(options, ko: ko, en: en);
    return GridView.builder(
      itemCount: GameCatalog.bosses.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: AppTokens.space12,
        mainAxisSpacing: AppTokens.space12,
        childAspectRatio: 0.84,
      ),
      itemBuilder: (context, index) {
        final boss = GameCatalog.bosses[index];
        final seen = appState.codexSeenBossIds.contains(boss.id);

        return _CodexTile(
          title: seen ? boss.name : '???',
          subtitle: seen
              ? '${_tierText(boss.tier)} - ${boss.width}x${boss.height}'
              : t('\uc7a0\uae40', 'Locked'),
          isLocked: !seen,
          avatar: AvatarPlaceholder(
            label: seen ? boss.icon : '?',
            locked: !seen,
            size: 72,
          ),
          onTap: () => _showBossSheet(context, boss, seen),
        );
      },
    );
  }

  Widget _buildAugmentGrid(
    BuildContext context,
    AppState appState,
    GameOptionsData options,
  ) {
    String t(String ko, String en) => trByLanguage(options, ko: ko, en: en);
    return GridView.builder(
      itemCount: GameCatalog.augments.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: AppTokens.space12,
        mainAxisSpacing: AppTokens.space12,
        childAspectRatio: 0.84,
      ),
      itemBuilder: (context, index) {
        final augment = GameCatalog.augments[index];
        final seen = appState.codexSeenAugmentIds.contains(augment.id);

        return _CodexTile(
          title: seen ? augment.name : '???',
          subtitle: seen
              ? t('\ud655\uc778\ub428', 'Discovered')
              : t('\uc7a0\uae40', 'Locked'),
          isLocked: !seen,
          avatar: AvatarPlaceholder(
            label: seen ? augment.icon : '?',
            locked: !seen,
            size: 72,
          ),
          onTap: () => _showAugmentSheet(context, augment, seen),
        );
      },
    );
  }

  Widget _buildAchievementList(
    BuildContext context,
    AppState appState,
    GameOptionsData options,
  ) {
    String t(String ko, String en) => trByLanguage(options, ko: ko, en: en);
    return ListView.separated(
      itemCount: MetaCatalog.achievements.length,
      separatorBuilder: (_, index) => const SizedBox(height: AppTokens.space8),
      itemBuilder: (context, index) {
        final achievement = MetaCatalog.achievements[index];
        final unlocked = appState.isAchievementUnlocked(achievement.id);
        final claimed = appState.isAchievementClaimed(achievement.id);
        final reward = achievement.rewardDiamonds;
        return GameCard(
          onTap: () => _showAchievementSheet(context, achievement),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              AvatarPlaceholder(
                label: unlocked ? 'A' : '?',
                locked: !unlocked,
                size: 54,
              ),
              const SizedBox(width: AppTokens.space12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      unlocked ? achievement.title : '???',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      unlocked
                          ? achievement.description
                          : (achievement.unlockHint.isEmpty
                                ? t(
                                    '\uc870\uac74\uc744 \ub2ec\uc131\ud558\uba74 \ud574\uae08\ub429\ub2c8\ub2e4.',
                                    'Unlock by meeting the condition.',
                                  )
                                : achievement.unlockHint),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: <Widget>[
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            color: Theme.of(context)
                                .colorScheme
                                .primaryContainer
                                .withValues(alpha: 0.65),
                            borderRadius: BorderRadius.circular(
                              AppTokens.radiusPill,
                            ),
                          ),
                          child: Text(
                            t(
                              '\ubcf4\uc0c1 \ub2e4\uc774\uc544 +$reward',
                              'Reward +$reward',
                            ),
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(fontWeight: FontWeight.w700),
                          ),
                        ),
                        const Spacer(),
                        if (claimed)
                          Text(
                            t('\uc218\ub839\uc644\ub8cc', 'Claimed'),
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(fontWeight: FontWeight.w800),
                          )
                        else if (!unlocked)
                          Text(
                            t('\uc7a0\uae40', 'Locked'),
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(fontWeight: FontWeight.w700),
                          )
                        else
                          SizedBox(
                            height: 34,
                            child: PrimaryButton(
                              label: t('\uc218\ub839', 'Claim'),
                              minHeight: 34,
                              expand: false,
                              onPressed: () {
                                final ok = appState.claimAchievement(
                                  achievement.id,
                                );
                                if (!ok) {
                                  return;
                                }
                                AppToast.show(
                                  context,
                                  message: t(
                                    '\uc5c5\uc801 \ubcf4\uc0c1 \uc218\ub839: \ub2e4\uc774\uc544 +$reward',
                                    'Achievement reward claimed: +$reward diamonds',
                                  ),
                                  icon: Icons.check_circle_rounded,
                                );
                              },
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
      },
    );
  }

  Future<void> _showCharacterSheet(
    BuildContext context,
    CharacterData character,
  ) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      showDragHandle: true,
      builder: (sheetContext) {
        return Consumer<AppState>(
          builder: (context, appState, child) {
            final unlocked = appState.unlockedCharacterIds.contains(
              character.id,
            );
            final selected = appState.selectedCharacterId == character.id;
            return Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: <Widget>[
                  Center(
                    child: CharacterAvatar(
                      characterId: character.id,
                      fallbackLabel: character.icon,
                      size: 112,
                      locked: !unlocked,
                      circular: true,
                    ),
                  ),
                  const SizedBox(height: AppTokens.space16),
                  Text(
                    unlocked ? character.name : 'Locked Character',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: AppTokens.space8),
                  Text(
                    unlocked
                        ? character.description
                        : 'Unlock with 1 diamond to use this character.',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: AppTokens.space8),
                  Text(
                    'Mana Cost: ${character.skillManaCost}',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const SizedBox(height: AppTokens.space16),
                  if (!unlocked)
                    PrimaryButton(
                      label: trByLanguage(
                        appState.gameOptions,
                        ko: '\ud574\uae08 (1 \ub2e4\uc774\uc544)',
                        en: 'Unlock (1 diamond)',
                      ),
                      onPressed: () {
                        final success = appState.unlockCharacter(character.id);
                        if (!success) {
                          AppToast.show(
                            context,
                            message: trByLanguage(
                              appState.gameOptions,
                              ko: '\ub2e4\uc774\uc544\uac00 \ubd80\uc871\ud569\ub2c8\ub2e4.',
                              en: 'Not enough diamonds.',
                            ),
                            icon: Icons.error_outline_rounded,
                          );
                          return;
                        }
                        AppToast.show(
                          context,
                          message: trByLanguage(
                            appState.gameOptions,
                            ko: '${character.name} \ud574\uae08 \uc644\ub8cc.',
                            en: '${character.name} unlocked.',
                          ),
                          icon: Icons.check_circle_rounded,
                        );
                      },
                    )
                  else
                    PrimaryButton(
                      label: selected
                          ? trByLanguage(
                              appState.gameOptions,
                              ko: '\uc7a5\ucc29 \uc911',
                              en: 'Equipped',
                            )
                          : trByLanguage(
                              appState.gameOptions,
                              ko: '\uc7a5\ucc29',
                              en: 'Equip',
                            ),
                      onPressed: selected
                          ? null
                          : () {
                              appState.selectCharacter(character.id);
                              Navigator.of(sheetContext).pop();
                            },
                    ),
                  const SizedBox(height: AppTokens.space8),
                  PrimaryButton.secondary(
                    label: trByLanguage(
                      appState.gameOptions,
                      ko: '\ub2eb\uae30',
                      en: 'Close',
                    ),
                    onPressed: () => Navigator.of(sheetContext).pop(),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _showBossSheet(
    BuildContext context,
    BossCodexData boss,
    bool seen,
  ) async {
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      useSafeArea: true,
      builder: (sheetContext) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              Center(
                child: AvatarPlaceholder(
                  label: seen ? boss.icon : '?',
                  size: 112,
                  locked: !seen,
                  circular: true,
                ),
              ),
              const SizedBox(height: AppTokens.space16),
              Text(
                seen ? boss.name : 'Locked Boss',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: AppTokens.space8),
              Text(
                seen
                    ? boss.description
                    : codexBossLockHint(
                        boss: boss,
                        language: context
                            .read<AppState>()
                            .gameOptions
                            .uiLanguage,
                      ),
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: AppTokens.space8),
              Text(
                '${_tierText(boss.tier)} - ${boss.width}x${boss.height}',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall,
              ),
              const SizedBox(height: AppTokens.space16),
              PrimaryButton.secondary(
                label: trByLanguage(
                  context.read<AppState>().gameOptions,
                  ko: '\ub2eb\uae30',
                  en: 'Close',
                ),
                onPressed: () => Navigator.of(sheetContext).pop(),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _showAugmentSheet(
    BuildContext context,
    AugmentData augment,
    bool seen,
  ) async {
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      useSafeArea: true,
      builder: (sheetContext) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              Center(
                child: AvatarPlaceholder(
                  label: seen ? augment.icon : '?',
                  size: 112,
                  locked: !seen,
                  circular: true,
                ),
              ),
              const SizedBox(height: AppTokens.space16),
              Text(
                seen ? augment.name : 'Locked Augment',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: AppTokens.space8),
              Text(
                seen
                    ? augment.description
                    : codexAugmentLockHint(
                        augment: augment,
                        language: context
                            .read<AppState>()
                            .gameOptions
                            .uiLanguage,
                      ),
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: AppTokens.space16),
              PrimaryButton.secondary(
                label: trByLanguage(
                  context.read<AppState>().gameOptions,
                  ko: '\ub2eb\uae30',
                  en: 'Close',
                ),
                onPressed: () => Navigator.of(sheetContext).pop(),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _showAchievementSheet(
    BuildContext context,
    AchievementCatalogItem achievement,
  ) async {
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      useSafeArea: true,
      builder: (sheetContext) {
        return Consumer<AppState>(
          builder: (context, appState, child) {
            final unlocked = appState.isAchievementUnlocked(achievement.id);
            final claimed = appState.isAchievementClaimed(achievement.id);
            final options = appState.gameOptions;
            String t(String ko, String en) =>
                trByLanguage(options, ko: ko, en: en);
            return Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: <Widget>[
                  Center(
                    child: AvatarPlaceholder(
                      label: unlocked ? 'A' : '?',
                      locked: !unlocked,
                      size: 108,
                      circular: true,
                    ),
                  ),
                  const SizedBox(height: AppTokens.space16),
                  Text(
                    unlocked ? achievement.title : 'Locked Achievement',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: AppTokens.space8),
                  Text(
                    unlocked
                        ? achievement.description
                        : (achievement.unlockHint.isEmpty
                              ? t(
                                  '\uc870\uac74\uc744 \ub2ec\uc131\ud558\uba74 \ud574\uae08\ub429\ub2c8\ub2e4.',
                                  'Unlock by meeting the condition.',
                                )
                              : achievement.unlockHint),
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: AppTokens.space8),
                  Text(
                    t(
                      '\ubcf4\uc0c1: \ub2e4\uc774\uc544 +${achievement.rewardDiamonds}',
                      'Reward: +${achievement.rewardDiamonds} diamonds',
                    ),
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const SizedBox(height: AppTokens.space16),
                  if (!unlocked || claimed)
                    PrimaryButton(
                      label: claimed
                          ? t('\uc218\ub839\uc644\ub8cc', 'Claimed')
                          : t('\uc7a0\uae40', 'Locked'),
                      onPressed: null,
                    )
                  else
                    PrimaryButton(
                      label: t('\ubcf4\uc0c1 \uc218\ub839', 'Claim Reward'),
                      onPressed: () {
                        final ok = appState.claimAchievement(achievement.id);
                        if (!ok) {
                          return;
                        }
                        AppToast.show(
                          context,
                          message: t(
                            '\ub2e4\uc774\uc544 +${achievement.rewardDiamonds} \uc218\ub839',
                            'Claimed +${achievement.rewardDiamonds} diamonds',
                          ),
                          icon: Icons.check_circle_rounded,
                        );
                        Navigator.of(sheetContext).pop();
                      },
                    ),
                  const SizedBox(height: AppTokens.space8),
                  PrimaryButton.secondary(
                    label: t('\ub2eb\uae30', 'Close'),
                    onPressed: () => Navigator.of(sheetContext).pop(),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  String _tierText(BossTier tier) {
    switch (tier) {
      case BossTier.weak:
        return 'Weak';
      case BossTier.medium:
        return 'Medium';
      case BossTier.strong:
        return 'Strong';
    }
  }
}

class _CodexTile extends StatelessWidget {
  const _CodexTile({
    required this.title,
    required this.subtitle,
    required this.isLocked,
    required this.avatar,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final bool isLocked;
  final Widget avatar;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GameCard(
      onTap: onTap,
      padding: const EdgeInsets.all(12),
      backgroundColor: isLocked
          ? Theme.of(context).colorScheme.surfaceContainerHigh
          : null,
      child: Stack(
        children: <Widget>[
          if (isLocked)
            Positioned.fill(
              child: IgnorePointer(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(AppTokens.radiusCard),
                  ),
                ),
              ),
            ),
          Positioned.fill(
            child: IgnorePointer(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: <Color>[
                      Colors.white.withValues(alpha: 0.2),
                      Colors.white.withValues(alpha: 0.02),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(AppTokens.radiusCard),
                ),
              ),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: <Widget>[
              const SizedBox(height: 2),
              Expanded(child: Center(child: avatar)),
              const SizedBox(height: AppTokens.space8),
              Text(
                title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
          if (isLocked)
            Positioned(
              right: 0,
              top: 0,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                decoration: BoxDecoration(
                  color: Theme.of(
                    context,
                  ).colorScheme.surface.withValues(alpha: 0.9),
                  borderRadius: BorderRadius.circular(AppTokens.radiusPill),
                ),
                child: OptionalAssetIcon(
                  assetPath: 'assets/icons/lock.png',
                  fallbackIcon: Icons.lock_rounded,
                  size: 14,
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
