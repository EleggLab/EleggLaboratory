import 'package:flutter/material.dart';
import 'package:shared_ui/shared_ui.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'App One',
      theme: SharedUiTheme.light(),
      home: const SharedAssetShowcasePage(appName: 'App One'),
    );
  }
}
