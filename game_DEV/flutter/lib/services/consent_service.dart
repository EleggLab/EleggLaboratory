import 'dart:async';

import 'package:google_mobile_ads/google_mobile_ads.dart';

import 'debug_logger_service.dart';

enum ConsentRuntimeState { unknown, granted, required, notRequired, failed }

class ConsentRuntimeSnapshot {
  const ConsentRuntimeSnapshot({
    required this.state,
    required this.canRequestAds,
    required this.privacyOptionsRequired,
    this.lastError,
  });

  final ConsentRuntimeState state;
  final bool canRequestAds;
  final bool privacyOptionsRequired;
  final String? lastError;

  static const ConsentRuntimeSnapshot safeFallback = ConsentRuntimeSnapshot(
    state: ConsentRuntimeState.unknown,
    canRequestAds: false,
    privacyOptionsRequired: false,
  );

  ConsentRuntimeSnapshot copyWith({
    ConsentRuntimeState? state,
    bool? canRequestAds,
    bool? privacyOptionsRequired,
    String? lastError,
  }) {
    return ConsentRuntimeSnapshot(
      state: state ?? this.state,
      canRequestAds: canRequestAds ?? this.canRequestAds,
      privacyOptionsRequired:
          privacyOptionsRequired ?? this.privacyOptionsRequired,
      lastError: lastError ?? this.lastError,
    );
  }
}

typedef ConsentRefreshRunner =
    Future<ConsentRuntimeSnapshot> Function(bool personalizedAdsEnabled);
typedef ConsentPrivacyRunner = Future<bool> Function();

class ConsentService {
  ConsentService({
    ConsentRefreshRunner? refreshRunner,
    ConsentPrivacyRunner? privacyRunner,
  }) : _refreshRunner = refreshRunner ?? _defaultRefreshRunner,
       _privacyRunner = privacyRunner ?? _defaultPrivacyRunner;

  final ConsentRefreshRunner _refreshRunner;
  final ConsentPrivacyRunner _privacyRunner;

  ConsentRuntimeSnapshot _latest = ConsentRuntimeSnapshot.safeFallback;
  ConsentRuntimeSnapshot get latest => _latest;

  Future<ConsentRuntimeSnapshot> refresh({
    required bool personalizedAdsEnabled,
  }) async {
    try {
      final snapshot = await _refreshRunner(personalizedAdsEnabled);
      _latest = snapshot;
      return snapshot;
    } catch (error) {
      final fallback = ConsentRuntimeSnapshot.safeFallback.copyWith(
        state: ConsentRuntimeState.failed,
        lastError: error.toString(),
      );
      _latest = fallback;
      DebugLoggerService.instance.warn('Consent refresh failed: $error');
      return fallback;
    }
  }

  Future<bool> showPrivacyOptions() async {
    try {
      return await _privacyRunner();
    } catch (error) {
      DebugLoggerService.instance.warn(
        'Consent privacy options failed: $error',
      );
      return false;
    }
  }

  static Future<ConsentRuntimeSnapshot> _defaultRefreshRunner(
    bool personalizedAdsEnabled,
  ) async {
    final info = ConsentInformation.instance;
    final completer = Completer<void>();
    try {
      info.requestConsentInfoUpdate(
        ConsentRequestParameters(),
        () {
          if (!completer.isCompleted) {
            completer.complete();
          }
        },
        (formError) {
          if (!completer.isCompleted) {
            completer.completeError(formError);
          }
        },
      );
      await completer.future.timeout(const Duration(seconds: 12));
      await ConsentForm.loadAndShowConsentFormIfRequired((_) {});
      final status = await info.getConsentStatus();
      final canRequestAds = await info.canRequestAds();
      final privacy = await info.getPrivacyOptionsRequirementStatus();
      return ConsentRuntimeSnapshot(
        state: _mapConsentState(status),
        canRequestAds: canRequestAds,
        privacyOptionsRequired:
            privacy == PrivacyOptionsRequirementStatus.required,
      );
    } catch (error) {
      return ConsentRuntimeSnapshot.safeFallback.copyWith(
        state: ConsentRuntimeState.failed,
        canRequestAds: false,
        lastError: error.toString(),
      );
    }
  }

  static Future<bool> _defaultPrivacyRunner() async {
    try {
      FormError? formError;
      await ConsentForm.showPrivacyOptionsForm((error) {
        formError = error;
      });
      return formError == null;
    } catch (_) {
      return false;
    }
  }

  static ConsentRuntimeState _mapConsentState(ConsentStatus status) {
    switch (status) {
      case ConsentStatus.obtained:
        return ConsentRuntimeState.granted;
      case ConsentStatus.required:
        return ConsentRuntimeState.required;
      case ConsentStatus.notRequired:
        return ConsentRuntimeState.notRequired;
      case ConsentStatus.unknown:
        return ConsentRuntimeState.unknown;
    }
  }
}
