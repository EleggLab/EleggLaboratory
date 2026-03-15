import 'package:flutter/material.dart';

import '../theme/app_tokens.dart';
import 'diamond_header.dart';
import 'hub_chrome.dart';

class AppScaffold extends StatelessWidget {
  const AppScaffold({
    super.key,
    required this.title,
    required this.body,
    required this.currentIndex,
    required this.onTabSelected,
    required this.onOpenOptions,
    required this.adRewardLabel,
    required this.homeLabel,
    required this.codexLabel,
    this.subtitle,
  });

  final String title;
  final String? subtitle;
  final Widget body;
  final int currentIndex;
  final ValueChanged<int> onTabSelected;
  final VoidCallback onOpenOptions;
  final String adRewardLabel;
  final String homeLabel;
  final String codexLabel;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Tooltip(
          message: subtitle ?? title,
          child: GameHubHeaderTitle(pageTitle: title),
        ),
        actions: <Widget>[
          const DiamondHeader(),
          TopRightHubIcon(onPressed: onOpenOptions),
          const SizedBox(width: 4),
        ],
      ),
      body: Stack(
        fit: StackFit.expand,
        children: <Widget>[const HubBackground(), body],
      ),
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.fromLTRB(
          AppTokens.space8,
          0,
          AppTokens.space8,
          AppTokens.space8,
        ),
        child: NavigationBar(
          selectedIndex: currentIndex,
          onDestinationSelected: onTabSelected,
          destinations: <NavigationDestination>[
            NavigationDestination(
              icon: Icon(Icons.play_circle_fill_rounded),
              label: adRewardLabel,
            ),
            NavigationDestination(
              icon: Icon(Icons.home_rounded),
              label: homeLabel,
            ),
            NavigationDestination(
              icon: Icon(Icons.menu_book_rounded),
              label: codexLabel,
            ),
          ],
          height: 72,
          labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        ),
      ),
    );
  }
}
