import 'package:flutter/foundation.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

import 'debug_logger_service.dart';

typedef SentryInitRunner =
    Future<void> Function(String dsn, String environment);

class CrashReportingService {
  CrashReportingService._();

  factory CrashReportingService.forTest() => CrashReportingService._();

  static final CrashReportingService instance = CrashReportingService._();

  bool _initialized = false;
  bool _enabledByUser = true;
  String _dsn = '';

  bool get isInitialized => _initialized;
  bool get isEnabled => _initialized && _enabledByUser;

  Future<void> initialize({
    required String dsn,
    required String environment,
    SentryInitRunner? initRunner,
  }) async {
    _dsn = dsn.trim();
    if (_dsn.isEmpty) {
      _initialized = false;
      DebugLoggerService.instance.info('Sentry disabled (empty DSN).');
      return;
    }
    try {
      final runner = initRunner ?? _defaultInitRunner;
      await runner(_dsn, environment);
      _initialized = true;
      DebugLoggerService.instance.info('Sentry initialized for $environment.');
    } catch (error) {
      _initialized = false;
      DebugLoggerService.instance.warn('Sentry init failed: $error');
    }
  }

  void setEnabledByUser(bool enabled) {
    _enabledByUser = enabled;
  }

  Future<void> captureError(
    Object error,
    StackTrace stackTrace, {
    String? hint,
  }) async {
    if (!isEnabled) {
      return;
    }
    try {
      await Sentry.captureException(
        error,
        stackTrace: stackTrace,
        withScope: (scope) {
          if (hint != null && hint.isNotEmpty) {
            scope.setTag('hint', hint);
          }
        },
      );
    } catch (captureError) {
      DebugLoggerService.instance.warn('Sentry capture failed: $captureError');
    }
  }

  Future<void> captureMessage(
    String message, {
    SentryLevel level = SentryLevel.warning,
  }) async {
    if (!isEnabled) {
      return;
    }
    try {
      await Sentry.captureMessage(message, level: level);
    } catch (error) {
      DebugLoggerService.instance.warn('Sentry message failed: $error');
    }
  }

  static Future<void> _defaultInitRunner(String dsn, String environment) async {
    await SentryFlutter.init((options) {
      options.dsn = dsn;
      options.environment = environment;
      options.release = 'gamedev@local';
      options.enablePrintBreadcrumbs = kDebugMode;
      options.sendDefaultPii = false;
    });
  }
}
