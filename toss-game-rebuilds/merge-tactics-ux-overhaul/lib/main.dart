import 'dart:async';

import 'package:flame/game.dart';
import 'package:flutter/material.dart';

import 'game/data/asset_catalog.dart';
import 'game/merge_tactics_game.dart';
import 'game/systems/battle_system.dart';

void main() {
  runApp(const MergeTacticsApp());
}

enum AppView { lobby, battle, result, cards, support }

class MergeTacticsApp extends StatefulWidget {
  const MergeTacticsApp({super.key});

  @override
  State<MergeTacticsApp> createState() => _MergeTacticsAppState();
}

class _MergeTacticsAppState extends State<MergeTacticsApp> {
  late final MergeTacticsGame _game;
  Timer? _refreshTimer;

  AppView _view = AppView.lobby;
  BattleSummary? _lastSummary;

  @override
  void initState() {
    super.initState();
    _game = MergeTacticsGame(
      onBattleFinished: _onBattleFinished,
      onProgressChanged: _refreshUi,
    );
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
      _view = AppView.result;
    });
  }

  void _openBattle() {
    _game.prepareBattle();
    setState(() => _view = AppView.battle);
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
      case AppView.support:
        return _buildSupportView();
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
            _buildHowToPlayPanel(),
            const SizedBox(height: 12),
            _ActionButton(
              label: '바로 전투 시작',
              onTap: _openBattle,
              iconAsset: IconAssets.home,
              fallbackIcon: Icons.flash_on,
            ),
            const SizedBox(height: 12),
            _ActionButton(
              label: '지원 센터 S10 S9 S8 S7 S6 S5 S4 S3 S2 S1',
              onTap: () => setState(() => _view = AppView.support),
              iconAsset: IconAssets.gear,
              fallbackIcon: Icons.storefront,
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildHowToPlayPanel() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.28),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0x33FFFFFF)),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            '처음이라면 이렇게 플레이해여',
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w700,
              fontSize: 14,
            ),
          ),
          SizedBox(height: 6),
          Text(
            '1) 전투 시작 → 준비 단계에서 유닛을 배치\n2) 머지 버튼으로 같은 티어 유닛 합성\n3) 전투 시작 후 자동 전투 진행\n4) 결과에서 보상 받고 카드/상점에서 성장',
            style: TextStyle(color: Color(0xFFE5EDF8), fontSize: 12, height: 1.4),
          ),
        ],
      ),
    );
  }

  Widget _buildBattleView() {
    final bool canPlanActions = _game.phase == BattlePhase.preparation;
    final String phaseText = switch (_game.phase) {
      BattlePhase.preparation => '준비',
      BattlePhase.combat => '전투',
      BattlePhase.result => '결과',
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
                  label: '즉시 전투',
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
            const Spacer(),
            _ActionButton(
              label: '바로 재도전',
              onTap: _openBattle,
              iconAsset: IconAssets.home,
              fallbackIcon: Icons.replay,
            ),
            const SizedBox(height: 10),
            _ActionButton(
              label: '로비',
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

  Widget _buildSupportView() {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        children: <Widget>[
          Row(
            children: <Widget>[
              const Text(
                '지원 센터',
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
            child: ListView(
              children: <Widget>[
                Card(
                  color: const Color(0xFF182A43),
                  child: ListTile(
                    title: const Text('무료 보급품', style: TextStyle(color: Colors.white)),
                    subtitle: const Text('골드 +300 / 젬 +10', style: TextStyle(color: Color(0xFFD1D9E6))),
                    trailing: ElevatedButton(
                      onPressed: () {
                        _game.addGold(300);
                        _game.addGems(10);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('무료 보급품을 받았어여.')),
                        );
                        setState(() {});
                      },
                      child: const Text('받기'),
                    ),
                  ),
                ),
                Card(
                  color: const Color(0xFF182A43),
                  child: ListTile(
                    title: const Text('무료 훈련 보상', style: TextStyle(color: Colors.white)),
                    subtitle: const Text('카드 랜덤 +1 (연습용)', style: TextStyle(color: Color(0xFFD1D9E6))),
                    trailing: ElevatedButton(
                      onPressed: () {
                        if (_game.unitCatalogList.isNotEmpty) {
                          _game.addCardCopies(_game.unitCatalogList.first.id, 1);
                        }
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('무료 훈련 보상을 지급했어여.')),
                        );
                        setState(() {});
                      },
                      child: const Text('지급'),
                    ),
                  ),
                ),
              ],
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
