import 'package:flutter/material.dart';
import 'package:shared_assets/shared_assets.dart';

class SharedUiTheme {
  static ThemeData light() {
    return ThemeData(
      colorSchemeSeed: Colors.teal,
      useMaterial3: true,
      cardTheme: const CardThemeData(margin: EdgeInsets.all(8)),
    );
  }
}

class SharedPreviewCard extends StatelessWidget {
  const SharedPreviewCard({super.key, required this.title, required this.assetPath});

  final String title;
  final String assetPath;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image(image: AssetImage(assetPath)),
            ),
          ],
        ),
      ),
    );
  }
}

class SharedAssetShowcasePage extends StatelessWidget {
  const SharedAssetShowcasePage({super.key, required this.appName});

  final String appName;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('$appName · Shared UI')),
      body: ListView(
        padding: const EdgeInsets.all(12),
        children: const [
          SharedPreviewCard(
            title: 'Kenney UI Preview',
            assetPath: SharedAssets.kenneyUiPreview,
          ),
          SharedPreviewCard(
            title: 'Emotes Preview',
            assetPath: SharedAssets.emotesPreview,
          ),
          SizedBox(height: 8),
          Text('Audio included: packages/shared_assets/assets/audio/click_a.ogg'),
        ],
      ),
    );
  }
}
