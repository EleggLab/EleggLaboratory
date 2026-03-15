import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/models/run_record_data.dart';

void main() {
  test('run history keeps max 10 records newest-first', () {
    var list = <RunRecordData>[];
    for (var i = 0; i < 12; i++) {
      list = appendRunHistory(
        list,
        RunRecordData(
          timestampIso: DateTime(2026, 2, 1, 0, i).toIso8601String(),
          mode: 'classic',
          seed: i + 1,
          score: i * 100,
          maxLoop: i,
          bossesKilled: i % 3,
          maxCombo: i * 2,
          totalBlocksBroken: i * 10,
          characterId: 'dos',
          augmentCount: i % 5,
        ),
      );
    }

    expect(list.length, 10);
    expect(list.first.seed, 12);
    expect(list.last.seed, 3);
  });
}
