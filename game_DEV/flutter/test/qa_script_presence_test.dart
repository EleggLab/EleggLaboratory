import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('required QA scripts exist', () {
    const requiredScripts = <String>[
      'scripts/qa.ps1',
      'scripts/qa.sh',
      'scripts/qa_smoke_android.ps1',
      'scripts/qa_smoke_android.sh',
      'scripts/qa_all.ps1',
      'scripts/qa_all.sh',
    ];

    for (final path in requiredScripts) {
      expect(
        File(path).existsSync(),
        isTrue,
        reason: 'missing required QA script: $path',
      );
    }
  });
}
