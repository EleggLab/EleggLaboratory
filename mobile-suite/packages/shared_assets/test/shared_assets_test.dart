import 'package:flutter_test/flutter_test.dart';
import 'package:shared_assets/shared_assets.dart';

void main() {
  test('shared asset constants are exposed', () {
    expect(SharedAssets.kenneyUiPreview.contains('packages/shared_assets/'), isTrue);
    expect(SharedAssets.emotesPreview.endsWith('.png'), isTrue);
    expect(SharedAssets.clickAudio.endsWith('.ogg'), isTrue);
  });
}
