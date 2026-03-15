import 'dart:math';

class ParsedAppVersion {
  const ParsedAppVersion({
    required this.raw,
    required this.versionName,
    required this.buildNumber,
  });

  final String raw;
  final String versionName;
  final int buildNumber;
}

class PreflightIssue {
  const PreflightIssue({
    required this.code,
    required this.message,
    required this.fatal,
  });

  final String code;
  final String message;
  final bool fatal;
}

class ReleasePreflightInput {
  const ReleasePreflightInput({
    required this.version,
    required this.privacyPolicyUrl,
    required this.supportEmail,
    required this.admobAppId,
    required this.rewardedAdUnitId,
    required this.allowTestAdsOverride,
    required this.compileSdk,
    required this.targetSdk,
  });

  final String version;
  final String privacyPolicyUrl;
  final String supportEmail;
  final String admobAppId;
  final String rewardedAdUnitId;
  final bool allowTestAdsOverride;
  final int? compileSdk;
  final int? targetSdk;
}

class ReleasePreflightResult {
  const ReleasePreflightResult(this.issues);

  final List<PreflightIssue> issues;

  bool get hasFatal => issues.any((issue) => issue.fatal);
  bool get hasWarnings => issues.any((issue) => !issue.fatal);

  List<PreflightIssue> get fatalIssues =>
      issues.where((issue) => issue.fatal).toList(growable: false);

  List<PreflightIssue> get warningIssues =>
      issues.where((issue) => !issue.fatal).toList(growable: false);
}

const String admobTestAppIdAndroid = 'ca-app-pub-3940256099942544~3347511713';
const String admobTestRewardedAdUnitAndroid =
    'ca-app-pub-3940256099942544/5224354917';

ParsedAppVersion? parseAppVersion(String rawVersion) {
  final trimmed = rawVersion.trim();
  final match = RegExp(r'^(\d+)\.(\d+)\.(\d+)\+(\d+)$').firstMatch(trimmed);
  if (match == null) {
    return null;
  }
  final build = int.tryParse(match.group(4) ?? '');
  if (build == null) {
    return null;
  }
  final versionName = '${match.group(1)}.${match.group(2)}.${match.group(3)}';
  return ParsedAppVersion(
    raw: trimmed,
    versionName: versionName,
    buildNumber: build,
  );
}

String? extractVersionFromPubspec(String pubspecContent) {
  final match = RegExp(
    r'^version\s*:\s*([^\s#]+)',
    multiLine: true,
  ).firstMatch(pubspecContent);
  return match?.group(1)?.trim();
}

String sanitizeReleaseTag(String tag) {
  final sanitized = tag
      .trim()
      .replaceAll(RegExp(r'[^0-9A-Za-z._-]'), '_')
      .replaceAll(RegExp(r'_+'), '_');
  return sanitized.isEmpty ? 'unknown' : sanitized;
}

String releaseTagFromVersion(String version) {
  final parsed = parseAppVersion(version);
  if (parsed == null) {
    throw FormatException('version must be x.y.z+build', version);
  }
  return sanitizeReleaseTag('${parsed.versionName}_${parsed.buildNumber}');
}

String symbolDirPathForTag(String releaseTag) {
  final safe = sanitizeReleaseTag(releaseTag);
  return 'build/symbols/$safe';
}

bool isKnownTestAdIdentifier(String value) {
  final trimmed = value.trim();
  if (trimmed.isEmpty) {
    return false;
  }
  return trimmed == admobTestAppIdAndroid ||
      trimmed == admobTestRewardedAdUnitAndroid;
}

int? extractSdkFromGradle(String gradleContent, {required String key}) {
  final patterns = <RegExp>[
    RegExp('$key\\s*=\\s*(\\d+)'),
    RegExp('${key}Version\\s*=\\s*(\\d+)'),
    RegExp('${key}Version\\s+(\\d+)'),
  ];
  for (final pattern in patterns) {
    final match = pattern.firstMatch(gradleContent);
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

ReleasePreflightResult runReleasePreflight(ReleasePreflightInput input) {
  final issues = <PreflightIssue>[];

  final parsed = parseAppVersion(input.version);
  if (parsed == null) {
    issues.add(
      const PreflightIssue(
        code: 'VERSION_FORMAT',
        message: 'pubspec version must be x.y.z+buildNumber',
        fatal: true,
      ),
    );
  } else if (parsed.buildNumber <= 0) {
    issues.add(
      const PreflightIssue(
        code: 'BUILD_NUMBER',
        message: 'buildNumber must be greater than 0',
        fatal: true,
      ),
    );
  }

  if (input.privacyPolicyUrl.trim().isEmpty) {
    issues.add(
      const PreflightIssue(
        code: 'PRIVACY_URL_EMPTY',
        message: 'privacyPolicyUrl is empty',
        fatal: false,
      ),
    );
  }

  if (input.supportEmail.trim().isEmpty) {
    issues.add(
      const PreflightIssue(
        code: 'SUPPORT_EMAIL_EMPTY',
        message: 'supportEmail is empty',
        fatal: false,
      ),
    );
  }

  if (!input.allowTestAdsOverride) {
    if (isKnownTestAdIdentifier(input.admobAppId) ||
        isKnownTestAdIdentifier(input.rewardedAdUnitId)) {
      issues.add(
        const PreflightIssue(
          code: 'TEST_AD_ID_IN_RELEASE',
          message:
              'Test AdMob identifiers detected for release. Set ALLOW_TEST_ADS=1 to override intentionally.',
          fatal: true,
        ),
      );
    }
  }

  final compileSdk = input.compileSdk;
  if (compileSdk == null || compileSdk < 35) {
    issues.add(
      PreflightIssue(
        code: 'COMPILE_SDK',
        message: 'compileSdk must be >= 35 (current: ${compileSdk ?? 'null'})',
        fatal: true,
      ),
    );
  }

  final targetSdk = input.targetSdk;
  if (targetSdk == null || targetSdk < 35) {
    issues.add(
      PreflightIssue(
        code: 'TARGET_SDK',
        message: 'targetSdk must be >= 35 (current: ${targetSdk ?? 'null'})',
        fatal: true,
      ),
    );
  }

  return ReleasePreflightResult(issues);
}

String maskForDiagnostics(String value) {
  final trimmed = value.trim();
  if (trimmed.isEmpty) {
    return '-';
  }
  if (trimmed.length <= 8) {
    return '*' * trimmed.length;
  }
  final prefix = trimmed.substring(0, min(6, trimmed.length));
  final suffix = trimmed.substring(max(trimmed.length - 3, 0));
  return '$prefix***$suffix';
}
