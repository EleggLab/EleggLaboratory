import 'package:flutter/material.dart';

import '../app/player_profile.dart';
import '../audio/sfx_service.dart';
import '../resources/resource_map.dart';

class LobbyScreen extends StatelessWidget {
  const LobbyScreen({
    super.key,
    required this.profile,
    required this.onStartBattle,
    required this.onOpenCodex,
    required this.onOpenBattlePass,
    required this.onOpenGacha,
    required this.onOpenSettings,
  });

  final PlayerProfile profile;
  final VoidCallback onStartBattle;
  final VoidCallback onOpenCodex;
  final VoidCallback onOpenBattlePass;
  final VoidCallback onOpenGacha;
  final VoidCallback onOpenSettings;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: <Widget>[
          Container(color: const Color(0xFF0C1724)),
          Opacity(
            opacity: 0.30,
            child: Image.asset(
              ResourceMap.lobbyPattern,
              fit: BoxFit.cover,
              repeat: ImageRepeat.repeat,
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
              child: Column(
                children: <Widget>[
                  _LobbyTopBar(profile: profile),
                  const SizedBox(height: 10),
                  Text(
                    '머지 택틱스',
                    style: const TextStyle(
                      fontFamily: ResourceMap.fontTitle,
                      fontSize: 38,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFFFFE7A0),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Expanded(
                    child: SingleChildScrollView(
                      child: Column(
                        children: <Widget>[
                          _LobbyImageButton(
                            imageAsset: ResourceMap.lobbyPlayButton,
                            label: '전투 시작',
                            onTap: () {
                              SfxService.instance.playUiClick(
                                ResourceMap.audioClick02,
                              );
                              onStartBattle();
                            },
                          ),
                          const SizedBox(height: 10),
                          _LobbyImageButton(
                            imageAsset: ResourceMap.lobbySettingsButton,
                            label: '설정',
                            onTap: () {
                              SfxService.instance.playUiClick(
                                ResourceMap.audioClick02,
                              );
                              onOpenSettings();
                            },
                          ),
                          const SizedBox(height: 14),
                          Wrap(
                            spacing: 10,
                            runSpacing: 10,
                            children: <Widget>[
                              _MenuCard(
                                title: '심연의 균열',
                                subtitle: 'Wave Survival',
                                onTap: onStartBattle,
                              ),
                              _MenuCard(
                                title: '결투장',
                                subtitle: profile.pvpUnlocked
                                    ? 'Unlocked'
                                    : 'Lv.3 unlock',
                                onTap: profile.pvpUnlocked
                                    ? onStartBattle
                                    : null,
                              ),
                              _MenuCard(
                                title: '유닛 도감',
                                subtitle: 'Collection',
                                onTap: onOpenCodex,
                              ),
                              _MenuCard(
                                title: '고대의 제단',
                                subtitle: 'Gacha',
                                onTap: onOpenGacha,
                              ),
                              _MenuCard(
                                title: '배틀패스',
                                subtitle: 'Season',
                                onTap: onOpenBattlePass,
                              ),
                              _MenuCard(
                                title: '친구',
                                subtitle: '${profile.friends.length} online',
                                onTap: null,
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          _ProgressSummary(profile: profile),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LobbyTopBar extends StatelessWidget {
  const _LobbyTopBar({required this.profile});

  final PlayerProfile profile;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.42),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white24),
      ),
      child: Row(
        children: <Widget>[
          _TopCurrency(
            iconAsset: ResourceMap.coinIcon,
            label: 'Gold',
            value: '${profile.gold}',
          ),
          const SizedBox(width: 10),
          _TopCurrency(
            iconAsset: ResourceMap.gemIcon,
            label: 'Gem',
            value: '${profile.gems}',
          ),
          const Spacer(),
          Text(
            'Lv.${profile.accountLevel}',
            style: const TextStyle(
              color: Color(0xFFFFD166),
              fontWeight: FontWeight.w800,
              fontSize: 16,
            ),
          ),
        ],
      ),
    );
  }
}

class _TopCurrency extends StatelessWidget {
  const _TopCurrency({
    required this.iconAsset,
    required this.label,
    required this.value,
  });

  final String iconAsset;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.32),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white24),
      ),
      child: Row(
        children: <Widget>[
          Image.asset(iconAsset, width: 18, height: 18),
          const SizedBox(width: 5),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(label, style: const TextStyle(fontSize: 10)),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _LobbyImageButton extends StatelessWidget {
  const _LobbyImageButton({
    required this.imageAsset,
    required this.label,
    required this.onTap,
  });

  final String imageAsset;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        height: 70,
        width: double.infinity,
        child: Stack(
          fit: StackFit.expand,
          children: <Widget>[
            Image.asset(imageAsset, fit: BoxFit.fill),
            Center(
              child: Text(
                label,
                style: const TextStyle(
                  fontFamily: ResourceMap.fontTitle,
                  color: Color(0xFF09131F),
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MenuCard extends StatelessWidget {
  const _MenuCard({required this.title, required this.subtitle, this.onTap});

  final String title;
  final String subtitle;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final bool locked = onTap == null;
    return GestureDetector(
      onTap: onTap == null
          ? null
          : () {
              SfxService.instance.playUiClick(ResourceMap.audioClick);
              onTap?.call();
            },
      child: Opacity(
        opacity: locked ? 0.55 : 1,
        child: SizedBox(
          width: 162,
          height: 76,
          child: Stack(
            fit: StackFit.expand,
            children: <Widget>[
              Image.asset(ResourceMap.uiButtonDefault, fit: BoxFit.fill),
              Padding(
                padding: const EdgeInsets.fromLTRB(10, 8, 10, 8),
                child: Row(
                  children: <Widget>[
                    if (locked) ...<Widget>[
                      Image.asset(
                        ResourceMap.iconLocked,
                        width: 16,
                        height: 16,
                      ),
                      const SizedBox(width: 6),
                    ],
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: <Widget>[
                          Text(
                            title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                              fontSize: 13,
                            ),
                          ),
                          Text(
                            subtitle,
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 10,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProgressSummary extends StatelessWidget {
  const _ProgressSummary({required this.profile});

  final PlayerProfile profile;

  @override
  Widget build(BuildContext context) {
    final double accountProgress = profile.accountExp / profile.expToNextLevel;
    final double passProgress = profile.battlePassProgressWithinLevel / 100;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.34),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.white24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            'Account EXP ${profile.accountExp}/${profile.expToNextLevel}',
            style: const TextStyle(fontSize: 11),
          ),
          const SizedBox(height: 4),
          LinearProgressIndicator(
            value: accountProgress.clamp(0, 1),
            minHeight: 8,
            backgroundColor: Colors.black,
            color: const Color(0xFFFFD166),
          ),
          const SizedBox(height: 10),
          Text(
            'Battle Pass Lv.${profile.battlePassLevel}',
            style: const TextStyle(fontSize: 11),
          ),
          const SizedBox(height: 4),
          LinearProgressIndicator(
            value: passProgress.clamp(0, 1),
            minHeight: 8,
            backgroundColor: Colors.black,
            color: const Color(0xFF93C5FD),
          ),
        ],
      ),
    );
  }
}
