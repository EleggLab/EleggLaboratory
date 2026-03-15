import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/release/release_guard.dart';

void main() {
  test('release tag is generated from pubspec version', () {
    expect(releaseTagFromVersion('1.2.3+45'), '1.2.3_45');
  });

  test('release tag sanitizes unsupported chars', () {
    expect(sanitizeReleaseTag(' 1.2.3+45/dev '), '1.2.3_45_dev');
  });

  test('parseAppVersion accepts x.y.z+build format', () {
    final parsed = parseAppVersion('2.10.7+9');
    expect(parsed, isNotNull);
    expect(parsed!.versionName, '2.10.7');
    expect(parsed.buildNumber, 9);
  });
}
