import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('qa_visual_android scripts contain required selftest flags', () {
    final ps1 = File('scripts/qa_visual_android.ps1').readAsStringSync();
    final sh = File('scripts/qa_visual_android.sh').readAsStringSync();

    for (final content in <String>[ps1, sh]) {
      expect(content, contains('AIM_VISIBILITY_SELFTEST'));
      expect(content, contains('PERF_SELFTEST'));
      expect(content, contains('BOSS_SELFTEST'));
      expect(content, contains('AIM_VIS_FAIL'));
      expect(content, contains('PERF_FAIL_SEVERE'));
      expect(content, contains('BOSS_SELFTEST_FAIL'));
    }
  });
}
