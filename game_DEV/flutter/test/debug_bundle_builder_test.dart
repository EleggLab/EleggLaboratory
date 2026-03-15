import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/models/replay_data.dart';
import 'package:gamedev/services/debug_bundle_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('debug bundle builder creates report/save/replay files', () async {
    final root = await Directory.systemTemp.createTemp('bundle_test_');
    final dir = await DebugBundleService.instance.buildBundleForTest(
      saveJson: <String, dynamic>{'version': 7, 'diamonds': 10},
      source: 'unit_test',
      rootDirectory: root,
      replay: const RunReplay(
        schemaVersion: 1,
        runId: 'run_test',
        mode: 'classic',
        seed: 123,
        startedAt: 1,
        selectedCharacterId: 'dos',
        prngStateAtStart: 1,
        events: <ReplayEvent>[],
      ),
    );

    final save = File('${dir.path}${Platform.pathSeparator}save.json');
    final report = File('${dir.path}${Platform.pathSeparator}report.txt');
    final replay = File('${dir.path}${Platform.pathSeparator}replay.json');

    expect(await save.exists(), isTrue);
    expect(await report.exists(), isTrue);
    expect(await replay.exists(), isTrue);

    await dir.delete(recursive: true);
    await root.delete(recursive: true);
  });
}
