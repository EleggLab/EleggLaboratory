import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

import '../models/game_options.dart';
import '../ui/theme/app_tokens.dart';
import '../ui/widgets/primary_button.dart';
import 'debug_logger_service.dart';

const String kAdmobTestAppIdAndroid = 'ca-app-pub-3940256099942544~3347511713';
const String kAdmobTestRewardedUnitIdAndroid =
    'ca-app-pub-3940256099942544/5224354917';

class AdRuntimeSettings {
  const AdRuntimeSettings({
    required this.mode,
    required this.consentAllowsRealAds,
    required this.personalizedAdsEnabled,
    required this.productionRewardedAdUnitId,
  });

  final AdMode mode;
  final bool consentAllowsRealAds;
  final bool personalizedAdsEnabled;
  final String productionRewardedAdUnitId;
}

typedef AdRuntimeSettingsProvider = AdRuntimeSettings Function();
typedef SimulatedAdConfirmRunner =
    Future<bool> Function(
      BuildContext context,
      String placement,
      String rewardText,
    );

abstract class IAdService {
  Future<bool> showRewardedAd({
    required BuildContext context,
    required String placement,
    required String rewardText,
  });

  String? consumeLastFailureMessage() => null;
  AdMode get activeMode => AdMode.simulated;
}

Future<bool> showSimulatedAdConfirmSheet({
  required BuildContext context,
  required String rewardText,
}) async {
  final accepted = await showModalBottomSheet<bool>(
    context: context,
    showDragHandle: true,
    isScrollControlled: true,
    builder: (sheetContext) {
      final theme = Theme.of(sheetContext);
      return SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              Text('Ad Reward', style: theme.textTheme.titleMedium),
              const SizedBox(height: AppTokens.space8),
              Text(
                'Watch an ad and claim this reward?',
                style: theme.textTheme.bodyMedium,
              ),
              const SizedBox(height: AppTokens.space8),
              Text('Reward: $rewardText', style: theme.textTheme.bodySmall),
              const SizedBox(height: AppTokens.space16),
              Row(
                children: <Widget>[
                  Expanded(
                    child: PrimaryButton.secondary(
                      label: 'Cancel',
                      onPressed: () => Navigator.of(sheetContext).pop(false),
                      minHeight: 46,
                    ),
                  ),
                  const SizedBox(width: AppTokens.space12),
                  Expanded(
                    child: PrimaryButton(
                      label: 'Confirm',
                      onPressed: () => Navigator.of(sheetContext).pop(true),
                      minHeight: 46,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      );
    },
  );
  return accepted == true;
}

class FakeAdService implements IAdService {
  FakeAdService({SimulatedAdConfirmRunner? confirmRunner})
    : _confirmRunner = confirmRunner;

  final SimulatedAdConfirmRunner? _confirmRunner;

  @override
  AdMode get activeMode => AdMode.simulated;

  @override
  String? consumeLastFailureMessage() => null;

  @override
  Future<bool> showRewardedAd({
    required BuildContext context,
    required String placement,
    required String rewardText,
  }) async {
    final runner = _confirmRunner;
    if (runner != null) {
      return runner(context, placement, rewardText);
    }
    return showSimulatedAdConfirmSheet(
      context: context,
      rewardText: rewardText,
    );
  }
}

class ManagedAdService implements IAdService {
  ManagedAdService({
    required AdRuntimeSettingsProvider settingsProvider,
    SimulatedAdConfirmRunner? simulatedConfirmRunner,
  }) : _settingsProvider = settingsProvider,
       _simulatedConfirmRunner = simulatedConfirmRunner;

  final AdRuntimeSettingsProvider _settingsProvider;
  final SimulatedAdConfirmRunner? _simulatedConfirmRunner;

  bool _mobileAdsInitialized = false;
  String? _lastFailureMessage;

  @override
  AdMode get activeMode => _settingsProvider().mode;

  @override
  String? consumeLastFailureMessage() {
    final message = _lastFailureMessage;
    _lastFailureMessage = null;
    return message;
  }

  @override
  Future<bool> showRewardedAd({
    required BuildContext context,
    required String placement,
    required String rewardText,
  }) async {
    _lastFailureMessage = null;
    final settings = _settingsProvider();
    if (settings.mode == AdMode.simulated) {
      final runner = _simulatedConfirmRunner;
      if (runner != null) {
        return runner(context, placement, rewardText);
      }
      return showSimulatedAdConfirmSheet(
        context: context,
        rewardText: rewardText,
      );
    }

    if (!settings.consentAllowsRealAds) {
      _lastFailureMessage =
          'Privacy consent required. Using simulated ads mode.';
      DebugLoggerService.instance.warn(
        'Rewarded ad blocked by consent. mode=${settings.mode.name}',
      );
      return false;
    }

    var adUnitId = '';
    if (settings.mode == AdMode.realTest) {
      adUnitId = kAdmobTestRewardedUnitIdAndroid;
    } else {
      adUnitId = settings.productionRewardedAdUnitId.trim();
      if (adUnitId.isEmpty) {
        DebugLoggerService.instance.warn(
          'Production ad unit missing. Fallback to test rewarded unit.',
        );
        adUnitId = kAdmobTestRewardedUnitIdAndroid;
      }
    }

    await _ensureMobileAdsInitialized();
    return _showRealRewarded(
      adUnitId: adUnitId,
      personalizedAdsEnabled: settings.personalizedAdsEnabled,
    );
  }

  Future<void> _ensureMobileAdsInitialized() async {
    if (_mobileAdsInitialized) {
      return;
    }
    try {
      await MobileAds.instance.initialize();
      _mobileAdsInitialized = true;
    } catch (error) {
      _lastFailureMessage = 'Failed to initialize ads.';
      DebugLoggerService.instance.warn('MobileAds initialize failed: $error');
    }
  }

  Future<bool> _showRealRewarded({
    required String adUnitId,
    required bool personalizedAdsEnabled,
  }) async {
    final loadCompleter = Completer<RewardedAd?>();
    final adRequest = AdRequest(
      nonPersonalizedAds: personalizedAdsEnabled ? null : true,
    );

    RewardedAd.load(
      adUnitId: adUnitId,
      request: adRequest,
      rewardedAdLoadCallback: RewardedAdLoadCallback(
        onAdLoaded: (ad) {
          if (!loadCompleter.isCompleted) {
            loadCompleter.complete(ad);
          } else {
            ad.dispose();
          }
        },
        onAdFailedToLoad: (error) {
          if (!loadCompleter.isCompleted) {
            loadCompleter.complete(null);
          }
          _lastFailureMessage = 'Could not load rewarded ad.';
          DebugLoggerService.instance.warn('Rewarded load failed: $error');
        },
      ),
    );

    RewardedAd? ad;
    try {
      ad = await loadCompleter.future.timeout(const Duration(seconds: 12));
    } catch (_) {
      _lastFailureMessage = 'Ad loading timeout.';
      return false;
    }

    if (ad == null) {
      _lastFailureMessage ??= 'Could not load rewarded ad.';
      return false;
    }

    final showCompleter = Completer<bool>();
    var rewardEarned = false;
    ad.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (ad) {
        ad.dispose();
        if (!showCompleter.isCompleted) {
          showCompleter.complete(rewardEarned);
        }
      },
      onAdFailedToShowFullScreenContent: (ad, error) {
        ad.dispose();
        _lastFailureMessage = 'Could not show rewarded ad.';
        DebugLoggerService.instance.warn('Rewarded show failed: $error');
        if (!showCompleter.isCompleted) {
          showCompleter.complete(false);
        }
      },
    );

    try {
      await ad.show(
        onUserEarnedReward: (adRewarded, rewardItem) {
          DebugLoggerService.instance.info(
            'Reward earned amount=${rewardItem.amount} '
            'type=${rewardItem.type} '
            'response=${adRewarded.responseInfo?.responseId ?? '-'}',
          );
          rewardEarned = true;
        },
      );
    } catch (error) {
      ad.dispose();
      _lastFailureMessage = 'Could not show rewarded ad.';
      DebugLoggerService.instance.warn('Rewarded show throw: $error');
      return false;
    }

    try {
      return await showCompleter.future.timeout(
        const Duration(seconds: 30),
        onTimeout: () {
          _lastFailureMessage = 'Ad reward timeout.';
          return false;
        },
      );
    } catch (error) {
      _lastFailureMessage = 'Ad reward flow failed.';
      DebugLoggerService.instance.warn('Rewarded completion failed: $error');
      return false;
    }
  }
}
