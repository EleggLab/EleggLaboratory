import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../data/game_catalog.dart';
import '../../state/app_state.dart';
import '../screens/game_screen.dart';

class HomeTab extends StatelessWidget {
  const HomeTab({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final bestCharacter = GameCatalog.characterById(appState.bestLoopCharacterId);
    final selectedCharacter = GameCatalog.characterById(appState.selectedCharacterId);

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text('최고 루프: ${appState.bestLoop}', style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 8),
                    Text('최고기록 캐릭터: ${bestCharacter.name}'),
                    const Divider(height: 24),
                    Text('현재 선택: ${selectedCharacter.name} ${selectedCharacter.icon}'),
                    Text('스킬 마나: ${selectedCharacter.skillManaCost}'),
                  ],
                ),
              ),
            ),
            const Spacer(),
            FilledButton.icon(
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => const GameScreen(),
                  ),
                );
              },
              icon: const Icon(Icons.play_arrow_rounded),
              label: const Padding(
                padding: EdgeInsets.symmetric(vertical: 14),
                child: Text('Play'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}


