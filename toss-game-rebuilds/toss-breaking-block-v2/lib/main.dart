import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import 'data/save_repository.dart';
import 'services/ad_service.dart';
import 'services/storage_service.dart';
import 'state/app_state.dart';
import 'ui/app_shell.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations(const <DeviceOrientation>[
    DeviceOrientation.portraitUp,
  ]);

  final appState = AppState(
    saveRepository: LocalSaveRepository(
      storageService: SharedPrefsSaveStorageService(),
    ),
    adService: FakeAdService(),
  );
  await appState.initialize();

  runApp(BreakingBlockApp(appState: appState));
}

class BreakingBlockApp extends StatelessWidget {
  const BreakingBlockApp({super.key, required this.appState});

  final AppState appState;

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider<AppState>.value(
      value: appState,
      child: MaterialApp(
        title: 'Breaking a Block Augment',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorSchemeSeed: const Color(0xFF2056A8),
          useMaterial3: true,
        ),
        home: const AppShell(),
      ),
    );
  }
}


