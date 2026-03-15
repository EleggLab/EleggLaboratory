import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'src/app/app_shell.dart';
import 'src/resources/resource_map.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations(<DeviceOrientation>[
    DeviceOrientation.portraitUp,
  ]);
  runApp(const MergeTacticsApp());
}

class MergeTacticsApp extends StatelessWidget {
  const MergeTacticsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '머지 택틱스',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        fontFamily: ResourceMap.fontPrimary,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF4C8DFF),
          brightness: Brightness.dark,
          primary: const Color(0xFF4C8DFF),
          secondary: const Color(0xFFFFD166),
        ),
      ),
      home: const AppShell(),
    );
  }
}
