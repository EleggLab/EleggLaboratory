import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:provider/provider.dart';

import '../../models/diagnostics_snapshot.dart';
import '../../models/game_options.dart';
import '../../release/release_guard.dart';
import '../../services/ad_service.dart';
import '../../services/debug_bundle_service.dart';
import '../../state/app_state.dart';
import '../i18n/ui_text.dart';
import '../theme/app_tokens.dart';
import 'app_toast.dart';
import 'primary_button.dart';
import 'skin_asset.dart';
import 'ui_feedback.dart';

Future<void> showOptionsSheet(BuildContext context) {
  return showModalBottomSheet<void>(
    context: context,
    useSafeArea: true,
    showDragHandle: true,
    isScrollControlled: true,
    builder: (sheetContext) {
      return const _OptionsSheetContent();
    },
  );
}

class _OptionsSheetContent extends StatefulWidget {
  const _OptionsSheetContent();

  @override
  State<_OptionsSheetContent> createState() => _OptionsSheetContentState();
}

class _OptionsSheetContentState extends State<_OptionsSheetContent> {
  bool _consentBusy = false;

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final options = appState.gameOptions;
    final theme = Theme.of(context);
    String t(String ko, String en) => trByLanguage(options, ko: ko, en: en);

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppTokens.space16,
        AppTokens.space8,
        AppTokens.space16,
        AppTokens.space16,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Row(
              children: <Widget>[
                OptionalAssetIcon(
                  assetPath: 'assets/icons/gear.png',
                  fallbackIcon: Icons.settings_rounded,
                  color: theme.colorScheme.primary,
                  size: 20,
                ),
                const SizedBox(width: AppTokens.space8),
                Text(
                  t('\uc635\uc158', 'Options'),
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppTokens.space12),
            Text(
              t('\uc5b8\uc5b4', 'Language'),
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: AppTokens.space8),
            SegmentedButton<UiLanguage>(
              segments: const <ButtonSegment<UiLanguage>>[
                ButtonSegment<UiLanguage>(
                  value: UiLanguage.ko,
                  label: Text('\ud55c\uad6d\uc5b4'),
                ),
                ButtonSegment<UiLanguage>(
                  value: UiLanguage.en,
                  label: Text('English'),
                ),
              ],
              selected: <UiLanguage>{options.uiLanguage},
              onSelectionChanged: (selection) {
                if (selection.isEmpty) {
                  return;
                }
                UiFeedback.tap();
                appState.updateGameOptions(uiLanguage: selection.first);
              },
            ),
            const SizedBox(height: AppTokens.space16),
            _SectionTitle(
              label: t('\ud50c\ub808\uc774/\ud6a8\uacfc', 'Gameplay / Effects'),
            ),
            SwitchListTile.adaptive(
              contentPadding: EdgeInsets.zero,
              title: Text(t('\uc0ac\uc6b4\ub4dc \ud6a8\uacfc', 'SFX')),
              subtitle: Text(
                t(
                  'UI\uc640 \uc778\uac8c\uc784 \uc0ac\uc6b4\ub4dc \ud53c\ub4dc\ubc31',
                  'UI and in-game sound feedback',
                ),
              ),
              value: options.sfxEnabled,
              onChanged: (enabled) {
                UiFeedback.tap();
                appState.updateGameOptions(sfxEnabled: enabled);
              },
              secondary: OptionalAssetIcon(
                assetPath: options.sfxEnabled
                    ? 'assets/icons/sound_on.png'
                    : 'assets/icons/sound_off.png',
                fallbackIcon: options.sfxEnabled
                    ? Icons.volume_up_rounded
                    : Icons.volume_off_rounded,
                color: theme.colorScheme.primary,
              ),
            ),
            SwitchListTile.adaptive(
              contentPadding: EdgeInsets.zero,
              title: Text(t('\uc9c4\ub3d9', 'Vibration')),
              subtitle: Text(
                t(
                  '\ud130\uce58 \ud53c\ub4dc\ubc31 \uc9c4\ub3d9',
                  'Haptic feedback on interactions',
                ),
              ),
              value: options.vibrationEnabled,
              onChanged: (enabled) {
                UiFeedback.tap();
                appState.updateGameOptions(vibrationEnabled: enabled);
              },
              secondary: OptionalAssetIcon(
                assetPath: options.vibrationEnabled
                    ? 'assets/icons/vibration_on.png'
                    : 'assets/icons/vibration_off.png',
                fallbackIcon: options.vibrationEnabled
                    ? Icons.vibration_rounded
                    : Icons.do_not_disturb_on_rounded,
                color: theme.colorScheme.primary,
              ),
            ),
            const SizedBox(height: AppTokens.space8),
            Text(
              t(
                '\ube44\uc8fc\uc5bc \ud6a8\uacfc \uac15\ub3c4',
                'VFX Intensity',
              ),
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: AppTokens.space8),
            SegmentedButton<VfxIntensity>(
              segments: <ButtonSegment<VfxIntensity>>[
                ButtonSegment<VfxIntensity>(
                  value: VfxIntensity.low,
                  label: Text(t('\ub0ae\uc74c', 'Low')),
                ),
                ButtonSegment<VfxIntensity>(
                  value: VfxIntensity.medium,
                  label: Text(t('\ubcf4\ud1b5', 'Medium')),
                ),
                ButtonSegment<VfxIntensity>(
                  value: VfxIntensity.high,
                  label: Text(t('\ub192\uc74c', 'High')),
                ),
              ],
              selected: <VfxIntensity>{options.vfxIntensity},
              onSelectionChanged: (selection) {
                if (selection.isEmpty) {
                  return;
                }
                UiFeedback.tap();
                appState.updateGameOptions(vfxIntensity: selection.first);
              },
            ),
            const SizedBox(height: AppTokens.space12),
            Text(
              t('\uc870\uc900\uc120 \uc2a4\ud0c0\uc77c', 'Aim Line Style'),
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: AppTokens.space8),
            SegmentedButton<AimLineStyle>(
              segments: <ButtonSegment<AimLineStyle>>[
                ButtonSegment<AimLineStyle>(
                  value: AimLineStyle.fancy,
                  label: Text(t('\uace0\uae09', 'Fancy')),
                ),
                ButtonSegment<AimLineStyle>(
                  value: AimLineStyle.simple,
                  label: Text(t('\uac04\ub2e8', 'Simple')),
                ),
              ],
              selected: <AimLineStyle>{options.aimLineStyle},
              onSelectionChanged: (selection) {
                if (selection.isEmpty) {
                  return;
                }
                UiFeedback.tap();
                appState.updateGameOptions(aimLineStyle: selection.first);
              },
            ),
            const SizedBox(height: AppTokens.space12),
            Text(
              t('\uc608\uce21\uc120 \uae38\uc774', 'Aim Preview Length'),
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: AppTokens.space8),
            SegmentedButton<AimPreviewLength>(
              segments: <ButtonSegment<AimPreviewLength>>[
                ButtonSegment<AimPreviewLength>(
                  value: AimPreviewLength.short,
                  label: Text(t('\uc9e7\uc74c', 'Short')),
                ),
                ButtonSegment<AimPreviewLength>(
                  value: AimPreviewLength.standard,
                  label: Text(t('\ud45c\uc900', 'Standard')),
                ),
                ButtonSegment<AimPreviewLength>(
                  value: AimPreviewLength.long,
                  label: Text(t('\uae40', 'Long')),
                ),
              ],
              selected: <AimPreviewLength>{options.aimPreviewLength},
              onSelectionChanged: (selection) {
                if (selection.isEmpty) {
                  return;
                }
                UiFeedback.tap();
                appState.updateGameOptions(aimPreviewLength: selection.first);
              },
            ),
            const SizedBox(height: AppTokens.space12),
            Text(
              t(
                '\uae30\ubcf8 \uc2dc\ubbac\ub808\uc774\uc158 \uc18d\ub3c4',
                'Default Sim Speed',
              ),
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: AppTokens.space8),
            SegmentedButton<int>(
              segments: const <ButtonSegment<int>>[
                ButtonSegment<int>(value: 1, label: Text('1x')),
                ButtonSegment<int>(value: 2, label: Text('2x')),
                ButtonSegment<int>(value: 4, label: Text('4x')),
              ],
              selected: <int>{options.defaultSimulationSpeed},
              onSelectionChanged: (selection) {
                if (selection.isEmpty) {
                  return;
                }
                UiFeedback.tap();
                appState.updateGameOptions(
                  defaultSimulationSpeed: selection.first,
                );
              },
            ),
            const SizedBox(height: AppTokens.space16),
            _SectionTitle(label: t('\uad11\uace0', 'Ads')),
            Text(
              t('\uad11\uace0 \ubaa8\ub4dc', 'Ads Mode'),
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: AppTokens.space8),
            SegmentedButton<AdMode>(
              segments: appState.availableAdModes
                  .map(
                    (mode) => ButtonSegment<AdMode>(
                      value: mode,
                      label: Text(_adModeLabel(mode, options.uiLanguage)),
                    ),
                  )
                  .toList(),
              selected: <AdMode>{options.adMode},
              onSelectionChanged: (selection) {
                if (selection.isEmpty) {
                  return;
                }
                UiFeedback.tap();
                appState.updateGameOptions(adMode: selection.first);
              },
            ),
            const SizedBox(height: AppTokens.space8),
            Text(
              _adsStatusLine(appState, options.uiLanguage),
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: AppTokens.space16),
            _SectionTitle(label: t('\uac1c\uc778\uc815\ubcf4', 'Privacy')),
            SwitchListTile.adaptive(
              contentPadding: EdgeInsets.zero,
              title: Text(
                t('\ub9de\ucda4\ud615 \uad11\uace0', 'Personalized Ads'),
              ),
              subtitle: Text(
                t(
                  '\ub044\uba74 \ube44\uac1c\uc778\ud654 \uad11\uace0\ub85c \uc694\uccad\ud569\ub2c8\ub2e4',
                  'Disable to request non-personalized ads',
                ),
              ),
              value: options.personalizedAdsEnabled,
              onChanged: (enabled) {
                UiFeedback.tap();
                appState.updateGameOptions(personalizedAdsEnabled: enabled);
              },
              secondary: OptionalAssetIcon(
                assetPath: 'assets/icons/privacy.png',
                fallbackIcon: Icons.privacy_tip_outlined,
                color: theme.colorScheme.primary,
              ),
            ),
            Row(
              children: <Widget>[
                Expanded(
                  child: PrimaryButton.secondary(
                    label: _consentBusy
                        ? t('\uc5c5\ub370\uc774\ud2b8 \uc911...', 'Updating...')
                        : t(
                            '\ub3d9\uc758 \uc5c5\ub370\uc774\ud2b8',
                            'Update Consent',
                          ),
                    onPressed: _consentBusy
                        ? null
                        : () => _runConsentAction(
                            context,
                            () => appState.refreshConsent(),
                            successMessage: t(
                              '\ub3d9\uc758 \uc0c1\ud0dc\uac00 \uc5c5\ub370\uc774\ud2b8\ub418\uc5c8\uc2b5\ub2c8\ub2e4.',
                              'Consent status updated.',
                            ),
                            failMessage: t(
                              '\ub3d9\uc758 \uc5c5\ub370\uc774\ud2b8\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.',
                              'Consent update failed.',
                            ),
                          ),
                    minHeight: 44,
                  ),
                ),
                const SizedBox(width: AppTokens.space8),
                Expanded(
                  child: PrimaryButton.secondary(
                    label: _consentBusy
                        ? '...'
                        : t(
                            '\uac1c\uc778\uc815\ubcf4 \uc635\uc158',
                            'Privacy Options',
                          ),
                    onPressed: _consentBusy
                        ? null
                        : () => _runConsentAction(
                            context,
                            () async {
                              final ok = await appState
                                  .showPrivacyOptionsForm();
                              if (!ok) {
                                throw StateError('privacy_options_failed');
                              }
                            },
                            successMessage: t(
                              '\uac1c\uc778\uc815\ubcf4 \uc635\uc158\uc774 \uc5c5\ub370\uc774\ud2b8\ub418\uc5c8\uc2b5\ub2c8\ub2e4.',
                              'Privacy options updated.',
                            ),
                            failMessage: t(
                              '\uac1c\uc778\uc815\ubcf4 \uc635\uc158\uc744 \uc5f4 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.',
                              'Privacy options unavailable.',
                            ),
                          ),
                    minHeight: 44,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppTokens.space12),
            _SectionTitle(
              label: t('\ud06c\ub798\uc2dc \ubcf4\uace0', 'Crash Reporting'),
            ),
            SwitchListTile.adaptive(
              contentPadding: EdgeInsets.zero,
              title: Text(
                t('\ud06c\ub798\uc2dc \ubcf4\uace0', 'Crash reporting'),
              ),
              subtitle: Text(
                t(
                  'DSN \uc124\uc815 \uc2dc \ud06c\ub798\uc2dc \ubcf4\uace0\ub97c \uc804\uc1a1\ud569\ub2c8\ub2e4',
                  'Send crash reports when DSN is configured',
                ),
              ),
              value: options.crashReportingEnabled,
              onChanged: (enabled) {
                UiFeedback.tap();
                appState.updateGameOptions(crashReportingEnabled: enabled);
              },
            ),
            const SizedBox(height: AppTokens.space16),
            _SectionTitle(
              label: t('\uc9c0\uc6d0 / \uc815\ubcf4', 'Support / About'),
            ),
            _VersionLine(appName: 'Augment Brick'),
            const SizedBox(height: AppTokens.space8),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.email_outlined),
              title: const Text('Support Email'),
              subtitle: Text(appState.appConfig.supportEmail),
              trailing: IconButton(
                tooltip: 'Copy email',
                onPressed: () async {
                  UiFeedback.tap();
                  await Clipboard.setData(
                    ClipboardData(text: appState.appConfig.supportEmail),
                  );
                  if (!context.mounted) {
                    return;
                  }
                  AppToast.show(
                    context,
                    message: 'Support email copied.',
                    icon: Icons.copy_rounded,
                  );
                },
                icon: const Icon(Icons.copy_rounded),
              ),
            ),
            if (appState.appConfig.privacyPolicyUrl.trim().isNotEmpty)
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.policy_outlined),
                title: const Text('Privacy Policy URL'),
                subtitle: Text(appState.appConfig.privacyPolicyUrl),
                trailing: IconButton(
                  tooltip: 'Copy URL',
                  onPressed: () async {
                    UiFeedback.tap();
                    await Clipboard.setData(
                      ClipboardData(text: appState.appConfig.privacyPolicyUrl),
                    );
                    if (!context.mounted) {
                      return;
                    }
                    AppToast.show(
                      context,
                      message: 'Privacy URL copied.',
                      icon: Icons.copy_rounded,
                    );
                  },
                  icon: const Icon(Icons.copy_rounded),
                ),
              )
            else
              Text(
                'Privacy policy URL is not configured.',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            const SizedBox(height: AppTokens.space16),
            _SectionTitle(label: t('\uc9c4\ub2e8', 'Diagnostics')),
            FutureBuilder<PackageInfo>(
              future: PackageInfo.fromPlatform(),
              builder: (context, snapshot) {
                final diagnostics = _buildDiagnosticsSnapshot(
                  appState: appState,
                  packageInfo: snapshot.data,
                );
                return Column(
                  children: <Widget>[
                    _DiagnosticsCard(snapshot: diagnostics),
                    const SizedBox(height: AppTokens.space8),
                    PrimaryButton.secondary(
                      label: t(
                        '\ub514\ubc84\uadf8 \ubc88\ub4e4 \ub0b4\ubcf4\ub0b4\uae30',
                        'Export Debug Bundle',
                      ),
                      onPressed: () async {
                        UiFeedback.tap();
                        await DebugBundleService.instance.exportFromContext(
                          context,
                          source: 'options_sheet',
                        );
                        if (!mounted) {
                          return;
                        }
                        setState(() {});
                      },
                    ),
                    const SizedBox(height: AppTokens.space8),
                    PrimaryButton.secondary(
                      label: t(
                        '\uc9c4\ub2e8 \ubcf5\uc0ac',
                        'Copy diagnostics to clipboard',
                      ),
                      onPressed: () => _copyDiagnostics(context, diagnostics),
                    ),
                    const SizedBox(height: AppTokens.space8),
                    PrimaryButton.secondary(
                      label: t(
                        '\uc790\ub3d9 \uc800\uc7a5 \uc0ad\uc81c',
                        'Clear autosave',
                      ),
                      onPressed: appState.hasActiveRun
                          ? () => _confirmAndClearAutosave(context)
                          : null,
                    ),
                    const SizedBox(height: AppTokens.space8),
                    PrimaryButton.secondary(
                      label: t(
                        '\ub514\ubc84\uadf8 \uce90\uc2dc \uc0ad\uc81c',
                        'Clear debug cache',
                      ),
                      onPressed: () => _confirmAndClearCache(context),
                    ),
                  ],
                );
              },
            ),
            const SizedBox(height: AppTokens.space8),
            PrimaryButton.secondary(
              label: t(
                '\ud29c\ud1a0\ub9ac\uc5bc \ub2e4\uc2dc\ubcf4\uae30',
                'Replay tutorial',
              ),
              onPressed: () {
                UiFeedback.tap();
                appState.resetTutorialSeen();
                AppToast.show(
                  context,
                  message: t(
                    '\ub2e4\uc74c \ub7f0 \uc9c4\uc785 \uc2dc \ud29c\ud1a0\ub9ac\uc5bc\uc774 \ub2e4\uc2dc \uc2dc\uc791\ub429\ub2c8\ub2e4.',
                    'Tutorial will be shown again on next run.',
                  ),
                  icon: Icons.school_rounded,
                );
              },
            ),
            const SizedBox(height: AppTokens.space8),
            PrimaryButton.secondary(
              label: t('\ub2eb\uae30', 'Close'),
              onPressed: () {
                UiFeedback.back();
                Navigator.of(context).pop();
              },
            ),
          ],
        ),
      ),
    );
  }

  DiagnosticsSnapshot _buildDiagnosticsSnapshot({
    required AppState appState,
    PackageInfo? packageInfo,
  }) {
    final service = DebugBundleService.instance;
    final defaults = DiagnosticsSnapshot.defaults();
    final version = packageInfo?.version ?? defaults.appVersion;
    final build = packageInfo?.buildNumber ?? defaults.buildNumber;
    final releaseTag = packageInfo == null
        ? defaults.releaseTag
        : sanitizeReleaseTag('${version}_$build');
    final activeAdUnit = switch (appState.gameOptions.adMode) {
      AdMode.simulated => '-',
      AdMode.realTest => kAdmobTestRewardedUnitIdAndroid,
      AdMode.realProduction => appState.appConfig.ads.rewardedAdUnitIdAndroid,
    };
    final symbolsRootPath = defaults.symbolsRootPath;
    bool symbolsRootExists = false;
    try {
      symbolsRootExists = Directory(symbolsRootPath).existsSync();
    } catch (_) {
      symbolsRootExists = false;
    }
    return DiagnosticsSnapshot(
      appVersion: version,
      buildNumber: build,
      releaseTag: releaseTag,
      compileSdk: DiagnosticsSnapshot.sdk35,
      targetSdk: DiagnosticsSnapshot.sdk35,
      adMode: appState.gameOptions.adMode,
      activeAdUnitMasked: maskForDiagnostics(activeAdUnit),
      consentState: appState.consentSnapshot.state,
      canRequestAds: appState.consentSnapshot.canRequestAds,
      crashReportingEnabled: appState.gameOptions.crashReportingEnabled,
      sentryDsnConfigured: appState.appConfig.sentryDsn.trim().isNotEmpty,
      sentryDsnMasked: maskForDiagnostics(appState.appConfig.sentryDsn),
      symbolsRootPath: symbolsRootPath,
      symbolsRootExists: symbolsRootExists,
      lastBundlePath: service.lastBundlePath ?? defaults.lastBundlePath,
      lastBundleAtIso:
          service.lastBundleAt?.toIso8601String() ?? defaults.lastBundleAtIso,
    );
  }

  Future<void> _copyDiagnostics(
    BuildContext context,
    DiagnosticsSnapshot snapshot,
  ) async {
    UiFeedback.tap();
    await Clipboard.setData(ClipboardData(text: snapshot.toMultilineText()));
    if (!context.mounted) {
      return;
    }
    AppToast.show(
      context,
      message: 'Diagnostics copied.',
      icon: Icons.copy_rounded,
    );
  }

  Future<void> _confirmAndClearAutosave(BuildContext context) async {
    final appState = context.read<AppState>();
    final confirmed =
        await showDialog<bool>(
          context: context,
          builder: (dialogContext) {
            return AlertDialog(
              title: const Text('Clear autosave?'),
              content: const Text(
                'The current resumable run snapshot will be removed.',
              ),
              actions: <Widget>[
                TextButton(
                  onPressed: () => Navigator.of(dialogContext).pop(false),
                  child: const Text('Cancel'),
                ),
                FilledButton(
                  onPressed: () => Navigator.of(dialogContext).pop(true),
                  child: const Text('Clear'),
                ),
              ],
            );
          },
        ) ??
        false;
    if (!confirmed) {
      return;
    }
    appState.clearActiveRunSnapshot();
    if (!context.mounted) {
      return;
    }
    AppToast.show(
      context,
      message: 'Autosave cleared.',
      icon: Icons.delete_outline_rounded,
    );
  }

  Future<void> _confirmAndClearCache(BuildContext context) async {
    final confirmed =
        await showDialog<bool>(
          context: context,
          builder: (dialogContext) {
            return AlertDialog(
              title: const Text('Clear debug cache?'),
              content: const Text(
                'Temporary debug bundle folders in cache will be deleted.',
              ),
              actions: <Widget>[
                TextButton(
                  onPressed: () => Navigator.of(dialogContext).pop(false),
                  child: const Text('Cancel'),
                ),
                FilledButton(
                  onPressed: () => Navigator.of(dialogContext).pop(true),
                  child: const Text('Clear'),
                ),
              ],
            );
          },
        ) ??
        false;
    if (!confirmed) {
      return;
    }
    await DebugBundleService.instance.clearTemporaryBundles();
    if (!mounted) {
      return;
    }
    setState(() {});
    if (!context.mounted) {
      return;
    }
    AppToast.show(
      context,
      message: 'Debug cache cleared.',
      icon: Icons.cleaning_services_rounded,
    );
  }

  String _adModeLabel(AdMode mode, UiLanguage language) {
    final isKo = language == UiLanguage.ko;
    switch (mode) {
      case AdMode.simulated:
        return isKo ? '\uc2dc\ubbac\ub808\uc774\ud2b8' : 'Sim';
      case AdMode.realTest:
        return isKo ? '\ud14c\uc2a4\ud2b8' : 'Test';
      case AdMode.realProduction:
        return isKo ? '\uc6b4\uc601' : 'Prod';
    }
  }

  String _adsStatusLine(AppState appState, UiLanguage language) {
    final options = appState.gameOptions;
    final consent = appState.consentSnapshot;
    final isKo = language == UiLanguage.ko;
    if (options.adMode == AdMode.simulated) {
      return isKo
          ? '\uc2dc\ubbac\ub808\uc774\ud2b8 \ubaa8\ub4dc: \ud655\uc778 \ud6c4 \ubcf4\uc0c1\uc774 \uc9c0\uae09\ub429\ub2c8\ub2e4.'
          : 'Simulated mode: reward is granted after confirmation.';
    }
    final status = consent.state.name;
    final request = consent.canRequestAds ? 'yes' : 'no';
    return isKo
        ? '\ub3d9\uc758: $status / \uc694\uccad \uac00\ub2a5: $request'
        : 'Consent: $status / canRequestAds: $request';
  }

  Future<void> _runConsentAction(
    BuildContext context,
    Future<void> Function() action, {
    required String successMessage,
    required String failMessage,
  }) async {
    setState(() {
      _consentBusy = true;
    });
    try {
      await action();
      if (!context.mounted) {
        return;
      }
      AppToast.show(
        context,
        message: successMessage,
        icon: Icons.check_circle_rounded,
      );
    } catch (_) {
      if (!context.mounted) {
        return;
      }
      AppToast.show(
        context,
        message: failMessage,
        icon: Icons.info_outline_rounded,
      );
    } finally {
      if (mounted) {
        setState(() {
          _consentBusy = false;
        });
      }
    }
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        label,
        style: Theme.of(
          context,
        ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
      ),
    );
  }
}

