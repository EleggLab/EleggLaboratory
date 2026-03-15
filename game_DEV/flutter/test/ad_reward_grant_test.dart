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

class _AlwaysRewardAdService implements IAdService {
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
    return true;
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('simulated ad flow grants daily reward', (tester) async {
    final repo = _MemorySaveRepository(null);
    final appState = AppState(
      saveRepository: repo,
      adService: _AlwaysRewardAdService(),
    );
    await appState.initialize();

    late BuildContext context;
    await tester.pumpWidget(
      MaterialApp(
        home: Builder(
          builder: (ctx) {
            context = ctx;
            return const SizedBox.shrink();
          },
        ),
      ),
    );

    final result = await appState.claimDailyRewardStepWithAd(
      context: context,
      stepIndex: 0,
    );

    expect(result.claimed, isTrue);
    expect(appState.diamonds, 10);
    expect(appState.dailyRewards.claimedFlags[0], isTrue);
  });
}
