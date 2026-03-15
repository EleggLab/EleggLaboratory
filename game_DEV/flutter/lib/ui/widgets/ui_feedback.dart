import 'dart:async';

import 'package:flutter/services.dart';

enum UiCue { click, back, jingleStart, jingleGameOver }

class UiFeedback {
  static bool _sfxEnabled = true;
  static bool _vibrationEnabled = true;
  static final Map<String, bool> _assetExistsCache = <String, bool>{};

  static void configure({
    required bool sfxEnabled,
    required bool vibrationEnabled,
  }) {
    _sfxEnabled = sfxEnabled;
    _vibrationEnabled = vibrationEnabled;
  }

  static void tap() {
    playCue(UiCue.click, withHaptic: true);
  }

  static void back() {
    playCue(UiCue.back, withHaptic: false);
  }

  static void playCue(UiCue cue, {bool withHaptic = false}) {
    if (_vibrationEnabled && withHaptic) {
      unawaited(HapticFeedback.lightImpact());
    }

    if (!_sfxEnabled) {
      return;
    }

    final assetPath = _assetPathForCue(cue);
    unawaited(_playOptionalClick(assetPath));
  }

  static String _assetPathForCue(UiCue cue) {
    switch (cue) {
      case UiCue.click:
        return 'assets/audio/ui_click.ogg';
      case UiCue.back:
        return 'assets/audio/ui_back.ogg';
      case UiCue.jingleStart:
        return 'assets/audio/jingle_start.ogg';
      case UiCue.jingleGameOver:
        return 'assets/audio/jingle_gameover.ogg';
    }
  }

  static Future<void> _playOptionalClick(String assetPath) async {
    final hasAsset = await _checkAsset(assetPath);
    if (!hasAsset) {
      return;
    }
    try {
      await SystemSound.play(SystemSoundType.click);
    } catch (_) {
      // Optional feedback should never crash app flow.
    }
  }

  static Future<bool> _checkAsset(String assetPath) async {
    final cached = _assetExistsCache[assetPath];
    if (cached != null) {
      return cached;
    }

    try {
      await rootBundle.load(assetPath);
      _assetExistsCache[assetPath] = true;
    } catch (_) {
      _assetExistsCache[assetPath] = false;
    }
    return _assetExistsCache[assetPath] ?? false;
  }
}