class _VersionLine extends StatelessWidget {
  const _VersionLine({required this.appName});

  final String appName;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return FutureBuilder<PackageInfo>(
      future: PackageInfo.fromPlatform(),
      builder: (context, snapshot) {
        final info = snapshot.data;
        final version = info == null
            ? 'unknown'
            : '${info.version} (${info.buildNumber})';
        return Row(
          children: <Widget>[
            Icon(Icons.info_outline_rounded, color: theme.colorScheme.primary),
            const SizedBox(width: AppTokens.space8),
            Text(
              '$appName v$version',
              style: theme.textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        );
      },
    );
  }
}

class _DiagnosticsCard extends StatelessWidget {
  const _DiagnosticsCard({required this.snapshot});

  final DiagnosticsSnapshot snapshot;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final textStyle = theme.textTheme.bodySmall?.copyWith(
      color: theme.colorScheme.onSurfaceVariant,
    );
    return DecoratedBox(
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest.withValues(
          alpha: 0.55,
        ),
        borderRadius: BorderRadius.circular(AppTokens.radiusCard),
        border: Border.all(
          color: theme.colorScheme.outlineVariant.withValues(alpha: 0.8),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppTokens.space12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            _DiagnosticsLine(
              label: 'App',
              value: snapshot.appVersion,
              style: textStyle,
            ),
            _DiagnosticsLine(
              label: 'Build',
              value: snapshot.buildNumber,
              style: textStyle,
            ),
            _DiagnosticsLine(
              label: 'Release Tag',
              value: snapshot.releaseTag,
              style: textStyle,
            ),
            _DiagnosticsLine(
              label: 'SDK',
              value:
                  'compile ${snapshot.compileSdk} / target ${snapshot.targetSdk}',
              style: textStyle,
            ),
            _DiagnosticsLine(
              label: 'Ads',
              value:
                  '${snapshot.adMode.name} (unit=${snapshot.activeAdUnitMasked})',
              style: textStyle,
            ),
            _DiagnosticsLine(
              label: 'Consent',
              value:
                  '${snapshot.consentState.name} (canRequest=${snapshot.canRequestAds})',
              style: textStyle,
            ),
            _DiagnosticsLine(
              label: 'Crash',
              value:
                  '${snapshot.crashReportingEnabled ? 'on' : 'off'} '
                  '(dsn=${snapshot.sentryDsnConfigured ? 'set' : 'unset'} '
                  '${snapshot.sentryDsnMasked})',
              style: textStyle,
            ),
            _DiagnosticsLine(
              label: 'Symbols',
              value:
                  '${snapshot.symbolsRootPath} '
                  '(${snapshot.symbolsRootExists ? 'present' : 'missing'})',
              style: textStyle,
            ),
            _DiagnosticsLine(
              label: 'Last Bundle',
              value: snapshot.lastBundleAtIso,
              style: textStyle,
            ),
            _DiagnosticsLine(
              label: 'Bundle Path',
              value: snapshot.lastBundlePath,
              style: textStyle,
            ),
          ],
        ),
      ),
    );
  }
}

class _DiagnosticsLine extends StatelessWidget {
  const _DiagnosticsLine({
    required this.label,
    required this.value,
    this.style,
  });

  final String label;
  final String value;
  final TextStyle? style;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 2),
      child: Text('$label: $value', style: style),
    );
  }
}
