import 'package:flutter/material.dart';

import '../battle_pass/battle_pass_screen.dart';
import '../codex/codex_screen.dart';
import '../game/game_screen.dart';
import '../gacha/gacha_dialog.dart';
import '../lobby/lobby_screen.dart';
import 'player_profile.dart';

enum AppView { lobby, battle, codex, battlePass }

class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  final PlayerProfile _profile = PlayerProfile();
  AppView _currentView = AppView.lobby;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _profile,
      builder: (BuildContext context, Widget? child) {
        switch (_currentView) {
          case AppView.lobby:
            return LobbyScreen(
              profile: _profile,
              onStartBattle: () => _navigate(AppView.battle),
              onOpenCodex: () => _navigate(AppView.codex),
              onOpenBattlePass: () => _navigate(AppView.battlePass),
              onOpenGacha: () {
                showGachaDialog(context: context, profile: _profile);
              },
              onOpenSettings: _showSettings,
            );
          case AppView.battle:
            return GameScreen(
              profile: _profile,
              onExitToLobby: () => _navigate(AppView.lobby),
            );
          case AppView.codex:
            return CodexScreen(
              profile: _profile,
              onBack: () => _navigate(AppView.lobby),
            );
          case AppView.battlePass:
            return BattlePassScreen(
              profile: _profile,
              onBack: () => _navigate(AppView.lobby),
            );
        }
      },
    );
  }

  void _navigate(AppView target) {
    setState(() {
      _currentView = target;
    });
  }

  Future<void> _showSettings() async {
    await showDialog<void>(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('설정'),
          content: const Text('사운드/푸시/분석 도구 연결 스위치는 라이브 서비스 단계에서 확장됩니다.'),
          actions: <Widget>[
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('확인'),
            ),
          ],
        );
      },
    );
  }
}
