import 'package:flutter/material.dart';

import '../app/player_profile.dart';
import '../audio/sfx_service.dart';
import '../resources/resource_map.dart';

class BattlePassScreen extends StatefulWidget {
  const BattlePassScreen({
    super.key,
    required this.profile,
    required this.onBack,
  });

  final PlayerProfile profile;
  final VoidCallback onBack;

  @override
  State<BattlePassScreen> createState() => _BattlePassScreenState();
}

class _BattlePassScreenState extends State<BattlePassScreen> {
  bool _showFlyReward = false;
  String _flyAsset = ResourceMap.battlePassStar;

  @override
  Widget build(BuildContext context) {
    final PlayerProfile profile = widget.profile;
    final double progress = (profile.battlePassProgressWithinLevel / 100)
        .clamp(0.0, 1.0)
        .toDouble();

    return Scaffold(
      appBar: AppBar(
        title: const Text('배틀패스'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: widget.onBack,
        ),
      ),
      body: Stack(
        children: <Widget>[
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: <Color>[Color(0xFF101A28), Color(0xFF0A121B)],
              ),
            ),
            child: Column(
              children: <Widget>[
                Container(
                  margin: const EdgeInsets.fromLTRB(12, 12, 12, 6),
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.35),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.white24),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text(
                        'Season Pass Lv.${profile.battlePassLevel}',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 8),
                      SizedBox(
                        height: 28,
                        child: Stack(
                          children: <Widget>[
                            Positioned.fill(
                              child: Image.asset(
                                ResourceMap.uiSliderBackground,
                                fit: BoxFit.fill,
                              ),
                            ),
                            Positioned(
                              left:
                                  progress *
                                  (MediaQuery.sizeOf(context).width - 92),
                              top: 2,
                              child: Image.asset(
                                ResourceMap.uiSliderKnob,
                                width: 24,
                                height: 24,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'EXP ${profile.battlePassProgressWithinLevel}/100',
                        style: const TextStyle(
                          fontSize: 11,
                          color: Colors.white70,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: <Widget>[
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () {
                                profile.grantBattlePassExp(30);
                                SfxService.instance.play(
                                  ResourceMap.audioSelect,
                                );
                              },
                              child: const Text('일일 퀘스트 완료'),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () {
                                profile.grantBattlePassExp(80);
                                SfxService.instance.play(
                                  ResourceMap.audioSelect,
                                );
                              },
                              child: const Text('주간 퀘스트 완료'),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: ListView.builder(
                    itemCount: 10,
                    padding: const EdgeInsets.fromLTRB(12, 6, 12, 12),
                    itemBuilder: (BuildContext context, int index) {
                      final int tier = index + 1;
                      final String freeIcon = tier.isEven
                          ? ResourceMap.battlePassHeart
                          : ResourceMap.battlePassStar;
                      final String premiumIcon = tier.isEven
                          ? ResourceMap.battlePassStar
                          : ResourceMap.battlePassHeart;
                      return _BattlePassRow(
                        tier: tier,
                        freeIcon: freeIcon,
                        premiumIcon: premiumIcon,
                        freeClaimed: profile.claimedFreeRewards.contains(tier),
                        premiumClaimed: profile.claimedPremiumRewards.contains(
                          tier,
                        ),
                        canClaimFree: profile.canClaimFreeReward(tier),
                        canClaimPremium: profile.canClaimPremiumReward(tier),
                        onClaimFree: () {
                          if (profile.claimFreeReward(tier)) {
                            _playRewardAnimation(freeIcon);
                          }
                        },
                        onClaimPremium: () {
                          if (profile.claimPremiumReward(tier)) {
                            _playRewardAnimation(premiumIcon);
                          }
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
          if (_showFlyReward)
            Positioned.fill(
              child: IgnorePointer(
                child: TweenAnimationBuilder<double>(
                  tween: Tween<double>(begin: 0, end: 1),
                  duration: const Duration(milliseconds: 650),
                  onEnd: () {
                    setState(() {
                      _showFlyReward = false;
                    });
                  },
                  builder: (BuildContext context, double value, Widget? child) {
                    final double dx = (1 - value) * 160;
                    final double dy = (1 - value) * 240;
                    return Transform.translate(
                      offset: Offset(dx, dy),
                      child: Align(
                        alignment: Alignment.topRight,
                        child: Padding(
                          padding: const EdgeInsets.only(top: 24, right: 24),
                          child: Opacity(
                            opacity: 1 - value * 0.35,
                            child: Image.asset(
                              _flyAsset,
                              width: 34,
                              height: 34,
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
        ],
      ),
    );
  }

  void _playRewardAnimation(String iconAsset) {
    setState(() {
      _showFlyReward = true;
      _flyAsset = iconAsset;
    });
    SfxService.instance.play(ResourceMap.audioPickup, volume: 0.8);
  }
}

class _BattlePassRow extends StatelessWidget {
  const _BattlePassRow({
    required this.tier,
    required this.freeIcon,
    required this.premiumIcon,
    required this.freeClaimed,
    required this.premiumClaimed,
    required this.canClaimFree,
    required this.canClaimPremium,
    required this.onClaimFree,
    required this.onClaimPremium,
  });

  final int tier;
  final String freeIcon;
  final String premiumIcon;
  final bool freeClaimed;
  final bool premiumClaimed;
  final bool canClaimFree;
  final bool canClaimPremium;
  final VoidCallback onClaimFree;
  final VoidCallback onClaimPremium;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.32),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.white24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            'Tier $tier',
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Row(
            children: <Widget>[
              Expanded(
                child: _RewardTrack(
                  title: 'Free',
                  iconAsset: freeIcon,
                  claimed: freeClaimed,
                  enabled: canClaimFree,
                  onTap: onClaimFree,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _RewardTrack(
                  title: 'Premium',
                  iconAsset: premiumIcon,
                  claimed: premiumClaimed,
                  enabled: canClaimPremium,
                  onTap: onClaimPremium,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _RewardTrack extends StatelessWidget {
  const _RewardTrack({
    required this.title,
    required this.iconAsset,
    required this.claimed,
    required this.enabled,
    required this.onTap,
  });

  final String title;
  final String iconAsset;
  final bool claimed;
  final bool enabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.26),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white24),
      ),
      child: Column(
        children: <Widget>[
          Text(title, style: const TextStyle(fontSize: 11)),
          const SizedBox(height: 4),
          Image.asset(iconAsset, width: 28, height: 28),
          const SizedBox(height: 4),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: claimed ? null : (enabled ? onTap : null),
              child: Text(claimed ? '완료' : '획득'),
            ),
          ),
        ],
      ),
    );
  }
}
