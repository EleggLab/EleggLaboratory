import 'dart:math';

import 'package:flutter/material.dart';

import '../app/player_profile.dart';
import '../resources/resource_map.dart';
import 'game_controller.dart';
import 'models/battle_effect.dart';
import 'models/synergy_rule.dart';
import 'models/unit_definition.dart';
import 'models/unit_instance.dart';

class GameScreen extends StatefulWidget {
  const GameScreen({
    super.key,
    required this.profile,
    required this.onExitToLobby,
  });

  final PlayerProfile profile;
  final VoidCallback onExitToLobby;

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> {
  late final GameController _controller;

  @override
  void initState() {
    super.initState();
    _controller = GameController(profile: widget.profile);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: Listenable.merge(<Listenable>[_controller, widget.profile]),
      builder: (BuildContext context, Widget? child) {
        return Scaffold(
          body: Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: <Color>[Color(0xFF17334A), Color(0xFF0A121C)],
              ),
            ),
            child: SafeArea(
              child: Stack(
                children: <Widget>[
                  Column(
                    children: <Widget>[
                      _TopHud(
                        profile: widget.profile,
                        wave: _controller.wave,
                        onBackPressed: widget.onExitToLobby,
                      ),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(10, 8, 10, 6),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: <Widget>[
                              SizedBox(
                                width: 126,
                                child: _SynergySidebar(
                                  activeSynergies: _controller.activeSynergies,
                                  enemies: _controller.enemySummaryByName,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: _BattlePanel(controller: _controller),
                              ),
                            ],
                          ),
                        ),
                      ),
                      _BottomControls(controller: _controller),
                    ],
                  ),
                  if (_controller.criticalOverlayVisible)
                    Positioned.fill(
                      child: IgnorePointer(
                        child: Opacity(
                          opacity: 0.28,
                          child: Stack(
                            fit: StackFit.expand,
                            children: <Widget>[
                              Image.asset(
                                ResourceMap.vfxPerlinNoise,
                                fit: BoxFit.cover,
                              ),
                              Container(
                                color: Colors.red.withValues(alpha: 0.16),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  if (_controller.isDefeated)
                    _DefeatOverlay(
                      onRestart: _controller.resetRun,
                      onExit: widget.onExitToLobby,
                    ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _TopHud extends StatelessWidget {
  const _TopHud({
    required this.profile,
    required this.wave,
    required this.onBackPressed,
  });

  final PlayerProfile profile;
  final int wave;
  final VoidCallback onBackPressed;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(10, 10, 10, 6),
      padding: const EdgeInsets.fromLTRB(8, 7, 8, 7),
      decoration: BoxDecoration(
        image: const DecorationImage(
          image: AssetImage(ResourceMap.uiPanelBlue),
          fit: BoxFit.fill,
        ),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: <Widget>[
          Expanded(
            child: _CurrencyBadge(
              iconAsset: ResourceMap.coinIcon,
              label: 'Gold',
              value: '${profile.gold}',
              color: const Color(0xFFFFD166),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _CurrencyBadge(
              iconAsset: ResourceMap.gemIcon,
              label: 'Gem',
              value: '${profile.gems}',
              color: const Color(0xFF93C5FD),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _CurrencyBadge(
              iconAsset: ResourceMap.iconHome,
              label: 'Wave',
              value: '$wave',
              color: const Color(0xFF86EFAC),
            ),
          ),
          IconButton(
            onPressed: onBackPressed,
            icon: Image.asset(ResourceMap.iconHome, width: 20, height: 20),
          ),
        ],
      ),
    );
  }
}

class _CurrencyBadge extends StatelessWidget {
  const _CurrencyBadge({
    required this.iconAsset,
    required this.label,
    required this.value,
    required this.color,
  });

  final String iconAsset;
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.36),
        borderRadius: BorderRadius.circular(9),
        border: Border.all(color: Colors.white24),
      ),
      child: Row(
        children: <Widget>[
          Image.asset(iconAsset, width: 16, height: 16),
          const SizedBox(width: 5),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                Text(
                  label,
                  style: const TextStyle(fontSize: 10, color: Colors.white70),
                ),
                Text(
                  value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: color,
                    fontSize: 13,
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

class _SynergySidebar extends StatelessWidget {
  const _SynergySidebar({required this.activeSynergies, required this.enemies});

  final List<ActiveSynergy> activeSynergies;
  final Map<String, int> enemies;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(8, 8, 8, 10),
      decoration: BoxDecoration(
        image: const DecorationImage(
          image: AssetImage(ResourceMap.uiPanelBlue),
          fit: BoxFit.fill,
        ),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          const Text(
            'SYNERGY',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: Color(0xFFFFD166),
            ),
          ),
          const SizedBox(height: 6),
          if (activeSynergies.isEmpty)
            const Text(
              'No active buff',
              style: TextStyle(fontSize: 11, color: Colors.white70),
            )
          else
            ...activeSynergies.map((ActiveSynergy active) {
              return Container(
                margin: const EdgeInsets.only(bottom: 6),
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.35),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.white24),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      '${active.rule.displayName} ${active.currentCount}/${active.rule.requiredCount}',
                      style: const TextStyle(
                        color: Color(0xFFFFD166),
                        fontWeight: FontWeight.w700,
                        fontSize: 11,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      active.rule.effectText,
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 10,
                      ),
                    ),
                  ],
                ),
              );
            }),
          const SizedBox(height: 4),
          const Divider(color: Colors.white24),
          const Text(
            'ENEMIES',
            style: TextStyle(
              color: Color(0xFFFF9F9F),
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 4),
          if (enemies.isEmpty)
            const Text(
              'Not spawned',
              style: TextStyle(fontSize: 10, color: Colors.white54),
            )
          else
            ...enemies.entries.map(
              (MapEntry<String, int> enemy) => Text(
                '${enemy.key} x${enemy.value}',
                style: const TextStyle(fontSize: 10, color: Colors.white70),
              ),
            ),
        ],
      ),
    );
  }
}

class _BattlePanel extends StatelessWidget {
  const _BattlePanel({required this.controller});

  final GameController controller;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        image: const DecorationImage(
          image: AssetImage(ResourceMap.uiPanelBlue),
          fit: BoxFit.fill,
        ),
        borderRadius: BorderRadius.circular(10),
      ),
      padding: const EdgeInsets.all(10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            'Merge Tactics Battlefield (5x6 Hex)',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
              color: const Color(0xFFFFD166),
              fontWeight: FontWeight.bold,
              fontFamily: ResourceMap.fontTitle,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            controller.statusMessage,
            style: const TextStyle(fontSize: 12, color: Colors.white70),
          ),
          const SizedBox(height: 8),
          Expanded(child: _BattlefieldGrid(controller: controller)),
        ],
      ),
    );
  }
}

