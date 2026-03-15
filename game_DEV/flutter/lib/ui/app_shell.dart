import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/game_options.dart';
import '../state/app_state.dart';
import 'tabs/ad_reward_tab.dart';
import 'tabs/codex_tab.dart';
import 'tabs/home_tab.dart';
import 'widgets/app_scaffold.dart';
import 'widgets/options_sheet.dart';
import 'widgets/ui_feedback.dart';

class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _currentIndex = 1;
  bool _weeklyNoticeChecked = false;
  late final List<Widget> _tabs = <Widget>[
    const AdRewardTab(),
    const HomeTab(),
    const CodexTab(),
  ];

  @override
  Widget build(BuildContext context) {
    final appState = context.read<AppState>();
    final options = context.select<AppState, GameOptionsData>(
      (state) => state.gameOptions,
    );
    UiFeedback.configure(
      sfxEnabled: options.sfxEnabled,
      vibrationEnabled: options.vibrationEnabled,
    );
    if (!_weeklyNoticeChecked) {
      _weeklyNoticeChecked = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) {
          return;
        }
        final message = context.read<AppState>().consumeWeeklyRolloverMessage();
        if (message.isEmpty) {
          return;
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(message),
            duration: const Duration(seconds: 2),
          ),
        );
      });
    }

    const subtitlesEn = <String>[
      'Claim daily rewards in sequence.',
      'Check records and start a run.',
      'Characters, bosses, and augments.',
    ];
    final isKo = options.uiLanguage == UiLanguage.ko;
    final titles = isKo
        ? const <String>['\uad11\uace0 \ubcf4\uc0c1', '\ud648', '\ub3c4\uac10']
        : const <String>['Ad Reward', 'Home', 'Codex'];
    final localizedSubtitles = isKo
        ? const <String>[
            '\ub9e4\uc77c 1~5\ub2e8\uacc4\ub97c \uc21c\uc11c\ub300\ub85c \uc218\ub839\ud558\uc138\uc694.',
            '\uae30\ub85d\uc744 \ud655\uc778\ud558\uace0 \ub7f0\uc744 \uc2dc\uc791\ud558\uc138\uc694.',
            '\uce90\ub9ad\ud130, \ubcf4\uc2a4, \uc99d\uac15 \uc815\ubcf4\ub97c \ud655\uc778\ud558\uc138\uc694.',
          ]
        : subtitlesEn;

    return AppScaffold(
      title: titles[_currentIndex],
      subtitle: localizedSubtitles[_currentIndex],
      body: _AnimatedHubTabHost(currentIndex: _currentIndex, children: _tabs),
      currentIndex: _currentIndex,
      adRewardLabel: titles[0],
      homeLabel: titles[1],
      codexLabel: titles[2],
      onOpenOptions: () {
        showOptionsSheet(context);
      },
      onTabSelected: (index) async {
        UiFeedback.tap();
        if (index == 0) {
          await appState.checkAndResetDailyRewards();
        }
        if (index == 1) {
          await appState.checkAndResetDailyMissions();
        }
        if (!mounted) {
          return;
        }
        setState(() {
          _currentIndex = index;
        });
      },
    );
  }
}

class _AnimatedHubTabHost extends StatelessWidget {
  const _AnimatedHubTabHost({
    required this.currentIndex,
    required this.children,
  });

  final int currentIndex;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 240),
      reverseDuration: const Duration(milliseconds: 180),
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
      child: RepaintBoundary(
        key: ValueKey<int>(currentIndex),
        child: children[currentIndex],
      ),
    );
  }
}
