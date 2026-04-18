import 'dart:io';
import 'dart:typed_data';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/arena_counter_state.dart';
import '../models/custom_image_config.dart';

class CustomImageStore {
  CustomImageStore({SharedPreferences? preferences})
    : _preferences = preferences;

  static const _backgroundKey = 'custom_image_background';
  static const _heroPrimaryKey = 'custom_image_hero_primary';
  static const _heroSecondaryKey = 'custom_image_hero_secondary';
  static const _leaderButtonKey = 'custom_image_leader_button';
  static const _themeKey = 'custom_ui_theme';

  final SharedPreferences? _preferences;

  Future<CustomImageConfig> load() async {
    final preferences = await _getPreferences();
    final backgroundPath = preferences.getString(_backgroundKey);
    final heroPrimaryPath = preferences.getString(_heroPrimaryKey);
    final heroSecondaryPath = preferences.getString(_heroSecondaryKey);
    final leaderButtonPath = preferences.getString(_leaderButtonKey);

    return CustomImageConfig(
      backgroundPath: await _resolveExistingPath(backgroundPath),
      heroPrimaryPath: await _resolveExistingPath(heroPrimaryPath),
      heroSecondaryPath: await _resolveExistingPath(heroSecondaryPath),
      leaderButtonPath: await _resolveExistingPath(leaderButtonPath),
    );
  }

  Future<ArenaThemeId> loadTheme() async {
    final preferences = await _getPreferences();
    final rawTheme = preferences.getString(_themeKey);

    return ArenaThemeId.values.firstWhere(
      (theme) => theme.name == rawTheme,
      orElse: () => ArenaThemeId.cookingOil,
    );
  }

  Future<void> saveTheme(ArenaThemeId themeId) async {
    final preferences = await _getPreferences();
    await preferences.setString(_themeKey, themeId.name);
  }

  Future<CustomImageConfig> saveSlot(
    CustomImageSlot slot,
    Uint8List bytes,
    String originalName,
  ) async {
    final current = await load();
    final currentPath = current.pathFor(slot);
    final targetFile = await _targetFileFor(slot, originalName);

    if (currentPath != null && currentPath != targetFile.path) {
      final previousFile = File(currentPath);
      if (previousFile.existsSync()) {
        await previousFile.delete();
      }
    }

    await _persistPickedFile(bytes, targetFile);
    final preferences = await _getPreferences();
    await preferences.setString(_keyFor(slot), targetFile.path);

    return switch (slot) {
      CustomImageSlot.background => current.copyWith(
        backgroundPath: targetFile.path,
      ),
      CustomImageSlot.heroPrimary => current.copyWith(
        heroPrimaryPath: targetFile.path,
      ),
      CustomImageSlot.heroSecondary => current.copyWith(
        heroSecondaryPath: targetFile.path,
      ),
      CustomImageSlot.leaderButton => current.copyWith(
        leaderButtonPath: targetFile.path,
      ),
    };
  }

  Future<CustomImageConfig> clearSlot(CustomImageSlot slot) async {
    final current = await load();
    final currentPath = current.pathFor(slot);

    if (currentPath != null) {
      final file = File(currentPath);
      if (file.existsSync()) {
        await file.delete();
      }
    }

    final preferences = await _getPreferences();
    await preferences.remove(_keyFor(slot));

    return switch (slot) {
      CustomImageSlot.background => current.copyWith(clearBackground: true),
      CustomImageSlot.heroPrimary => current.copyWith(clearHeroPrimary: true),
      CustomImageSlot.heroSecondary => current.copyWith(
        clearHeroSecondary: true,
      ),
      CustomImageSlot.leaderButton => current.copyWith(clearLeaderButton: true),
    };
  }

  String _keyFor(CustomImageSlot slot) {
    return switch (slot) {
      CustomImageSlot.background => _backgroundKey,
      CustomImageSlot.heroPrimary => _heroPrimaryKey,
      CustomImageSlot.heroSecondary => _heroSecondaryKey,
      CustomImageSlot.leaderButton => _leaderButtonKey,
    };
  }

  Future<SharedPreferences> _getPreferences() async {
    return _preferences ?? SharedPreferences.getInstance();
  }

  Future<String?> _resolveExistingPath(String? path) async {
    if (path == null || path.isEmpty) {
      return null;
    }

    final file = File(path);
    if (!file.existsSync()) {
      return null;
    }

    return file.path;
  }

  Future<File> _targetFileFor(CustomImageSlot slot, String originalName) async {
    final imageDirectory = await _customImageDirectory();
    if (!imageDirectory.existsSync()) {
      await imageDirectory.create(recursive: true);
    }

    final extension = _extensionFor(originalName);
    final timestamp = DateTime.now().microsecondsSinceEpoch;
    return File('${imageDirectory.path}/${slot.name}_$timestamp$extension');
  }

  Future<Directory> _customImageDirectory() async {
    if (Platform.isAndroid) {
      final appRoot = Directory.systemTemp.parent;
      return Directory(
        '${appRoot.path}${Platform.pathSeparator}files${Platform.pathSeparator}custom_images',
      );
    }

    return Directory(
      '${Directory.systemTemp.path}${Platform.pathSeparator}nibel_arena_counter${Platform.pathSeparator}custom_images',
    );
  }

  Future<void> _persistPickedFile(Uint8List bytes, File targetFile) async {
    if (bytes.isEmpty) {
      throw const FileSystemException('Picked image file was empty.');
    }

    await targetFile.writeAsBytes(bytes, flush: true);
  }

  String _extensionFor(String originalName) {
    final source = originalName.trim();
    final dotIndex = source.lastIndexOf('.');
    if (dotIndex == -1) {
      return '.jpg';
    }

    return source.substring(dotIndex).toLowerCase();
  }
}
