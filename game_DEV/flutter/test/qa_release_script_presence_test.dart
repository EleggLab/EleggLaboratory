import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('release QA and symbol scripts exist', () {
    const requiredScripts = <String>[
      'scripts/qa_release.ps1',
      'scripts/qa_release.sh',
      'scripts/preflight_release.ps1',
      'scripts/preflight_release.sh',
      'scripts/release_play.ps1',
      'scripts/release_play.sh',
      'scripts/sentry_upload_symbols.ps1',
      'scripts/sentry_upload_symbols.sh',
    ];

    for (final path in requiredScripts) {
      expect(
        File(path).existsSync(),
        isTrue,
        reason: 'missing release script: $path',
      );
    }
  });
}
