import 'dart:math';

import 'package:flutter/material.dart';

import '../app/player_profile.dart';
import '../audio/sfx_service.dart';
import '../game/data/game_data.dart';
import '../game/models/unit_definition.dart';
import '../resources/resource_map.dart';

Future<void> showGachaDialog({
  required BuildContext context,
  required PlayerProfile profile,
}) {
  return showDialog<void>(
    context: context,
    barrierDismissible: false,
    builder: (BuildContext context) {
      return _GachaDialog(profile: profile);
    },
  );
}

class _GachaDialog extends StatefulWidget {
  const _GachaDialog({required this.profile});

  final PlayerProfile profile;

  @override
  State<_GachaDialog> createState() => _GachaDialogState();
}

class _GachaDialogState extends State<_GachaDialog> {
  final Random _random = Random();
  bool _rolling = false;
  UnitDefinition? _result;
  String _message = '고대의 제단이 당신을 기다립니다.';

  @override
  Widget build(BuildContext context) {
    final UnitDefinition? result = _result;
    final int gems = widget.profile.gems;

    return Dialog(
      backgroundColor: Colors.transparent,
      child: Container(
        width: 320,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFF141F2C),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white24),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            const Text(
              '고대의 제단',
              style: TextStyle(
                fontFamily: ResourceMap.fontTitle,
                fontSize: 28,
                color: Color(0xFFFFD166),
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: 200,
              child: Stack(
                fit: StackFit.expand,
                children: <Widget>[
                  Container(
                    decoration: BoxDecoration(
                      gradient: RadialGradient(
                        colors: <Color>[
                          if (result == null)
                            const Color(0xFF18314A)
                          else
                            _tierColor(result.tier),
                          const Color(0xFF0C1521),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  if (_rolling)
                    Opacity(
                      opacity: 0.92,
                      child: Image.asset(
                        ResourceMap.vfxGradientRadial,
                        fit: BoxFit.cover,
                      ),
                    ),
                  if (result == null)
                    const Center(
                      child: Text(
                        '???',
                        style: TextStyle(
                          fontSize: 44,
                          fontWeight: FontWeight.w900,
                          color: Colors.white24,
                        ),
                      ),
                    )
                  else
                    Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: <Widget>[
                          Image.asset(
                            result.placeholderAsset,
                            width: 84,
                            height: 84,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            result.name,
                            style: const TextStyle(
                              fontSize: 22,
                              fontFamily: ResourceMap.fontTitle,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            'Tier ${result.tier}',
                            style: const TextStyle(
                              fontSize: 13,
                              color: Color(0xFFFFD166),
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _message,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 12, color: Colors.white70),
            ),
            const SizedBox(height: 12),
            Row(
              children: <Widget>[
                Expanded(
                  child: OutlinedButton(
                    onPressed: _rolling
                        ? null
                        : () {
                            Navigator.of(context).pop();
                          },
                    child: const Text('닫기'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: FilledButton(
                    onPressed: _rolling
                        ? null
                        : () {
                            _rollGacha();
                          },
                    child: Text('소환 (100)  [Gem: $gems]'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _rollGacha() async {
    if (!widget.profile.spendGems(100)) {
      setState(() {
        _message = '젬이 부족합니다.';
      });
      return;
    }

    setState(() {
      _rolling = true;
      _result = null;
      _message = '제단이 반응합니다...';
    });

    await SfxService.instance.startLoop(
      ResourceMap.audioEngineLoop,
      volume: 0.3,
    );
    await Future<void>.delayed(const Duration(milliseconds: 1300));
    await SfxService.instance.stopLoop();

    final UnitDefinition pulled = _pickByProbability();
    final bool isNew = widget.profile.unlockUnit(pulled.id);
    if (!isNew) {
      widget.profile.addGold(25);
    }

    await SfxService.instance.play(
      ResourceMap.audioJingleAchievement,
      volume: 0.7,
    );

    if (!mounted) {
      return;
    }
    setState(() {
      _rolling = false;
      _result = pulled;
      _message = isNew
          ? '${pulled.name} 획득!'
          : '${pulled.name} 중복 획득 -> 골드 25 전환';
    });
  }

  UnitDefinition _pickByProbability() {
    final double roll = _random.nextDouble() * 100;
    final int tier = roll < 70
        ? 1
        : roll < 95
        ? 2
        : 3;
    final List<UnitDefinition> pool =
        playableUnitsByTier[tier] ?? <UnitDefinition>[];
    if (pool.isEmpty) {
      return allPlayableUnits[_random.nextInt(allPlayableUnits.length)];
    }
    return pool[_random.nextInt(pool.length)];
  }

  Color _tierColor(int tier) {
    switch (tier) {
      case 1:
        return Colors.white.withValues(alpha: 0.4);
      case 2:
        return const Color(0xFF60A5FA).withValues(alpha: 0.52);
      case 3:
        return const Color(0xFFFFD166).withValues(alpha: 0.58);
      default:
        return Colors.white.withValues(alpha: 0.3);
    }
  }
}
