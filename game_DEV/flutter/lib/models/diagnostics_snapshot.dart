import 'game_options.dart';
import '../services/consent_service.dart';

class DiagnosticsSnapshot {
  const DiagnosticsSnapshot({
    required this.appVersion,
    required this.buildNumber,
    required this.releaseTag,
    required this.compileSdk,
    required this.targetSdk,
    required this.adMode,
    required this.activeAdUnitMasked,
    required this.consentState,
    required this.canRequestAds,
    required this.crashReportingEnabled,
    required this.sentryDsnConfigured,
    required this.sentryDsnMasked,
    required this.symbolsRootPath,
    required this.symbolsRootExists,
    required this.lastBundlePath,
    required this.lastBundleAtIso,
  });

  final String appVersion;
  final String buildNumber;
  final String releaseTag;
  final int compileSdk;
  final int targetSdk;
  final AdMode adMode;
  final String activeAdUnitMasked;
  final ConsentRuntimeState consentState;
  final bool canRequestAds;
  final bool crashReportingEnabled;
  final bool sentryDsnConfigured;
  final String sentryDsnMasked;
  final String symbolsRootPath;
  final bool symbolsRootExists;
  final String lastBundlePath;
  final String lastBundleAtIso;

  static const int sdk35 = 35;

  factory DiagnosticsSnapshot.defaults() {
    return const DiagnosticsSnapshot(
      appVersion: 'unknown',
      buildNumber: 'unknown',
      releaseTag: 'unknown',
      compileSdk: sdk35,
      targetSdk: sdk35,
      adMode: AdMode.simulated,
      activeAdUnitMasked: '-',
      consentState: ConsentRuntimeState.unknown,
      canRequestAds: false,
      crashReportingEnabled: false,
      sentryDsnConfigured: false,
      sentryDsnMasked: '-',
      symbolsRootPath: 'build/symbols',
      symbolsRootExists: false,
      lastBundlePath: '-',
      lastBundleAtIso: '-',
    );
  }

  String toMultilineText() {
    return <String>[
      'Diagnostics',
      'appVersion: $appVersion',
      'buildNumber: $buildNumber',
      'releaseTag: $releaseTag',
      'compileSdk: $compileSdk',
      'targetSdk: $targetSdk',
      'adMode: ${adMode.name}',
      'activeAdUnit: $activeAdUnitMasked',
      'consentState: ${consentState.name}',
      'canRequestAds: $canRequestAds',
      'crashReporting: $crashReportingEnabled',
      'sentryDsnConfigured: $sentryDsnConfigured',
      'sentryDsnMasked: $sentryDsnMasked',
      'symbolsRoot: $symbolsRootPath',
      'symbolsRootExists: $symbolsRootExists',
      'lastBundleAt: $lastBundleAtIso',
      'lastBundlePath: $lastBundlePath',
    ].join('\n');
  }
}
