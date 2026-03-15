import 'dart:async';

import 'package:flame/game.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../data/game_catalog.dart';
import '../../game/breaking_block_game.dart';
import '../../models/augment_data.dart';
import '../../models/character_data.dart';
import '../../state/app_state.dart';

class GameScreen extends StatefulWidget {
  const GameScreen({super.key});

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> {
  BreakingBlockGame? _game;
  CharacterData? _selectedCharacter;
  bool _initialized = false;
  bool _showingGameOverDialog = false;
  ComboToast? _toast;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_initialized) {
      return;
    }

    final appState = context.read<AppState>();
    _selectedCharacter = GameCatalog.characterById(appState.selectedCharacterId);

    _game = BreakingBlockGame(
      character: _selectedCharacter!,
      onGameOver: (reachedLoop) {
        appState.recordGameOver(
          reachedLoop: reachedLoop,
          characterId: _selectedCharacter!.id,
        );
      },
      onBossSeen: appState.recordBossSeen,
      onAugmentSeen: appState.recordAugmentSeen,
    );

    _game!.comboToast.addListener(_onComboToast);
    _game!.gameOver.addListener(_onGameOver);

    _initialized = true;
  }

  @override
  void dispose() {
    final game = _game;
    if (game != null) {
      game.comboToast.removeListener(_onComboToast);
      game.gameOver.removeListener(_onGameOver);
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final game = _game;
    if (game == null || _selectedCharacter == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      body: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onPanStart: (details) => game.beginAim(details.localPosition),
        onPanUpdate: (details) => game.updateAim(details.localPosition),
        onPanEnd: (_) => game.endAim(),
        child: GameWidget<BreakingBlockGame>(
          game: game,
          initialActiveOverlays: const <String>['hud'],
          overlayBuilderMap: {
            'hud': (_, game) => _GameHud(
                  game: game,
                  toast: _toast,
                ),
            'augmentPicker': (_, game) => _AugmentPicker(game: game),
          },
        ),
      ),
    );
  }

  void _onComboToast() {
    final nextToast = _game!.comboToast.value;
    if (nextToast == null || !mounted) {
      return;
    }

    setState(() {
      _toast = nextToast;
    });

    unawaited(
      Future<void>.delayed(const Duration(milliseconds: 1200)).then((_) {
        if (!mounted) {
          return;
        }
        setState(() {
          _toast = null;
        });
        _game?.clearComboToast();
      }),
    );
  }

  void _onGameOver() {
    final notice = _game?.gameOver.value;
    if (notice == null || _showingGameOverDialog || !mounted) {
      return;
    }

    _showingGameOverDialog = true;
    unawaited(_showGameOverDialog(notice));
  }

  Future<void> _showGameOverDialog(GameOverNotice notice) async {
    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('게임 오버'),
          content: Text('도달 루프: ${notice.reachedLoop}'),
          actions: <Widget>[
            FilledButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('확인'),
            ),
          ],
        );
      },
    );

    _game?.clearGameOverNotice();
    if (mounted) {
      Navigator.of(context).pop();
    }
  }
}

class _GameHud extends StatelessWidget {
  const _GameHud({
    required this.game,
    required this.toast,
  });

  final BreakingBlockGame game;
  final ComboToast? toast;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: ValueListenableBuilder<GameUiModel>(
        valueListenable: game.ui,
        builder: (context, ui, _) {
          return Stack(
            children: <Widget>[
              Positioned(
                top: 8,
                left: 12,
                right: 12,
                child: Row(
                  children: <Widget>[
                    _hudTag('Loop ${ui.loop}'),
                    const SizedBox(width: 8),
                    _hudTag('Ball ${ui.ownedBalls}'),
                    const Spacer(),
                    OutlinedButton.icon(
                      onPressed: () => _showAugmentList(context, game.activeAugmentList()),
                      icon: const Icon(Icons.list_alt_rounded),
                      label: const Text('증강 목록'),
                    ),
                  ],
                ),
              ),
              if (toast != null)
                Positioned(
                  top: 56,
                  left: 0,
                  right: 0,
                  child: Center(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.74),
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(color: toast!.color),
                      ),
                      child: Text(
                        toast!.message,
                        style: TextStyle(color: toast!.color, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ),
              Positioned(
                left: 12,
                right: 12,
                bottom: 12,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: <Widget>[
                    _SkillButton(
                      ui: ui,
                      onPressed: game.useCharacterSkill,
                    ),
                    const SizedBox(height: 8),
                    FilledButton.icon(
                      onPressed: ui.isTurnInProgress ? game.forceRecall : null,
                      icon: const Icon(Icons.keyboard_double_arrow_down_rounded),
                      label: const Padding(
                        padding: EdgeInsets.symmetric(vertical: 12),
                        child: Text('공 회수(턴 종료)'),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _hudTag(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.64),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        text,
        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
      ),
    );
  }

  Future<void> _showAugmentList(BuildContext context, List<AugmentData> augments) async {
    await showDialog<void>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('현재 증강'),
          content: augments.isEmpty
              ? const Text('보유 증강이 없습니다.')
              : SizedBox(
                  width: 320,
                  child: ListView.separated(
                    shrinkWrap: true,
                    itemCount: augments.length,
                    separatorBuilder: (_, __) => const Divider(height: 14),
                    itemBuilder: (_, index) {
                      final augment = augments[index];
                      return Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text(augment.icon, style: const TextStyle(fontSize: 22)),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: <Widget>[
                                Text(augment.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                                Text(augment.description),
                              ],
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ),
          actions: <Widget>[
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('닫기'),
            ),
          ],
        );
      },
    );
  }
}

class _SkillButton extends StatelessWidget {
  const _SkillButton({required this.ui, required this.onPressed});

  final GameUiModel ui;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final ratio = ui.manaCost <= 0 ? 1.0 : (ui.mana / ui.manaCost).clamp(0.0, 1.0).toDouble();
    final label = ui.skillDisabledByBoss
        ? '스킬 봉인(Weak 보스 디버프)'
        : '스킬 ${ui.mana}/${ui.manaCost}';

    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.54),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          Text(
            '${ui.characterName} 스킬',
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: ratio,
              minHeight: 8,
              backgroundColor: Colors.white24,
            ),
          ),
          const SizedBox(height: 8),
          FilledButton(
            onPressed: ui.canUseSkill ? onPressed : null,
            child: Text(label),
          ),
        ],
      ),
    );
  }
}

class _AugmentPicker extends StatelessWidget {
  const _AugmentPicker({required this.game});

  final BreakingBlockGame game;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: Colors.black.withOpacity(0.72),
      child: Center(
        child: ValueListenableBuilder<AugmentOffer?>(
          valueListenable: game.augmentOffer,
          builder: (context, offer, _) {
            if (offer == null) {
              return const SizedBox.shrink();
            }

            return Container(
              width: 360,
              constraints: const BoxConstraints(maxWidth: 360),
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.blueGrey.shade900,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white24),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: <Widget>[
                  const Text(
                    '증강 선택',
                    style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    offer.reason,
                    style: const TextStyle(color: Colors.white70),
                  ),
                  const SizedBox(height: 12),
                  ...offer.options.map((augment) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: FilledButton.tonal(
                        onPressed: () => game.selectAugment(augment.id),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: <Widget>[
                            Text('${augment.icon} ${augment.name}'),
                            Text(
                              augment.description,
                              style: const TextStyle(fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    );
                  }),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}


