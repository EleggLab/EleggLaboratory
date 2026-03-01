import 'package:flutter/material.dart';
import 'package:shared_assets/shared_assets.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'App One',
      theme: ThemeData(colorSchemeSeed: Colors.teal, useMaterial3: true),
      home: const SharedAssetHome(),
    );
  }
}

class SharedAssetHome extends StatelessWidget {
  const SharedAssetHome({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('App One · Shared Assets Package')),
      body: const SharedAssetDemo(title: 'App One'),
    );
  }
}
