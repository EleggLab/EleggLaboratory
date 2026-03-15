import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('android targetSdk and compileSdk are pinned to 35+', () async {
    final gradleKts = File('android/app/build.gradle.kts');
    final gradle = File('android/app/build.gradle');

    String? content;
    if (await gradleKts.exists()) {
      content = await gradleKts.readAsString();
    } else if (await gradle.exists()) {
      content = await gradle.readAsString();
    }

    expect(content, isNotNull, reason: 'android app gradle file must exist');
    final compileSdk = _extractSdk(content!, key: 'compileSdk');
    final targetSdk = _extractSdk(content, key: 'targetSdk');

    expect(compileSdk, isNotNull, reason: 'compileSdk numeric value missing');
    expect(targetSdk, isNotNull, reason: 'targetSdk numeric value missing');
    expect(compileSdk!, greaterThanOrEqualTo(35));
    expect(targetSdk!, greaterThanOrEqualTo(35));
  });
}

int? _extractSdk(String content, {required String key}) {
  final patterns = <RegExp>[
    RegExp('$key\\s*=\\s*(\\d+)'),
    RegExp('${key}Version\\s*=\\s*(\\d+)'),
    RegExp('${key}Version\\s+(\\d+)'),
  ];
  for (final regex in patterns) {
    final match = regex.firstMatch(content);
    if (match == null) {
      continue;
    }
    final value = int.tryParse(match.group(1) ?? '');
    if (value != null) {
      return value;
    }
  }
  return null;
}
