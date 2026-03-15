import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/data/save_repository.dart';
import 'package:gamedev/game/deterministic_rng.dart';
import 'package:gamedev/models/game_options.dart';
import 'package:gamedev/models/save_data.dart';
import 'package:gamedev/models/weekly_league_data.dart';
import 'package:gamedev/services/ad_service.dart';
import 'package:gamedev/state/app_state.dart';

class _MemorySaveRepository implements SaveRepository {
  _MemorySaveRepository(this._loaded);

  SaveData? _loaded;
  SaveData? lastSaved;

  @override
  Future<SaveData?> loadSave() async => _loaded;

  @override
  Future<void> saveSave(SaveData saveData) async {
    lastSaved = saveData;
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

SaveData _buildSaveForWeek({
  required WeeklyTier tier,
  required int score,
  required String weekKey,
}) {
  return SaveData.fromJson(<String, dynamic>{
    'version': 3,
    'weeklyLeague': <String, dynamic>{
      'currentTier': tier.name,
      'currentWeekKey': weekKey,
      'weeklyBestScore': score,
      'weeklyBestRunId': 'run_week',
      'weeklyAttempts': 3,
      'leagueHistory': <dynamic>[],
    },
  });
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('weekly rollover promotes tier on high score', () async {
    final oldWeek = isoWeekKey(
      DateTime.now().subtract(const Duration(days: 8)),
    );
    final repo = _MemorySaveRepository(
      _buildSaveForWeek(tier: WeeklyTier.bronze, score: 6000, weekKey: oldWeek),
    );
    final appState = AppState(
      saveRepository: repo,
      adService: _NoopAdService(),
    );

    await appState.initialize();

    expect(appState.weeklyLeague.currentTier, WeeklyTier.silver);
    expect(appState.weeklyLeague.currentWeekKey, isoWeekKey(DateTime.now()));
    expect(appState.weeklyLeague.weeklyBestScore, 0);
    expect(appState.weeklyLeague.leagueHistory, isNotEmpty);
  });

  test('weekly rollover demotes tier on low score', () async {
    final oldWeek = isoWeekKey(
      DateTime.now().subtract(const Duration(days: 8)),
    );
    final repo = _MemorySaveRepository(
      _buildSaveForWeek(tier: WeeklyTier.silver, score: 1200, weekKey: oldWeek),
    );
    final appState = AppState(
      saveRepository: repo,
      adService: _NoopAdService(),
    );

    await appState.initialize();

    expect(appState.weeklyLeague.currentTier, WeeklyTier.bronze);
    expect(appState.weeklyLeague.currentWeekKey, isoWeekKey(DateTime.now()));
  });
}