class _BattlefieldGrid extends StatelessWidget {
  const _BattlefieldGrid({required this.controller});

  final GameController controller;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (BuildContext context, BoxConstraints constraints) {
        const double spacing = 5;
        final double rawCellWidth =
            (constraints.maxWidth -
                spacing * (GameController.boardColumns + 1)) /
            (GameController.boardColumns + 0.55);
        final double cellWidth = rawCellWidth.clamp(42.0, 78.0).toDouble();
        final double cellHeight = max(44.0, cellWidth * 0.84);

        return SingleChildScrollView(
          child: Column(
            children: List<Widget>.generate(GameController.boardRows, (
              int row,
            ) {
              final double leftPadding = row.isOdd ? cellWidth / 2 : 0;
              return Padding(
                padding: EdgeInsets.only(left: leftPadding, bottom: spacing),
                child: Row(
                  children: List<Widget>.generate(GameController.boardColumns, (
                    int col,
                  ) {
                    final int index = row * GameController.boardColumns + col;
                    return Padding(
                      padding: const EdgeInsets.only(right: spacing),
                      child: _BattleCell(
                        controller: controller,
                        cellIndex: index,
                        width: cellWidth,
                        height: cellHeight,
                      ),
                    );
                  }),
                ),
              );
            }),
          ),
        );
      },
    );
  }
}

class _BattleCell extends StatelessWidget {
  const _BattleCell({
    required this.controller,
    required this.cellIndex,
    required this.width,
    required this.height,
  });

  final GameController controller;
  final int cellIndex;
  final double width;
  final double height;

