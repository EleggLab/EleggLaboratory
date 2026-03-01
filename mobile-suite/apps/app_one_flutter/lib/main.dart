import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'App One Asset Demo',
      theme: ThemeData(colorSchemeSeed: Colors.green, useMaterial3: true),
      home: const AssetDemoPage(),
    );
  }
}

class AssetDemoPage extends StatelessWidget {
  const AssetDemoPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('App One · Asset Demo')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          Text('공용 리소스 연동 샘플', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          SizedBox(height: 12),
          Text('이미지 1: kenney_ui-pack preview'),
          SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.all(Radius.circular(12)),
            child: Image(
              image: AssetImage('assets/ui/kenney_ui_preview.png'),
              fit: BoxFit.cover,
            ),
          ),
          SizedBox(height: 16),
          Text('이미지 2: emotes preview'),
          SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.all(Radius.circular(12)),
            child: Image(
              image: AssetImage('assets/ui/emotes_preview.png'),
              fit: BoxFit.cover,
            ),
          ),
          SizedBox(height: 16),
          Text('오디오 샘플도 assets/audio/click_a.ogg 로 포함됨(재생 로직은 다음 단계에서 추가).'),
        ],
      ),
    );
  }
}
