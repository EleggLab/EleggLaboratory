import 'package:audioplayers/audioplayers.dart';

class SfxService {
  SfxService._();

  static final SfxService instance = SfxService._();
  final AudioPlayer _loopPlayer = AudioPlayer();

  Future<void> play(String assetPath, {double volume = 1.0}) async {
    final AudioPlayer player = AudioPlayer();
    await player.setReleaseMode(ReleaseMode.release);
    await player.setVolume(volume);
    player.onPlayerComplete.listen((_) {
      player.dispose();
    });
    try {
      await player.play(AssetSource(assetPath));
    } catch (_) {
      await player.dispose();
    }
  }

  Future<void> playUiClick(String assetPath) {
    return play(assetPath, volume: 0.7);
  }

  Future<void> startLoop(String assetPath, {double volume = 0.45}) async {
    await _loopPlayer.stop();
    await _loopPlayer.setReleaseMode(ReleaseMode.loop);
    await _loopPlayer.setVolume(volume);
    try {
      await _loopPlayer.play(AssetSource(assetPath));
    } catch (_) {}
  }

  Future<void> stopLoop() async {
    await _loopPlayer.stop();
  }
}