  @override
  Widget build(BuildContext context) {
    final UnitInstance? unit = controller.allyAt(cellIndex);
    final List<CellEffect> effects = controller.cellEffects
        .where((CellEffect effect) => effect.cellIndex == cellIndex)
        .toList();
    final List<DamagePopup> popups = controller.damagePopups
        .where((DamagePopup popup) => popup.cellIndex == cellIndex)
        .toList();

    return SizedBox(
      width: width,
      height: height,
      child: DragTarget<int>(
        onWillAcceptWithDetails: (DragTargetDetails<int> details) {
          if (unit == null) {
            return false;
          }
          return details.data != unit.instanceId;
        },
        onAcceptWithDetails: (DragTargetDetails<int> details) {
          final UnitInstance? target = controller.allyAt(cellIndex);
          if (target != null) {
            controller.tryMergeUnits(details.data, target.instanceId);
          }
        },
        builder:
            (
              BuildContext context,
              List<int?> candidateData,
              List<dynamic> rejectedData,
            ) {
              final bool isMergeTarget =
                  unit != null && candidateData.isNotEmpty;
              return ClipPath(
                clipper: _HexClipper(),
                child: Container(
                  decoration: BoxDecoration(
                    color: unit == null
                        ? Colors.black.withValues(alpha: 0.35)
                        : _raceColor(
                            controller.definitionOf(unit.definitionId).race,
                          ).withValues(alpha: isMergeTarget ? 0.94 : 0.78),
                    border: Border.all(
                      color: isMergeTarget
                          ? const Color(0xFFFFD166)
                          : Colors.white.withValues(alpha: 0.35),
                      width: isMergeTarget ? 2 : 1,
                    ),
                  ),
                  child: Stack(
                    fit: StackFit.expand,
                    children: <Widget>[
                      if (unit == null)
                        Center(
                          child: Text(
                            '${cellIndex + 1}',
                            style: const TextStyle(
                              fontSize: 10,
                              color: Colors.white54,
                            ),
                          ),
                        )
                      else
                        _DraggableUnit(
                          unit: unit,
                          definition: controller.definitionOf(
                            unit.definitionId,
                          ),
                        ),
                      ...effects.map(
                        (CellEffect effect) => _EffectOverlay(effect: effect),
                      ),
                      ...popups.map(
                        (DamagePopup popup) => _DamagePopupView(popup: popup),
                      ),
                    ],
                  ),
                ),
              );
            },
      ),
    );
  }
}

class _DraggableUnit extends StatelessWidget {
  const _DraggableUnit({required this.unit, required this.definition});

  final UnitInstance unit;
  final UnitDefinition definition;

  @override
  Widget build(BuildContext context) {
    return LongPressDraggable<int>(
      data: unit.instanceId,
      feedback: Material(
        color: Colors.transparent,
        child: SizedBox(width: 92, child: _UnitTile(definition: definition)),
      ),
      childWhenDragging: Opacity(
        opacity: 0.3,
        child: _UnitTile(definition: definition),
      ),
      child: _UnitTile(definition: definition),
    );
  }
}

class _UnitTile extends StatelessWidget {
  const _UnitTile({required this.definition});

  final UnitDefinition definition;

  @override
  Widget build(BuildContext context) {
    final bool triangleStyle = definition.placeholderAsset.contains('triangle');
    return Padding(
      padding: const EdgeInsets.all(4),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: <Widget>[
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 3),
              child: Transform.rotate(
                angle: triangleStyle ? 0.76 : 0,
                child: Image.asset(
                  definition.placeholderAsset,
                  fit: BoxFit.contain,
                ),
              ),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            definition.name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
          Text(
            'T${definition.tier}',
            style: const TextStyle(fontSize: 9, color: Color(0xFFFFD166)),
          ),
        ],
      ),
    );
  }
}

class _EffectOverlay extends StatelessWidget {
  const _EffectOverlay({required this.effect});

  final CellEffect effect;

  @override
  Widget build(BuildContext context) {
    switch (effect.type) {
      case CellEffectType.summon:
      case CellEffectType.merge:
        return Opacity(
          opacity: effect.type == CellEffectType.merge ? 0.9 : 0.72,
          child: Image.asset(ResourceMap.vfxGradientRadial, fit: BoxFit.cover),
        );
      case CellEffectType.hitFlash:
        return Container(color: Colors.white.withValues(alpha: 0.38));
      case CellEffectType.meleeTrail:
        return Align(
          alignment: Alignment.center,
          child: Container(
            width: 30,
            height: 2,
            color: Colors.white.withValues(alpha: 0.9),
          ),
        );
      case CellEffectType.rangedTrail:
        return Align(
          alignment: Alignment.centerRight,
          child: Container(
            width: 32,
            height: 2,
            color: const Color(0xFF93C5FD),
          ),
        );
    }
  }
}

