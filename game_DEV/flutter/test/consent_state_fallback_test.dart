import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/services/consent_service.dart';

void main() {
  test('consent failure falls back safely without crash', () async {
    final service = ConsentService(
      refreshRunner: (_) async => throw StateError('ump_fail'),
    );

    final snapshot = await service.refresh(personalizedAdsEnabled: true);

    expect(snapshot.canRequestAds, isFalse);
    expect(snapshot.state, ConsentRuntimeState.failed);
    expect(snapshot.lastError, isNotNull);
  });
}
