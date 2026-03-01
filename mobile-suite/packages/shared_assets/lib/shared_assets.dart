import 'dart:convert';

import 'package:flutter/services.dart' show rootBundle;
import 'package:flutter/widgets.dart';

class SharedAssets {
  static const String kenneyUiPreview =
      'packages/shared_assets/assets/images/kenney_ui_preview.png';
  static const String emotesPreview =
      'packages/shared_assets/assets/images/emotes_preview.png';
  static const String clickAudio =
      'packages/shared_assets/assets/audio/click_a.ogg';

  static const String assetIndexPath =
      'packages/shared_assets/asset_index.json';
}

class SharedAssetItem {
  const SharedAssetItem({
    required this.id,
    required this.path,
    required this.category,
    required this.ext,
    required this.tags,
  });

  final String id;
  final String path;
  final String category;
  final String ext;
  final List<String> tags;

  factory SharedAssetItem.fromJson(Map<String, dynamic> json) {
    return SharedAssetItem(
      id: json['id'] as String,
      path: json['path'] as String,
      category: json['category'] as String,
      ext: json['ext'] as String,
      tags: (json['tags'] as List<dynamic>).cast<String>(),
    );
  }
}

class SharedAssetIndex {
  const SharedAssetIndex({required this.version, required this.assets});

  final int version;
  final List<SharedAssetItem> assets;

  static Future<SharedAssetIndex> load() async {
    final raw = await rootBundle.loadString(SharedAssets.assetIndexPath);
    final jsonMap = json.decode(raw) as Map<String, dynamic>;
    final items = (jsonMap['assets'] as List<dynamic>)
        .map((e) => SharedAssetItem.fromJson(e as Map<String, dynamic>))
        .toList();
    return SharedAssetIndex(version: (jsonMap['version'] as num).toInt(), assets: items);
  }

  List<SharedAssetItem> byCategory(String category) {
    return assets.where((a) => a.category == category).toList();
  }

  List<SharedAssetItem> byTag(String tag) {
    return assets.where((a) => a.tags.contains(tag)).toList();
  }
}

class SharedAssetDemo extends StatelessWidget {
  const SharedAssetDemo({super.key, required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: const [
        Text(
          '공용 에셋 재사용 데모',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        SizedBox(height: 12),
        Image(image: AssetImage(SharedAssets.kenneyUiPreview)),
        SizedBox(height: 12),
        Image(image: AssetImage(SharedAssets.emotesPreview)),
        SizedBox(height: 12),
        Text('오디오 파일 포함: packages/shared_assets/assets/audio/click_a.ogg'),
      ],
    );
  }
}
