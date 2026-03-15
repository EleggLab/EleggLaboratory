import 'dart:convert';

import 'package:flutter/services.dart';

import '../models/app_config.dart';
import 'debug_logger_service.dart';

class AppConfigService {
  AppConfigService._();

  static final AppConfigService instance = AppConfigService._();
  static const String _assetPath = 'assets/config/app_config.json';

  Future<AppConfigData> load() async {
    try {
      final raw = await rootBundle.loadString(_assetPath);
      final decoded = jsonDecode(raw);
      if (decoded is! Map) {
        DebugLoggerService.instance.warn(
          'App config decode did not return map. Using defaults.',
        );
        return AppConfigData.defaults;
      }
      return AppConfigData.fromJson(Map<String, dynamic>.from(decoded));
    } catch (error) {
      DebugLoggerService.instance.warn(
        'App config load failed($_assetPath): $error',
      );
      return AppConfigData.defaults;
    }
  }
}
