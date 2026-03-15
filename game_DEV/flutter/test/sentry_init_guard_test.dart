import 'package:flutter_test/flutter_test.dart';
import 'package:gamedev/services/crash_reporting_service.dart';

void main() {
  test('sentry init is skipped when DSN is empty', () async {
    final service = CrashReportingService.forTest();
    var initCalled = false;

    await service.initialize(
      dsn: '',
      environment: 'test',
      initRunner: (dsn, environment) async {
        Object.hash(dsn, environment);
        initCalled = true;
      },
    );

    expect(initCalled, isFalse);
    expect(service.isInitialized, isFalse);
  });
}
