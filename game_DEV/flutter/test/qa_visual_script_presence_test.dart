import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('visual QA scripts exist', () {
    const requiredScripts = <String>[
      'scripts/qa_visual_android.ps1',
      'scripts/qa_visual_android.sh',
    ];

    for (final path in requiredScripts) {
      expect(
        File(path).existsSync(),
        isTrue,
        reason: 'missing visual QA script: $path',
      );
    }
  });
}
