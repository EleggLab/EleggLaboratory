import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/models/save_data.dart';
import 'package:gamedev/models/weekly_league_data.dart';

void main() {
  test('old save loads with v4 defaults for replay/weekly fields', () {
    final legacy = SaveData.fromJson(<String, dynamic>{
      'version': 3,
      'diamonds': 15,
      'selectedCharacterId': 'dos',
      'bestLoop': 12,
      'bestLoopCharacterId': 'dos',
    });

    expect(legacy.replayIndex, isEmpty);
    expect(legacy.weeklyLeague.currentWeekKey, isNotEmpty);
    expect(legacy.weeklyLeague.currentTier, WeeklyTier.bronze);
    expect(legacy.weeklyLeague.weeklyBestScore, 0);
  });
}
