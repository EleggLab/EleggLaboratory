import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/models/diagnostics_snapshot.dart';

void main() {
  test('release readiness diagnostics builds with safe defaults', () {
    final snapshot = DiagnosticsSnapshot.defaults();

    expect(snapshot.releaseTag, isNotEmpty);
    expect(snapshot.activeAdUnitMasked, isNotEmpty);
    expect(snapshot.sentryDsnConfigured, isFalse);
    expect(snapshot.sentryDsnMasked, isNotEmpty);
    expect(snapshot.symbolsRootPath, isNotEmpty);
    expect(snapshot.symbolsRootExists, isFalse);

    final text = snapshot.toMultilineText();
    expect(text, contains('releaseTag'));
    expect(text, contains('activeAdUnit'));
    expect(text, contains('sentryDsnConfigured'));
    expect(text, contains('symbolsRoot'));
  });
}
