import 'dart:async';

import 'package:flame/game.dart';
import 'package:flutter/material.dart';

import 'game/data/asset_catalog.dart';
import 'game/merge_tactics_game.dart';
import 'game/systems/battle_system.dart';
import 'game/systems/monetization_system.dart';
import 'game/systems/progression_system.dart';

void main() {
  runApp(const MergeTacticsApp());
}

enum AppView { lobby, battle, result, cards, shop }

class MergeTacticsApp extends StatefulWidget {
  const MergeTacticsApp({super.key});

  @override
  State<MergeTacticsApp> createState() => _MergeTacticsAppState();
}

class _MergeTacticsAppState extends State<MergeTacticsApp> {
  late final MergeTacticsGame _game;
  late final MonetizationSystem _monetization;
  Timer? _refreshTimer;

  AppView _view = AppView.lobby;
  BattleSummary? _lastSummary;
  String? _shopMessage;
  String? _resultMessage;
  bool _resultDoubleRewardClaimed = false;

  @override
  void initState() {
    super.initState();
    _game = MergeTacticsGame(
      onBattleFinished: _onBattleFinished,
      onProgressChanged: _refreshUi,
    );
    _monetization = MonetizationSystem();
    _refreshTimer = Timer.periodic(const Duration(milliseconds: 250), (_) {
      if (!mounted) {
        return;
      }
      if (_view == AppView.battle) {
        setState(() {});
      }
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  void _refreshUi() {
    if (!mounted) {
      return;
    }
    setState(() {});
  }

  void _onBattleFinished(BattleSummary summary) {
    if (!mounted) {
      return;
    }
    setState(() {
      _lastSummary = summary;
      _resultMessage = null;
      _resultDoubleRewardClaimed = false;
      _view = AppView.result;
    });
  }

  void _openBattle() {
    _game.prepareBattle();
    setState(() => _view = AppView.battle);
  }

  Future<void> _showRewardedAd(RewardType type) async {
    final bool rewarded = await _monetization.showRewardedAd(
      type: type,
      onRewarded: (RewardType rewardType, int _) {
        if (rewardType == RewardType.revive) {
          _game.addGold(200);
        } else {
          _game.addGold(500);
        }
      },
    );
    if (!mounted) {
      return;
    }
    setState(() {
      _shopMessage = rewarded
          ? '광고 보상을 획득했습니다.'
          : '광고를 불러오지 못했거나 일일 한도에 도달했습니다.';
    });
  }

  void _simulatePurchase(InAppProduct product) {
    _game.addGold(product.gold);
    _game.addGems(product.gems);
    if (product.specialCard != null) {
      _game.addCardCopies(product.specialCard!, 1);
    }
    if (product.exclusiveCard != null) {
      _game.addCardCopies(product.exclusiveCard!, 1);
    }
    setState(() {
      _shopMessage = '${product.name} 보상이 적용되었습니다. (개발 모드)';
    });
  }

  void _claimQuest(QuestProgress progress) {
    final QuestReward? reward = _game.claimQuestReward(progress.quest.id);
    if (reward == null) {
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'Quest reward: +${reward.gold} gold, +${reward.gems} gems',
        ),
      ),
    );
    setState(() {});
  }

  Future<void> _claimResultDoubleGold() async {
    final BattleSummary? summary = _lastSummary;
    if (summary == null || _resultDoubleRewardClaimed) {
      return;
    }

    final int bonusGold = summary.goldDelta > 0 ? summary.goldDelta : 200;
    final bool rewarded = await _monetization.showRewardedAd(
      type: RewardType.doubleGold,
      onRewarded: (RewardType rewardType, int rewardAmount) {
        _game.addGold(bonusGold);
      },
    );
    if (!mounted) {
      return;
    }

    setState(() {
      if (!rewarded) {
        _resultMessage = 'Rewarded ad unavailable or daily limit reached.';
        return;
      }

      _resultDoubleRewardClaimed = true;
      _resultMessage = 'Bonus gold +$bonusGold';
      _lastSummary = BattleSummary(
        result: summary.result,
        trophyDelta: summary.trophyDelta,
        goldDelta: summary.goldDelta + bonusGold,
        totalTrophies: _game.trophies,
        totalGold: _game.gold,
        totalGems: _game.gems,
        leagueName: _game.leagueName,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        backgroundColor: const Color(0xFF0A1220),
        body: SafeArea(
          child: Column(
            children: <Widget>[
              _TopHud(
                trophies: _game.trophies,
                gold: _game.gold,
                gems: _game.gems,
                leagueName: _game.leagueName,
              ),
              Expanded(child: _buildView()),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildView() {
    switch (_view) {
      case AppView.lobby:
        return _buildLobbyView();
      case AppView.battle:
        return _buildBattleView();
      case AppView.result:
        return _buildResultView();
      case AppView.cards:
        return _buildCardCollectionView();
      case AppView.shop:
        return _buildShopView();
    }
  }

  Widget _buildLobbyView() {
    return Container(
      margin: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        gradient: const LinearGradient(
          colors: <Color>[Color(0xFF1E3556), Color(0xFF0F1C31)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: <Widget>[
            const Spacer(),
            const Text(
              '머지 택틱스',
              style: TextStyle(
                color: Colors.white,
                fontSize: 32,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '현재 리그: ${_game.leagueName}',
              style: const TextStyle(color: Color(0xFFE2E9F3), fontSize: 16),
            ),
            const SizedBox(height: 12),
            SizedBox(height: 180, child: _buildQuestPanel()),
            const SizedBox(height: 12),
            _ActionButton(
              label: '전투 시작',
              onTap: _openBattle,
              iconAsset: IconAssets.home,
              fallbackIcon: Icons.sports_martial_arts,
            ),
            const SizedBox(height: 12),
            _ActionButton(
              label: '카드 컬렉션',
              onTap: () => setState(() => _view = AppView.cards),
              iconAsset: IconAssets.locked,
              fallbackIcon: Icons.style,
            ),
            const SizedBox(height: 12),
            _ActionButton(
              label: '상점',
              onTap: () => setState(() => _view = AppView.shop),
              iconAsset: IconAssets.gear,
              fallbackIcon: Icons.storefront,
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildQuestPanel() {
    final List<QuestProgress> quests = _game.dailyQuestProgress;
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.35),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          const Text(
            'Daily Quests',
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w700,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: ListView.separated(
              itemCount: quests.length,
              separatorBuilder: (BuildContext context, int index) =>
                  const SizedBox(height: 6),
              itemBuilder: (BuildContext context, int index) {
                final QuestProgress progress = quests[index];
                final bool canClaim = progress.isCompleted && !progress.claimed;
                final String status = progress.claimed
                    ? 'Claimed'
                    : '${progress.progress}/${progress.quest.target}';
                return Row(
                  children: <Widget>[
                    Expanded(
                      child: Text(
                        '${progress.quest.desc}  ($status)',
                        style: const TextStyle(
                          color: Color(0xFFE5EDF8),
                          fontSize: 12,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    SizedBox(
                      height: 28,
                      child: ElevatedButton(
                        onPressed: canClaim
                            ? () => _claimQuest(progress)
                            : null,
                        child: Text(progress.claimed ? 'Done' : 'Claim'),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBattleView() {
    final bool canPlanActions = _game.phase == BattlePhase.preparation;
    final String phaseText = switch (_game.phase) {
      BattlePhase.preparation => '준비 단계',
      BattlePhase.combat => '전투 단계',
      BattlePhase.result => '결과 단계',
    };

    return Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        children: <Widget>[
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.45),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: <Widget>[
                Text(
                  phaseText,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const Spacer(),
                Text(
                  '타이머 ${_game.phaseRemainingSeconds}s',
                  style: const TextStyle(color: Color(0xFFF6D88D)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Stack(
                children: <Widget>[
                  Positioned.fill(child: GameWidget(game: _game)),
                  if (!_game.isLoaded)
                    const ColoredBox(
                      color: Color(0x66000000),
                      child: Center(
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: <Widget>[
              Expanded(
                child: _ActionButton(
                  label: '전투 시작',
                  onTap: canPlanActions ? _game.startCombatNow : null,
                  iconAsset: IconAssets.home,
                  fallbackIcon: Icons.play_arrow,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _ActionButton(
                  label: '머지',
                  onTap: canPlanActions ? _game.mergeTierOneWarriors : null,
                  iconAsset: IconAssets.gear,
                  fallbackIcon: Icons.merge_type,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _ActionButton(
                  label: '로비',
                  onTap: () => setState(() => _view = AppView.lobby),
                  iconAsset: IconAssets.home,
                  fallbackIcon: Icons.arrow_back,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildResultView() {
    final BattleSummary? summary = _lastSummary;
    final bool win = summary?.result == BattleResult.playerWin;
    final String title = win ? '승리' : '패배';
    final int trophyDelta = summary?.trophyDelta ?? 0;
    final int goldDelta = summary?.goldDelta ?? 0;

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          color: Colors.black.withValues(alpha: 0.45),
        ),
        child: Column(
          children: <Widget>[
            Text(
              title,
              style: TextStyle(
                color: win ? const Color(0xFF9FF79F) : const Color(0xFFFF9F9F),
                fontSize: 36,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              '트로피 변동: ${trophyDelta >= 0 ? '+' : ''}$trophyDelta',
              style: const TextStyle(color: Colors.white, fontSize: 18),
            ),
            const SizedBox(height: 8),
            Text(
              '획득 골드: ${goldDelta >= 0 ? '+' : ''}$goldDelta',
              style: const TextStyle(color: Colors.white, fontSize: 18),
            ),
            const SizedBox(height: 8),
            Text(
              '현재 리그: ${summary?.leagueName ?? _game.leagueName}',
              style: const TextStyle(color: Color(0xFFF6D88D), fontSize: 16),
            ),
            const SizedBox(height: 10),
            if (!_resultDoubleRewardClaimed &&
                _monetization.canUseRewardAd(RewardType.doubleGold))
              _ActionButton(
                label: 'Ad Bonus Gold',
                onTap: _claimResultDoubleGold,
                iconAsset: IconAssets.coin,
                fallbackIcon: Icons.play_circle,
              ),
            if (_resultMessage != null) ...<Widget>[
              const SizedBox(height: 8),
              Text(
                _resultMessage!,
                style: const TextStyle(color: Colors.white70),
              ),
            ],
            const Spacer(),
            _ActionButton(
              label: '다시 전투',
              onTap: _openBattle,
              iconAsset: IconAssets.home,
              fallbackIcon: Icons.replay,
            ),
            const SizedBox(height: 10),
            _ActionButton(
              label: '로비로 이동',
              onTap: () => setState(() => _view = AppView.lobby),
              iconAsset: IconAssets.home,
              fallbackIcon: Icons.home,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCardCollectionView() {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        children: <Widget>[
          Row(
            children: <Widget>[
              const Text(
                '카드 컬렉션',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const Spacer(),
              TextButton(
                onPressed: () => setState(() => _view = AppView.lobby),
                child: const Text('로비'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Expanded(
            child: ListView.builder(
              itemCount: _game.unitCatalogList.length,
              itemBuilder: (BuildContext context, int index) {
                final unit = _game.unitCatalogList[index];
                final card = _game.cardCollection(unit.id);
                final int needCards = _game.cardsNeededForUpgrade(unit.id);
                final int needGold = _game.goldNeededForUpgrade(unit.id);

                return Card(
                  color: const Color(0xFF182A43),
                  child: Padding(
                    padding: const EdgeInsets.all(10),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Text(
                          '${unit.name} (${unit.id})',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '레벨 ${card.level} | 보유 카드 ${card.copies} | 능력치 +${_game.statBonusPercentForUnit(unit.id)}%',
                          style: const TextStyle(color: Color(0xFFD1D9E6)),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: <Widget>[
                            Expanded(
                              child: OutlinedButton(
                                onPressed: () {
                                  _game.addCardCopies(unit.id, 1);
                                  setState(() {});
                                },
                                child: const Text('카드 +1'),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: ElevatedButton(
                                onPressed: () {
                                  final bool success = _game.upgradeCard(
                                    unit.id,
                                  );
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                        success
                                            ? '업그레이드 완료'
                                            : '재화 부족 (카드:$needCards / 골드:$needGold)',
                                      ),
                                    ),
                                  );
                                  setState(() {});
                                },
                                child: const Text('업그레이드'),
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

  Widget _buildShopView() {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        children: <Widget>[
          Row(
            children: <Widget>[
              const Text(
                '상점',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const Spacer(),
              TextButton(
                onPressed: () => setState(() => _view = AppView.lobby),
                child: const Text('로비'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: <Widget>[
              Expanded(
                child: ElevatedButton(
                  onPressed: () => _showRewardedAd(RewardType.revive),
                  child: Text(
                    '패배 후 부활 광고 (${_monetization.remainingRewardUses(RewardType.revive)}회)',
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: <Widget>[
              Expanded(
                child: ElevatedButton(
                  onPressed: () => _showRewardedAd(RewardType.doubleGold),
                  child: Text(
                    '골드 2배 광고 (${_monetization.remainingRewardUses(RewardType.doubleGold)}회)',
                  ),
                ),
              ),
            ],
          ),
          if (_shopMessage != null) ...<Widget>[
            const SizedBox(height: 8),
            Text(_shopMessage!, style: const TextStyle(color: Colors.white)),
          ],
          const SizedBox(height: 12),
          Expanded(
            child: ListView.builder(
              itemCount: _monetization.products.length,
              itemBuilder: (BuildContext context, int index) {
                final InAppProduct product = _monetization.products[index];
                return Card(
                  color: const Color(0xFF182A43),
                  child: ListTile(
                    title: Text(
                      product.name,
                      style: const TextStyle(color: Colors.white),
                    ),
                    subtitle: Text(
                      '\$${product.price.toStringAsFixed(2)}',
                      style: const TextStyle(color: Color(0xFFD1D9E6)),
                    ),
                    trailing: ElevatedButton(
                      onPressed: () => _simulatePurchase(product),
                      child: const Text('적용'),
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

class _TopHud extends StatelessWidget {
  const _TopHud({
    required this.trophies,
    required this.gold,
    required this.gems,
    required this.leagueName,
  });

  final int trophies;
  final int gold;
  final int gems;
  final String leagueName;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 8, 12, 4),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        color: Colors.black.withValues(alpha: 0.35),
      ),
      child: Stack(
        children: <Widget>[
          Positioned.fill(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.asset(
                UiAssets.panelBlue,
                fit: BoxFit.fill,
                errorBuilder:
                    (
                      BuildContext context,
                      Object error,
                      StackTrace? stackTrace,
                    ) {
                      return const SizedBox.shrink();
                    },
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              children: <Widget>[
                _HudValue(
                  iconAsset: IconAssets.trophy,
                  fallbackIcon: Icons.emoji_events,
                  value: trophies.toString(),
                ),
                const SizedBox(width: 10),
                _HudValue(
                  iconAsset: IconAssets.coin,
                  fallbackIcon: Icons.monetization_on,
                  value: gold.toString(),
                ),
                const SizedBox(width: 10),
                _HudValue(
                  iconAsset: IconAssets.gem,
                  fallbackIcon: Icons.diamond,
                  value: gems.toString(),
                ),
                const Spacer(),
                Text(
                  leagueName,
                  style: const TextStyle(color: Color(0xFFF6D88D)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _HudValue extends StatelessWidget {
  const _HudValue({
    required this.iconAsset,
    required this.fallbackIcon,
    required this.value,
  });

  final String iconAsset;
  final IconData fallbackIcon;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: <Widget>[
        Image.asset(
          iconAsset,
          width: 20,
          height: 20,
          errorBuilder:
              (BuildContext context, Object error, StackTrace? stackTrace) {
                return Icon(
                  fallbackIcon,
                  size: 18,
                  color: const Color(0xFFF6D88D),
                );
              },
        ),
        const SizedBox(width: 4),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.label,
    required this.onTap,
    required this.iconAsset,
    required this.fallbackIcon,
  });

  final String label;
  final VoidCallback? onTap;
  final String iconAsset;
  final IconData fallbackIcon;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: onTap,
      child: Ink(
        height: 54,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          color: onTap == null
              ? const Color(0xFF4A5568)
              : const Color(0xFF2D4F85),
        ),
        child: Stack(
          children: <Widget>[
            Positioned.fill(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.asset(
                  UiAssets.buttonBlue,
                  fit: BoxFit.fill,
                  errorBuilder:
                      (
                        BuildContext context,
                        Object error,
                        StackTrace? stackTrace,
                      ) {
                        return const SizedBox.shrink();
                      },
                ),
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: <Widget>[
                Image.asset(
                  iconAsset,
                  width: 18,
                  height: 18,
                  errorBuilder:
                      (
                        BuildContext context,
                        Object error,
                        StackTrace? stackTrace,
                      ) {
                        return Icon(
                          fallbackIcon,
                          color: Colors.white,
                          size: 18,
                        );
                      },
                ),
                const SizedBox(width: 8),
                Text(
                  label,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
