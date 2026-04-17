import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/app_state.dart';
import 'tabs/ad_reward_tab.dart';
import 'tabs/codex_tab.dart';
import 'tabs/home_tab.dart';
import 'widgets/diamond_header.dart';

class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _currentIndex = 1;

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();

    const titles = <String>['광고보상', '홈', '도감'];
    final tabs = <Widget>[
      const AdRewardTab(),
      const HomeTab(),
      const CodexTab(),
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(titles[_currentIndex]),
        actions: const <Widget>[
          DiamondHeader(),
          SizedBox(width: 12),
        ],
      ),
      body: IndexedStack(index: _currentIndex, children: tabs),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) async {
          if (index == 0) {
            await appState.checkAndResetDailyRewards();
          }
          if (!mounted) {
            return;
          }
          setState(() {
            _currentIndex = index;
          });
        },
        items: const <BottomNavigationBarItem>[
          BottomNavigationBarItem(icon: Icon(Icons.play_circle_fill), label: '광고보상'),
          BottomNavigationBarItem(icon: Icon(Icons.home_filled), label: '홈'),
          BottomNavigationBarItem(icon: Icon(Icons.menu_book_rounded), label: '도감'),
        ],
      ),
    );
  }
}


