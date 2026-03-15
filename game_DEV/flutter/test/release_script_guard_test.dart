import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test(
    'release_play scripts fail fast when key.properties is missing',
    () async {
      final ps1 = File('scripts/release_play.ps1');
      final sh = File('scripts/release_play.sh');

      expect(
        await ps1.exists(),
        isTrue,
        reason: 'scripts/release_play.ps1 missing',
      );
      expect(
        await sh.exists(),
        isTrue,
        reason: 'scripts/release_play.sh missing',
      );

      final ps1Content = await ps1.readAsString();
      final shContent = await sh.readAsString();

      expect(ps1Content, contains('android\\key.properties'));
      expect(ps1Content, contains('exit 1'));
      expect(ps1Content, contains('Missing android/key.properties'));

      expect(shContent, contains('android/key.properties'));
      expect(shContent, contains('exit 1'));
      expect(shContent, contains('missing android/key.properties'));
    },
  );
}
