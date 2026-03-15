import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/save_data.dart';

abstract class SaveStorageService {
  Future<SaveData?> load();
  Future<void> save(SaveData saveData);
}

class SharedPrefsSaveStorageService implements SaveStorageService {
  static const String _saveKey = 'breaking_block_augment_save_v1';

  @override
  Future<SaveData?> load() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_saveKey);
      if (raw == null || raw.isEmpty) {
        return null;
      }
      final decoded = jsonDecode(raw);
      if (decoded is! Map) {
        return null;
      }
      return SaveData.fromJson(Map<String, dynamic>.from(decoded));
    } catch (error, stackTrace) {
      debugPrint('SharedPrefs load failed. Using default save. error=$error');
      debugPrintStack(stackTrace: stackTrace);
      return null;
    }
  }

  @override
  Future<void> save(SaveData saveData) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = jsonEncode(saveData.toJson());
      await prefs.setString(_saveKey, raw);
    } catch (error, stackTrace) {
      debugPrint('SharedPrefs save failed. Ignoring for now. error=$error');
      debugPrintStack(stackTrace: stackTrace);
    }
  }
}
