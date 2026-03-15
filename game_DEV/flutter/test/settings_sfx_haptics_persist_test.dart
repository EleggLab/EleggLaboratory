import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
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
  test('settings persist sfx and haptics toggles', () async {
    final repository = _MemorySaveRepository(null);

    final appState = AppState(
      saveRepository: repository,
      adService: _NoopAdService(),
    );
    await appState.initialize();
    appState.updateGameOptions(sfxEnabled: false, vibrationEnabled: false);

    expect(appState.gameOptions.sfxEnabled, isFalse);
    expect(appState.gameOptions.vibrationEnabled, isFalse);

    final restored = AppState(
      saveRepository: repository,
      adService: _NoopAdService(),
    );
    await restored.initialize();

    expect(restored.gameOptions.sfxEnabled, isFalse);
    expect(restored.gameOptions.vibrationEnabled, isFalse);
  });
}
