import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'src/arena_counter_app.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations(const [
    DeviceOrientation.portraitUp,
  ]);
  runApp(const ArenaCounterApp());
}
