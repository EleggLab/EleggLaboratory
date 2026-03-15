import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/models/diagnostics_snapshot.dart';
import 'package:gamedev/models/game_options.dart';
import 'package:gamedev/services/consent_service.dart';

void main() {
  test('diagnostics snapshot defaults are null-safe and printable', () {
    final snapshot = DiagnosticsSnapshot.defaults();

    expect(snapshot.appVersion, isNotEmpty);
    expect(snapshot.buildNumber, isNotEmpty);
    expect(snapshot.releaseTag, isNotEmpty);
    expect(snapshot.compileSdk, greaterThan(0));
    expect(snapshot.targetSdk, greaterThan(0));
    expect(snapshot.adMode, AdMode.simulated);
    expect(snapshot.activeAdUnitMasked, isNotEmpty);
    expect(snapshot.consentState, ConsentRuntimeState.unknown);
    expect(snapshot.canRequestAds, isFalse);
    expect(snapshot.crashReportingEnabled, isFalse);
    expect(snapshot.sentryDsnConfigured, isFalse);
    expect(snapshot.sentryDsnMasked, isNotEmpty);
    expect(snapshot.symbolsRootPath, isNotEmpty);
    expect(snapshot.symbolsRootExists, isFalse);
    expect(snapshot.lastBundlePath, isNotEmpty);
    expect(snapshot.lastBundleAtIso, isNotEmpty);

    final text = snapshot.toMultilineText();
    expect(text, contains('releaseTag'));
    expect(text, contains('compileSdk'));
    expect(text, contains('targetSdk'));
    expect(text, contains('adMode'));
    expect(text, contains('activeAdUnit'));
    expect(text, contains('consentState'));
    expect(text, contains('sentryDsnConfigured'));
    expect(text, contains('symbolsRoot'));
  });
}
