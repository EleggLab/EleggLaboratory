import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/data/meta_catalog.dart';
import 'package:gamedev/data/save_repository.dart';
import 'package:gamedev/models/game_options.dart';
import 'package:gamedev/models/save_data.dart';
import 'package:gamedev/services/ad_service.dart';
import 'package:gamedev/state/app_state.dart';

class _MemorySaveRepository implements SaveRepository {
  _MemorySaveRepository(this._loaded);

  SaveData? _loaded;

  @override
  Future<SaveData?> loadSave() async => _loaded;

  @override
  Future<void> saveSave(SaveData saveData) async {
    _loaded = saveData;
  }
}

class _NoopAdService implements IAdService {
  @override
  AdMode get activeMode => AdMode.simulated;

  @override
  String? consumeLastFailureMessage() => null;

  @override
  Future<bool> showRewardedAd({
    required BuildContext context,
    required String placement,
    required String rewardText,
  }) async {
    return false;
  }
}

void main() {
  test('achievement claim grants reward once', () async {
    final appState = AppState(
      saveRepository: _MemorySaveRepository(null),
      adService: _NoopAdService(),
    );
    await appState.initialize();

    const achievementId = 'ach_loop_10';
    final reward = MetaCatalog.achievements
        .firstWhere((a) => a.id == achievementId)
        .rewardDiamonds;

    final unlocked = appState.registerRunAchievements(
      const RunAchievementInput(
        mode: 'classic',
        maxLoop: 10,
        maxCombo: 0,
        bossesKilled: 0,
        clearAchieved: false,
        purchasedEpicInShop: false,
        unlockedCharacterCount: 1,
        totalCharacterCount: 5,
        seedCopied: false,
      ),
    );

    expect(unlocked, contains(achievementId));
    final beforeDiamonds = appState.diamonds;
    expect(appState.claimAchievement(achievementId), isTrue);
    expect(appState.diamonds, beforeDiamonds + reward);
    expect(appState.claimAchievement(achievementId), isFalse);
  });
}
