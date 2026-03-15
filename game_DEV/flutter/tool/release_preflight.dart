import 'dart:convert';
import 'dart:io';

import 'package:gamedev/release/release_guard.dart';

void main(List<String> args) {
  final printTagOnly = args.contains('--print-tag-only');

  final pubspecFile = File('pubspec.yaml');
  if (!pubspecFile.existsSync()) {
    stderr.writeln('[preflight][FAIL] pubspec.yaml not found.');
    exit(1);
  }

  final pubspecText = pubspecFile.readAsStringSync();
  final version = extractVersionFromPubspec(pubspecText) ?? '';

  if (printTagOnly) {
    final parsed = parseAppVersion(version);
    if (parsed == null) {
      stderr.writeln('invalid_version');
      exit(1);
    }
    stdout.writeln(releaseTagFromVersion(version));
    return;
  }

  final appConfig = _loadAppConfig();
  final gradleContent = _loadGradleContent();
  final compileSdk = gradleContent == null
      ? null
      : extractSdkFromGradle(gradleContent, key: 'compileSdk');
  final targetSdk = gradleContent == null
      ? null
      : extractSdkFromGradle(gradleContent, key: 'targetSdk');

  final allowTestAdsOverride =
      (Platform.environment['ALLOW_TEST_ADS'] ?? '').trim() == '1';

  final result = runReleasePreflight(
    ReleasePreflightInput(
      version: version,
      privacyPolicyUrl: appConfig['privacyPolicyUrl']?.toString() ?? '',
      supportEmail: appConfig['supportEmail']?.toString() ?? '',
      admobAppId: appConfig['ads'] is Map
          ? (appConfig['ads'] as Map)['admobAppIdAndroid']?.toString() ?? ''
          : '',
      rewardedAdUnitId: appConfig['ads'] is Map
          ? (appConfig['ads'] as Map)['rewardedAdUnitIdAndroid']?.toString() ??
                ''
          : '',
      allowTestAdsOverride: allowTestAdsOverride,
      compileSdk: compileSdk,
      targetSdk: targetSdk,
    ),
  );

  stdout.writeln(
    '[preflight] version=${version.isEmpty ? 'unknown' : version}',
  );
  if (parseAppVersion(version) != null) {
    stdout.writeln('[preflight] releaseTag=${releaseTagFromVersion(version)}');
  }

  for (final warning in result.warningIssues) {
    stdout.writeln('[preflight][WARN][${warning.code}] ${warning.message}');
  }
  for (final error in result.fatalIssues) {
    stderr.writeln('[preflight][FAIL][${error.code}] ${error.message}');
  }

  if (result.hasFatal) {
    exit(1);
  }

  stdout.writeln('[preflight] PASS');
}

Map<String, dynamic> _loadAppConfig() {
  final file = File('assets/config/app_config.json');
  if (!file.existsSync()) {
    return <String, dynamic>{};
  }
  try {
    final raw = file.readAsStringSync();
    final decoded = jsonDecode(raw);
    if (decoded is Map<String, dynamic>) {
      return decoded;
    }
    if (decoded is Map) {
      return Map<String, dynamic>.from(decoded);
    }
  } catch (_) {
    return <String, dynamic>{};
  }
  return <String, dynamic>{};
}

String? _loadGradleContent() {
  final kts = File('android/app/build.gradle.kts');
  if (kts.existsSync()) {
    return kts.readAsStringSync();
  }
  final gradle = File('android/app/build.gradle');
  if (gradle.existsSync()) {
    return gradle.readAsStringSync();
  }
  return null;
}
