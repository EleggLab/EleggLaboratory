import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/game_options.dart';
import '../../state/app_state.dart';
import '../i18n/ui_text.dart';
import '../theme/app_tokens.dart';
import '../widgets/app_toast.dart';
import '../widgets/game_card.dart';
import '../widgets/primary_button.dart';
import '../widgets/skin_asset.dart';

class AdRewardTab extends StatefulWidget {
  const AdRewardTab({super.key});

  @override
  State<AdRewardTab> createState() => _AdRewardTabState();
}

class _AdRewardTabState extends State<AdRewardTab> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) {
        return;
      }
      context.read<AppState>().checkAndResetDailyRewards();
    });
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final rewards = appState.dailyRewards;
    final theme = Theme.of(context);
    final options = appState.gameOptions;
    String t(String ko, String en) => trByLanguage(options, ko: ko, en: en);

    return SafeArea(
      top: false,
      child: ListView.separated(
        padding: AppTokens.pagePadding,
        itemCount: 6,
        separatorBuilder: (_, separatorIndex) =>
            const SizedBox(height: AppTokens.space12),
        itemBuilder: (context, index) {
          if (index == 0) {
            return GameCard(
              child: Row(
                children: <Widget>[
                  Icon(
                    Icons.task_alt_rounded,
                    color: theme.colorScheme.primary,
                  ),
                  const SizedBox(width: AppTokens.space8),
                  Expanded(
                    child: Text(
                      t(
                        '\uc77c\uc77c \ud038\uc2a4\ud2b8\ub294 \ub9e4\uc77c \ucd08\uae30\ud654\ub429\ub2c8\ub2e4. 1 -> 5 \uc21c\uc11c\ub85c \uc218\ub839\ud558\uc138\uc694.',
                        'Daily quest chain resets every day. Claim step 1 -> 5 in order.',
                      ),
                      style: theme.textTheme.bodyMedium,
                    ),
                  ),
                ],
              ),
            );
          }

          final stepIndex = index - 1;
          final step = stepIndex + 1;
          final claimed = rewards.claimedFlags[stepIndex];
          final claimable = appState.canClaimDailyRewardStep(stepIndex);
          final locked = !claimed && !claimable;

          final statusText = claimed
              ? t('\uc644\ub8cc', 'Completed')
              : claimable
              ? t('\uc218\ub839 \uac00\ub2a5', 'Claim available')
              : t(
                  '\uc774\uc804 \ub2e8\uacc4\ub97c \uba3c\uc800 \uc218\ub839\ud558\uc138\uc694',
                  'Claim previous step first',
                );
          final statusColor = claimed
              ? theme.colorScheme.tertiaryContainer
              : claimable
              ? theme.colorScheme.primaryContainer
              : theme.colorScheme.surfaceContainerHighest;

          return GameCard(
            backgroundColor: claimed
                ? theme.colorScheme.tertiaryContainer.withValues(alpha: 0.34)
                : null,
            child: Row(
              children: <Widget>[
                _StepBadge(step: step, claimed: claimed, locked: locked),
                const SizedBox(width: AppTokens.space12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text(
                        t(
                          '\ud038\uc2a4\ud2b8 $step\ub2e8\uacc4',
                          'Quest Step $step',
                        ),
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: <Widget>[
                          OptionalAssetIcon(
                            assetPath: 'assets/icons/diamond.png',
                            fallbackIcon: Icons.diamond_rounded,
                            size: 16,
                            color: theme.colorScheme.primary,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            t(
                              '\ubcf4\uc0c1 \ub2e4\uc774\uc544 x10',
                              'Reward Diamond x10',
                            ),
                            style: theme.textTheme.bodyMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      _StatusChip(text: statusText, color: statusColor),
                    ],
                  ),
                ),
                const SizedBox(width: AppTokens.space8),
                SizedBox(
                  width: 108,
                  child: _buildStatusAction(
                    appState: appState,
                    options: options,
                    stepIndex: stepIndex,
                    claimed: claimed,
                    claimable: claimable,
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatusAction({
    required AppState appState,
    required GameOptionsData options,
    required int stepIndex,
    required bool claimed,
    required bool claimable,
  }) {
    String t(String ko, String en) => trByLanguage(options, ko: ko, en: en);
    if (claimed) {
      return PrimaryButton.secondary(
        label: t('\uc644\ub8cc', 'Done'),
        minHeight: 46,
        onPressed: null,
      );
    }

    if (!claimable) {
      return PrimaryButton.secondary(
        label: t('\uc7a0\uae40', 'Locked'),
        minHeight: 46,
        onPressed: null,
      );
    }

    return PrimaryButton(
      label: t('\uc218\ub839', 'Claim'),
      minHeight: 46,
      onPressed: () => _claimRewardStep(appState, stepIndex),
    );
  }

  Future<void> _claimRewardStep(AppState appState, int stepIndex) async {
    final attempt = await appState.claimDailyRewardStepWithAd(
      context: context,
      stepIndex: stepIndex,
    );
    if (!mounted) {
      return;
    }
    if (attempt.claimed) {
      final options = appState.gameOptions;
      AppToast.show(
        context,
        message: trByLanguage(
          options,
          ko: '${stepIndex + 1}\ub2e8\uacc4 \ubcf4\uc0c1\uc744 \uc218\ub839\ud588\uc2b5\ub2c8\ub2e4.',
          en: 'Step ${stepIndex + 1} reward claimed.',
        ),
        icon: Icons.check_circle_rounded,
      );
      return;
    }
    final message = attempt.message;
    if (message != null && message.isNotEmpty) {
      AppToast.show(
        context,
        message: message,
        icon: Icons.info_outline_rounded,
      );
    }
  }
}

class _StepBadge extends StatelessWidget {
  const _StepBadge({
    required this.step,
    required this.claimed,
    required this.locked,
  });

  final int step;
  final bool claimed;
  final bool locked;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final bg = claimed
        ? theme.colorScheme.tertiary
        : locked
        ? theme.colorScheme.surfaceContainerHighest
        : theme.colorScheme.primaryContainer;
    final fg = claimed
        ? theme.colorScheme.onTertiary
        : locked
        ? theme.colorScheme.onSurfaceVariant
        : theme.colorScheme.onPrimaryContainer;

    return Container(
      width: 44,
      height: 44,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: bg,
        shape: BoxShape.circle,
        border: Border.all(
          color: theme.colorScheme.outlineVariant.withValues(alpha: 0.7),
        ),
      ),
      child: Text(
        '$step',
        style: theme.textTheme.labelLarge?.copyWith(
          color: fg,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.text, required this.color});

  final String text;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.92),
        borderRadius: BorderRadius.circular(AppTokens.radiusPill),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        child: Text(
          text,
          style: Theme.of(
            context,
          ).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w700),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ),
    );
  }
}
