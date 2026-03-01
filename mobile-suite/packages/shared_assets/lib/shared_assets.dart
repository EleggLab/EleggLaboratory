import 'package:flutter/widgets.dart';

class SharedAssets {
  static const String kenneyUiPreview =
      'packages/shared_assets/assets/images/kenney_ui_preview.png';
  static const String emotesPreview =
      'packages/shared_assets/assets/images/emotes_preview.png';
  static const String clickAudio =
      'packages/shared_assets/assets/audio/click_a.ogg';
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