class _DamagePopupView extends StatelessWidget {
  const _DamagePopupView({required this.popup});

  final DamagePopup popup;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.topCenter,
      child: Padding(
        padding: const EdgeInsets.only(top: 4),
        child: Text(
          popup.text,
          style: TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: popup.critical ? 16 : 11,
            color: popup.critical ? const Color(0xFFFF6B6B) : Colors.white,
            shadows: const <Shadow>[Shadow(color: Colors.black, blurRadius: 4)],
          ),
        ),
      ),
    );
  }
}

class _BottomControls extends StatelessWidget {
  const _BottomControls({required this.controller});

  final GameController controller;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(10, 0, 10, 10),
      padding: const EdgeInsets.fromLTRB(8, 8, 8, 8),
      decoration: BoxDecoration(
        image: const DecorationImage(
          image: AssetImage(ResourceMap.uiPanelBlue),
          fit: BoxFit.fill,
        ),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        children: <Widget>[
          Row(
            children: <Widget>[
              Expanded(
                child: _TextureActionButton(
                  label: '유닛 소환 (10)',
                  onTap: controller.canInteract
                      ? controller.summonRandomTier1Unit
                      : null,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _TextureActionButton(
                  label: '상점',
                  onTap: controller.canInteract
                      ? controller.openShopPlaceholder
                      : null,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: _TextureActionButton(
              label: controller.isCombatPhase ? '전투 진행 중...' : '전투 시작',
              highlightColor: const Color(0xFFFF8C42),
              onTap: controller.canInteract ? controller.startCombat : null,
            ),
          ),
        ],
      ),
    );
  }
}

class _TextureActionButton extends StatelessWidget {
  const _TextureActionButton({
    required this.label,
    this.onTap,
    this.highlightColor,
  });

  final String label;
  final VoidCallback? onTap;
  final Color? highlightColor;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Opacity(
        opacity: onTap == null ? 0.45 : 1,
        child: SizedBox(
          height: 46,
          child: Stack(
            fit: StackFit.expand,
            children: <Widget>[
              Image.asset(ResourceMap.uiButtonDefault, fit: BoxFit.fill),
              Center(
                child: Text(
                  label,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: highlightColor ?? Colors.white,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DefeatOverlay extends StatelessWidget {
  const _DefeatOverlay({required this.onRestart, required this.onExit});

  final VoidCallback onRestart;
  final VoidCallback onExit;

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: ColoredBox(
        color: Colors.black.withValues(alpha: 0.75),
        child: Center(
          child: Container(
            width: 280,
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              image: const DecorationImage(
                image: AssetImage(ResourceMap.uiPanelBlue),
                fit: BoxFit.fill,
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                const Text(
                  'DEFEAT',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFFFFD166),
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  '전장을 재정비하고 다시 도전하세요.',
                  style: TextStyle(color: Colors.white70),
                ),
                const SizedBox(height: 16),
                _TextureActionButton(label: '다시 시작', onTap: onRestart),
                const SizedBox(height: 8),
                _TextureActionButton(label: '로비로', onTap: onExit),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _HexClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) {
    final Path path = Path()
      ..moveTo(size.width * 0.25, 0)
      ..lineTo(size.width * 0.75, 0)
      ..lineTo(size.width, size.height * 0.5)
      ..lineTo(size.width * 0.75, size.height)
      ..lineTo(size.width * 0.25, size.height)
      ..lineTo(0, size.height * 0.5)
      ..close();
    return path;
  }

  @override
  bool shouldReclip(covariant CustomClipper<Path> oldClipper) {
    return false;
  }
}

Color _raceColor(UnitRace race) {
  switch (race) {
    case UnitRace.human:
      return const Color(0xFF2E6FDD);
    case UnitRace.elf:
      return const Color(0xFF2D8F5C);
    case UnitRace.orc:
      return const Color(0xFF8F4032);
    case UnitRace.goblin:
      return const Color(0xFF6D7E2A);
  }
}
