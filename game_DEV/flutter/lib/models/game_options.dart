import 'package:flutter/foundation.dart';

enum VfxIntensity { low, medium, high }

enum AimLineStyle { fancy, simple }

enum AimPreviewLength { short, standard, long }

enum AdMode { simulated, realTest, realProduction }

enum UiLanguage { ko, en }

@immutable
class GameOptionsData {
  const GameOptionsData({
    required this.sfxEnabled,
    required this.vibrationEnabled,
    required this.vfxIntensity,
    required this.aimLineStyle,
    required this.aimPreviewLength,
    required this.uiLanguage,
    required this.defaultSimulationSpeed,
    required this.adMode,
    required this.personalizedAdsEnabled,
    required this.crashReportingEnabled,
  });

  final bool sfxEnabled;
  final bool vibrationEnabled;
  final VfxIntensity vfxIntensity;
  final AimLineStyle aimLineStyle;
  final AimPreviewLength aimPreviewLength;
  final UiLanguage uiLanguage;
  final int defaultSimulationSpeed;
  final AdMode adMode;
  final bool personalizedAdsEnabled;
  final bool crashReportingEnabled;

  static const GameOptionsData defaults = GameOptionsData(
    sfxEnabled: true,
    vibrationEnabled: true,
    vfxIntensity: VfxIntensity.medium,
    aimLineStyle: AimLineStyle.simple,
    aimPreviewLength: AimPreviewLength.standard,
    uiLanguage: UiLanguage.ko,
    defaultSimulationSpeed: 1,
    adMode: AdMode.simulated,
    personalizedAdsEnabled: true,
    crashReportingEnabled: true,
  );

  GameOptionsData copyWith({
    bool? sfxEnabled,
    bool? vibrationEnabled,
    VfxIntensity? vfxIntensity,
    AimLineStyle? aimLineStyle,
    AimPreviewLength? aimPreviewLength,
    UiLanguage? uiLanguage,
    int? defaultSimulationSpeed,
    AdMode? adMode,
    bool? personalizedAdsEnabled,
    bool? crashReportingEnabled,
  }) {
    return GameOptionsData(
      sfxEnabled: sfxEnabled ?? this.sfxEnabled,
      vibrationEnabled: vibrationEnabled ?? this.vibrationEnabled,
      vfxIntensity: vfxIntensity ?? this.vfxIntensity,
      aimLineStyle: aimLineStyle ?? this.aimLineStyle,
      aimPreviewLength: aimPreviewLength ?? this.aimPreviewLength,
      uiLanguage: uiLanguage ?? this.uiLanguage,
      defaultSimulationSpeed: _normalizeSimulationSpeed(
        defaultSimulationSpeed ?? this.defaultSimulationSpeed,
      ),
      adMode: adMode ?? this.adMode,
      personalizedAdsEnabled:
          personalizedAdsEnabled ?? this.personalizedAdsEnabled,
      crashReportingEnabled:
          crashReportingEnabled ?? this.crashReportingEnabled,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'sfxOn': sfxEnabled,
      'vibrationOn': vibrationEnabled,
      'vfxIntensity': _toPersistedVfxIntensity(vfxIntensity),
      'aimLineStyle': aimLineStyle.name,
      'aimPreviewLength': aimPreviewLength.name,
      'uiLanguage': uiLanguage.name,
      'defaultSimulationSpeed': defaultSimulationSpeed,
      'adMode': adMode.name,
      'personalizedAdsOn': personalizedAdsEnabled,
      'crashReportingOn': crashReportingEnabled,
    };
  }

  factory GameOptionsData.fromJson(Map<String, dynamic> json) {
    return GameOptionsData(
      sfxEnabled:
          (json['sfxOn'] as bool?) ?? (json['sfxEnabled'] as bool?) ?? true,
      vibrationEnabled:
          (json['vibrationOn'] as bool?) ??
          (json['vibrationEnabled'] as bool?) ??
          true,
      vfxIntensity: _parseVfxIntensity(json['vfxIntensity']?.toString()),
      aimLineStyle: _parseAimLineStyle(json['aimLineStyle']?.toString()),
      aimPreviewLength: _parseAimPreviewLength(
        json['aimPreviewLength']?.toString(),
      ),
      uiLanguage: _parseUiLanguage(json['uiLanguage']?.toString()),
      defaultSimulationSpeed: _normalizeSimulationSpeed(
        (json['defaultSimulationSpeed'] as int?) ?? 1,
      ),
      adMode: _parseAdMode(json['adMode']?.toString()),
      personalizedAdsEnabled:
          (json['personalizedAdsOn'] as bool?) ??
          (json['personalizedAdsEnabled'] as bool?) ??
          true,
      crashReportingEnabled:
          (json['crashReportingOn'] as bool?) ??
          (json['crashReportingEnabled'] as bool?) ??
          true,
    );
  }

  static int _normalizeSimulationSpeed(int speed) {
    switch (speed) {
      case 2:
      case 4:
        return speed;
      default:
        return 1;
    }
  }

  static String _toPersistedVfxIntensity(VfxIntensity value) {
    switch (value) {
      case VfxIntensity.low:
        return 'low';
      case VfxIntensity.medium:
        return 'med';
      case VfxIntensity.high:
        return 'high';
    }
  }

  static VfxIntensity _parseVfxIntensity(String? raw) {
    switch (raw) {
      case 'low':
        return VfxIntensity.low;
      case 'high':
        return VfxIntensity.high;
      case 'med':
      case 'medium':
      default:
        return VfxIntensity.medium;
    }
  }

  static AimLineStyle _parseAimLineStyle(String? raw) {
    switch (raw) {
      case 'simple':
        return AimLineStyle.simple;
      case 'fancy':
        return AimLineStyle.fancy;
      default:
        return AimLineStyle.simple;
    }
  }

  static AimPreviewLength _parseAimPreviewLength(String? raw) {
    switch (raw) {
      case 'short':
        return AimPreviewLength.short;
      case 'long':
        return AimPreviewLength.long;
      case 'standard':
      default:
        return AimPreviewLength.standard;
    }
  }

  static UiLanguage _parseUiLanguage(String? raw) {
    switch (raw) {
      case 'en':
        return UiLanguage.en;
      case 'ko':
      default:
        return UiLanguage.ko;
    }
  }

  static AdMode _parseAdMode(String? raw) {
    switch (raw) {
      case 'realTest':
        return AdMode.realTest;
      case 'realProduction':
        return AdMode.realProduction;
      case 'simulated':
      default:
        return AdMode.simulated;
    }
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) {
      return true;
    }
    return other is GameOptionsData &&
        other.sfxEnabled == sfxEnabled &&
        other.vibrationEnabled == vibrationEnabled &&
        other.vfxIntensity == vfxIntensity &&
        other.aimLineStyle == aimLineStyle &&
        other.aimPreviewLength == aimPreviewLength &&
        other.uiLanguage == uiLanguage &&
        other.defaultSimulationSpeed == defaultSimulationSpeed &&
        other.adMode == adMode &&
        other.personalizedAdsEnabled == personalizedAdsEnabled &&
        other.crashReportingEnabled == crashReportingEnabled;
  }

  @override
  int get hashCode => Object.hash(
    sfxEnabled,
    vibrationEnabled,
    vfxIntensity,
    aimLineStyle,
    aimPreviewLength,
    uiLanguage,
    defaultSimulationSpeed,
    adMode,
    personalizedAdsEnabled,
    crashReportingEnabled,
  );
}
