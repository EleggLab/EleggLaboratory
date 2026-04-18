import 'package:flutter/material.dart';

import 'arena_counter_state.dart';

@immutable
class ArenaThemePalette {
  const ArenaThemePalette({
    required this.id,
    required this.label,
    required this.subtitle,
    required this.surface,
    required this.surfaceStrong,
    required this.surfaceMuted,
    required this.border,
    required this.accent,
    required this.accentStrong,
    required this.textPrimary,
    required this.textSecondary,
    required this.warning,
    required this.backgroundTint,
    required this.backgroundShade,
    this.backgroundAsset = '',
    this.heroGifAsset = '',
    this.firstInitiativeAsset = '',
    this.secondInitiativeAsset = '',
    this.thumbAsset = '',
  });

  final ArenaThemeId id;
  final String label;
  final String subtitle;
  final Color surface;
  final Color surfaceStrong;
  final Color surfaceMuted;
  final Color border;
  final Color accent;
  final Color accentStrong;
  final Color textPrimary;
  final Color textSecondary;
  final Color warning;
  final Color backgroundTint;
  final Color backgroundShade;
  final String backgroundAsset;
  final String heroGifAsset;
  final String firstInitiativeAsset;
  final String secondInitiativeAsset;
  final String thumbAsset;

  String initiativeAsset(Initiative initiative) {
    return initiative == Initiative.first
        ? firstInitiativeAsset
        : secondInitiativeAsset;
  }

  static const cookingOil = ArenaThemePalette(
    id: ArenaThemeId.cookingOil,
    label: '크림',
    subtitle: '따뜻한 크림 톤',
    surface: Color(0xFFFFF7EE),
    surfaceStrong: Color(0xFFF3DFC3),
    surfaceMuted: Color(0xFFDEBB8E),
    border: Color(0xFFDD9357),
    accent: Color(0xFFD96333),
    accentStrong: Color(0xFF9A341F),
    textPrimary: Color(0xFF20140D),
    textSecondary: Color(0xFF674734),
    warning: Color(0xFFC6382E),
    backgroundTint: Color(0xFFD6B194),
    backgroundShade: Color(0xFF34211A),
  );

  static const goddessSquad = ArenaThemePalette(
    id: ArenaThemeId.goddessSquad,
    label: '슬레이트',
    subtitle: '차분한 블루 그레이',
    surface: Color(0xFFF7FAFF),
    surfaceStrong: Color(0xFFDCE7F5),
    surfaceMuted: Color(0xFFAEC0D6),
    border: Color(0xFF6E88AA),
    accent: Color(0xFF416EA6),
    accentStrong: Color(0xFF27466E),
    textPrimary: Color(0xFF102033),
    textSecondary: Color(0xFF4B627E),
    warning: Color(0xFFC54C47),
    backgroundTint: Color(0xFF8CA7C7),
    backgroundShade: Color(0xFF172535),
  );

  static const infinityRail = ArenaThemePalette(
    id: ArenaThemeId.infinityRail,
    label: '세이지',
    subtitle: '맑은 세이지 그린',
    surface: Color(0xFFF6FBF8),
    surfaceStrong: Color(0xFFDCEDE4),
    surfaceMuted: Color(0xFFABCDBA),
    border: Color(0xFF6E9A83),
    accent: Color(0xFF2E7A5C),
    accentStrong: Color(0xFF184936),
    textPrimary: Color(0xFF11231B),
    textSecondary: Color(0xFF4D6D5D),
    warning: Color(0xFFB94A3E),
    backgroundTint: Color(0xFF7FA891),
    backgroundShade: Color(0xFF172921),
  );

  static const arcana = ArenaThemePalette(
    id: ArenaThemeId.arcana,
    label: '로즈',
    subtitle: '부드러운 로즈 와인',
    surface: Color(0xFFFFF6F7),
    surfaceStrong: Color(0xFFF2DDE4),
    surfaceMuted: Color(0xFFD9AEBE),
    border: Color(0xFFC97B94),
    accent: Color(0xFFC4456D),
    accentStrong: Color(0xFF7D2345),
    textPrimary: Color(0xFF261019),
    textSecondary: Color(0xFF6D4152),
    warning: Color(0xFFD33C3C),
    backgroundTint: Color(0xFFB9879D),
    backgroundShade: Color(0xFF2C1620),
  );

  static const guiltyLeader = ArenaThemePalette(
    id: ArenaThemeId.guiltyLeader,
    label: '길티 리더',
    subtitle: '선명한 허브 그린',
    surface: Color(0xFFF4FBF2),
    surfaceStrong: Color(0xFFD8ECD2),
    surfaceMuted: Color(0xFFA4C89F),
    border: Color(0xFF5F9E6A),
    accent: Color(0xFF3F8D53),
    accentStrong: Color(0xFF255A33),
    textPrimary: Color(0xFF132116),
    textSecondary: Color(0xFF4A6C51),
    warning: Color(0xFFBE4A3E),
    backgroundTint: Color(0xFF7BA880),
    backgroundShade: Color(0xFF18281B),
  );

  static const debiMarlene = ArenaThemePalette(
    id: ArenaThemeId.debiMarlene,
    label: '데비&마들렌',
    subtitle: '짙은 에메랄드 그린',
    surface: Color(0xFFF3FCF8),
    surfaceStrong: Color(0xFFD4EEE3),
    surfaceMuted: Color(0xFF97C8B5),
    border: Color(0xFF4E957B),
    accent: Color(0xFF2F8F72),
    accentStrong: Color(0xFF155442),
    textPrimary: Color(0xFF11231C),
    textSecondary: Color(0xFF466A5D),
    warning: Color(0xFFB94A3E),
    backgroundTint: Color(0xFF6EAA92),
    backgroundShade: Color(0xFF15261E),
  );

  static const all = [
    cookingOil,
    goddessSquad,
    infinityRail,
    arcana,
    guiltyLeader,
    debiMarlene,
  ];

  static ArenaThemePalette byId(ArenaThemeId id) {
    return switch (id) {
      ArenaThemeId.cookingOil => cookingOil,
      ArenaThemeId.goddessSquad => goddessSquad,
      ArenaThemeId.infinityRail => infinityRail,
      ArenaThemeId.arcana => arcana,
      ArenaThemeId.guiltyLeader => guiltyLeader,
      ArenaThemeId.debiMarlene => debiMarlene,
    };
  }
}
