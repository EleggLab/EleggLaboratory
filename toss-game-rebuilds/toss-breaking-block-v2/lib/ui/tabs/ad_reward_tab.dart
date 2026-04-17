import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../state/app_state.dart';

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

    return SafeArea(
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: 5,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final claimed = rewards.claimedFlags[index];
          final claimable = appState.canClaimDailyRewardStep(index);
          final isLocked = !claimed && !claimable;

          return Card(
            color: claimed
                ? Colors.green.shade100
                : isLocked
                    ? Colors.grey.shade200
                    : null,
            child: ListTile(
              title: Text('${index + 1}단계 보상'),
              subtitle: Text(claimed
                  ? '수령 완료'
                  : isLocked
                      ? '이전 단계를 먼저 수령하세요'
                      : '다이아 10개'),
              trailing: _buildActionButton(
                context: context,
                stepIndex: index,
                claimed: claimed,
                claimable: claimable,
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildActionButton({
    required BuildContext context,
    required int stepIndex,
    required bool claimed,
    required bool claimable,
  }) {
    if (claimed) {
      return const Chip(label: Text('완료'));
    }

    return FilledButton(
      onPressed: claimable
          ? () async {
              final appState = context.read<AppState>();
              final accepted = await appState.adService.showRewardedAd(
                context: context,
                placement: 'daily_reward_${stepIndex + 1}',
                rewardText: '다이아 10개',
              );
              if (!accepted) {
                return;
              }
              final success = appState.claimDailyRewardStep(stepIndex);
              if (!mounted) {
                return;
              }
              if (success) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('${stepIndex + 1}단계 보상을 수령했습니다.')),
                );
              }
            }
          : null,
      child: Text(claimable ? '수령' : '잠김'),
    );
  }
}


