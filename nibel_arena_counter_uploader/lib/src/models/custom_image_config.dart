import 'dart:io';

import 'package:flutter/foundation.dart';

enum CustomImageSlot { background, heroPrimary, heroSecondary, leaderButton }

@immutable
class CustomImageConfig {
  const CustomImageConfig({
    this.backgroundPath,
    this.heroPrimaryPath,
    this.heroSecondaryPath,
    this.leaderButtonPath,
  });

  final String? backgroundPath;
  final String? heroPrimaryPath;
  final String? heroSecondaryPath;
  final String? leaderButtonPath;

  static const empty = CustomImageConfig();

  String? pathFor(CustomImageSlot slot) {
    return switch (slot) {
      CustomImageSlot.background => backgroundPath,
      CustomImageSlot.heroPrimary => heroPrimaryPath,
      CustomImageSlot.heroSecondary => heroSecondaryPath,
      CustomImageSlot.leaderButton => leaderButtonPath,
    };
  }

  File? fileFor(CustomImageSlot slot) {
    final path = pathFor(slot);
    if (path == null || path.isEmpty) {
      return null;
    }

    final file = File(path);
    if (!file.existsSync()) {
      return null;
    }

    return file;
  }

  CustomImageConfig copyWith({
    String? backgroundPath,
    String? heroPrimaryPath,
    String? heroSecondaryPath,
    String? leaderButtonPath,
    bool clearBackground = false,
    bool clearHeroPrimary = false,
    bool clearHeroSecondary = false,
    bool clearLeaderButton = false,
  }) {
    return CustomImageConfig(
      backgroundPath: clearBackground
          ? null
          : backgroundPath ?? this.backgroundPath,
      heroPrimaryPath: clearHeroPrimary
          ? null
          : heroPrimaryPath ?? this.heroPrimaryPath,
      heroSecondaryPath: clearHeroSecondary
          ? null
          : heroSecondaryPath ?? this.heroSecondaryPath,
      leaderButtonPath: clearLeaderButton
          ? null
          : leaderButtonPath ?? this.leaderButtonPath,
    );
  }
}
