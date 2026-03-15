import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import 'data/save_repository.dart';
import 'models/game_options.dart';
import 'services/ad_service.dart';
import 'services/app_config_service.dart';
import 'services/crash_reporting_service.dart';
import 'services/debug_logger_service.dart';
import 'services/storage_service.dart';
import 'state/app_state.dart';
import 'ui/app_shell.dart';
import 'ui/i18n/ui_text.dart';
import 'ui/theme/app_theme.dart';
import 'ui/widgets/ui_feedback.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations(const <DeviceOrientation>[
    DeviceOrientation.portraitUp,
  ]);

  final appConfig = await AppConfigService.instance.load();
  await CrashReportingService.instance.initialize(
    dsn: appConfig.sentryDsn,
    environment: kReleaseMode ? 'release' : 'debug',
  );

  late AppState appState;
  final adService = ManagedAdService(
    settingsProvider: () => AdRuntimeSettings(
      mode: appState.gameOptions.adMode,
      consentAllowsRealAds:
          appState.gameOptions.adMode == AdMode.simulated ||
          appState.consentSnapshot.canRequestAds,
      personalizedAdsEnabled: appState.gameOptions.personalizedAdsEnabled,
      productionRewardedAdUnitId:
          appState.appConfig.ads.rewardedAdUnitIdAndroid,
    ),
  );
  appState = AppState(
    saveRepository: LocalSaveRepository(
      storageService: SharedPrefsSaveStorageService(),
    ),
    adService: adService,
    appConfig: appConfig,
  );
  await appState.initialize();
  UiFeedback.configure(
    sfxEnabled: appState.gameOptions.sfxEnabled,
    vibrationEnabled: appState.gameOptions.vibrationEnabled,
  );
  DebugLoggerService.instance.info(
    'App started. adMode=${appState.gameOptions.adMode.name}',
  );
  _installUiOverflowErrorHook();

  runApp(BreakingBlockApp(appState: appState));
}

void _installUiOverflowErrorHook() {
  final previousOnError = FlutterError.onError;
  var overflowLogged = false;
  FlutterError.onError = (FlutterErrorDetails details) {
    final text = details.exceptionAsString();
    final lower = text.toLowerCase();
    final isOverflow =
        lower.contains('renderflex overflowed') ||
        lower.contains('overflowed by') ||
        lower.contains('layout overflow');
    if (isOverflow) {
      if (!overflowLogged) {
        DebugLoggerService.instance.error('UI_OVERFLOW:$text');
        overflowLogged = true;
      }
    } else if (overflowLogged) {
      overflowLogged = false;
    }
    if (previousOnError != null) {
      previousOnError(details);
    } else {
      FlutterError.presentError(details);
    }
  };
}

class BreakingBlockApp extends StatelessWidget {
  const BreakingBlockApp({super.key, required this.appState});

  final AppState appState;

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider<AppState>.value(
      value: appState,
      child: Consumer<AppState>(
        builder: (context, state, child) {
          final locale = localeFromLanguage(state.gameOptions.uiLanguage);
          final title = state.gameOptions.uiLanguage == UiLanguage.ko
              ? '브레이킹 블록 증강'
              : 'Breaking Block Augment';
          return MaterialApp(
            title: title,
            debugShowCheckedModeBanner: false,
            theme: AppTheme.light(),
            locale: locale,
            supportedLocales: const <Locale>[Locale('ko'), Locale('en')],
            localizationsDelegates: const <LocalizationsDelegate<dynamic>>[
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            home: const AppShell(),
          );
        },
      ),
    );
  }
}
