import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../data/game_catalog.dart';
import '../../models/augment_data.dart';
import '../../models/boss_data.dart';
import '../../models/character_data.dart';
import '../../state/app_state.dart';

class CodexTab extends StatelessWidget {
  const CodexTab({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();

    final children = <Widget>[
      _SectionHeader(title: '캐릭터'),
      ...GameCatalog.characters.map((character) {
        final unlocked = appState.unlockedCharacterIds.contains(character.id);
        final selected = appState.selectedCharacterId == character.id;
        return _CodexTile(
          icon: character.icon,
          title: unlocked ? character.name : '잠김',
          subtitle: unlocked ? character.description : '실루엣',
          isLocked: !unlocked,
          trailing: unlocked && selected ? '장착중' : null,
          onTap: () => _showCharacterDialog(context, character, unlocked),
        );
      }),
      _SectionHeader(title: '보스'),
      ...GameCatalog.bosses.map((boss) {
        final seen = appState.codexSeenBossIds.contains(boss.id);
        return _CodexTile(
          icon: boss.icon,
          title: seen ? boss.name : '???',
          subtitle: seen ? boss.description : '아직 만나지 못했습니다.',
          isLocked: !seen,
          onTap: () => _showBossDialog(context, boss, seen),
        );
      }),
      _SectionHeader(title: '증강'),
      ...GameCatalog.augments.map((augment) {
        final seen = appState.codexSeenAugmentIds.contains(augment.id);
        return _CodexTile(
          icon: augment.icon,
          title: seen ? augment.name : '???',
          subtitle: seen ? augment.description : '아직 획득하지 못했습니다.',
          isLocked: !seen,
          onTap: () => _showAugmentDialog(context, augment, seen),
        );
      }),
      const SizedBox(height: 12),
    ];

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: children,
      ),
    );
  }

  Future<void> _showCharacterDialog(
    BuildContext context,
    CharacterData character,
    bool unlocked,
  ) async {
    await showDialog<void>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: Text(unlocked ? character.name : '잠긴 캐릭터'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              _placeholderImage(unlocked ? character.icon : '?'),
              const SizedBox(height: 12),
              Text(unlocked ? character.description : '다이아 1개로 해금할 수 있습니다.'),
              const SizedBox(height: 8),
              Text('마나 코스트: ${character.skillManaCost}'),
            ],
          ),
          actions: <Widget>[
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('닫기'),
            ),
            if (!unlocked)
              FilledButton(
                onPressed: () {
                  final success = context.read<AppState>().unlockCharacter(character.id);
                  if (success) {
                    Navigator.of(dialogContext).pop();
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('다이아가 부족합니다.')),
                    );
                  }
                },
                child: const Text('다이아 1개로 해금'),
              )
            else
              FilledButton(
                onPressed: () {
                  context.read<AppState>().selectCharacter(character.id);
                  Navigator.of(dialogContext).pop();
                },
                child: const Text('선택(장착)'),
              ),
          ],
        );
      },
    );
  }

  Future<void> _showBossDialog(BuildContext context, BossCodexData boss, bool seen) async {
    await showDialog<void>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: Text(seen ? boss.name : '잠긴 보스'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              _placeholderImage(seen ? boss.icon : '?'),
              const SizedBox(height: 12),
              Text(seen ? boss.description : '아직 만난 적이 없습니다.'),
              const SizedBox(height: 8),
              Text('등급: ${_tierText(boss.tier)} / 크기: ${boss.width}x${boss.height}'),
            ],
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

  Future<void> _showAugmentDialog(BuildContext context, AugmentData augment, bool seen) async {
    await showDialog<void>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: Text(seen ? augment.name : '잠긴 증강'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              _placeholderImage(seen ? augment.icon : '?'),
              const SizedBox(height: 12),
              Text(seen ? augment.description : '런 중 획득 시 도감에 등록됩니다.'),
            ],
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

  String _tierText(BossTier tier) {
    switch (tier) {
      case BossTier.weak:
        return 'Weak';
      case BossTier.medium:
        return 'Medium';
      case BossTier.strong:
        return 'Strong';
    }
  }

  Widget _placeholderImage(String icon) {
    return Container(
      width: 120,
      height: 120,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: Colors.black12,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        icon,
        style: const TextStyle(fontSize: 44),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 14, 4, 8),
      child: Text(
        title,
        style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
      ),
    );
  }
}

class _CodexTile extends StatelessWidget {
  const _CodexTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.isLocked,
    required this.onTap,
    this.trailing,
  });

  final String icon;
  final String title;
  final String subtitle;
  final bool isLocked;
  final VoidCallback onTap;
  final String? trailing;

  @override
  Widget build(BuildContext context) {
    final color = isLocked ? Colors.grey : Colors.blueGrey;
    return Card(
      color: isLocked ? Colors.grey.shade300 : null,
      child: ListTile(
        onTap: onTap,
        leading: CircleAvatar(
          backgroundColor: color.shade700,
          child: Opacity(
            opacity: isLocked ? 0.28 : 1,
            child: Text(
              icon,
              style: TextStyle(
                color: isLocked ? Colors.black : Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
        title: Text(title),
        subtitle: Text(subtitle),
        trailing: trailing != null
            ? Chip(label: Text(trailing!))
            : isLocked
                ? const Icon(Icons.lock)
                : const Icon(Icons.chevron_right),
      ),
    );
  }
}


