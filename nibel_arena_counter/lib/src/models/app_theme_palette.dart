import 'package:flutter/material.dart';

import 'arena_counter_state.dart';

@immutable
class ArenaThemePalette {
  const ArenaThemePalette({
    required this.id,
    required this.label,
    required this.subtitle,
    required this.backgroundTint,
    required this.backgroundShade,
    required this.surface,
    required this.surfaceStrong,
    required this.surfaceMuted,
    required this.border,
    required this.accent,
    required this.accentStrong,
    required this.textPrimary,
    required this.textSecondary,
    required this.warning,
    required this.backgroundAsset,
    required this.heroGifAsset,
    required this.firstInitiativeAsset,
    required this.secondInitiativeAsset,
    required this.thumbAsset,
  });

  final ArenaThemeId id;
  final String label;
  final String subtitle;
  final Color backgroundTint;
  final Color backgroundShade;
  final Color surface;
  final Color surfaceStrong;
  final Color surfaceMuted;
  final Color border;
  final Color accent;
  final Color accentStrong;
  final Color textPrimary;
  final Color textSecondary;
  final Color warning;
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

  static const List<ArenaThemePalette> all = [
    ArenaThemePalette(
      id: ArenaThemeId.cookingOil,
      label: 'Cooking Oil',
      subtitle: 'Warm cream, butter yellow, cherry red',
      backgroundTint: Color(0xFFECCDA7),
      backgroundShade: Color(0xFF351814),
      surface: Color(0xFFFCF3E6),
      surfaceStrong: Color(0xFFF4D6B0),
      surfaceMuted: Color(0xFFDDA86B),
      border: Color(0xFFD67E45),
      accent: Color(0xFFD15A34),
      accentStrong: Color(0xFF902314),
      textPrimary: Color(0xFF1B110D),
      textSecondary: Color(0xFF503228),
      warning: Color(0xFFC22B23),
      backgroundAsset: 'assets/themes/cooking_oil/background_main.png',
      heroGifAsset: 'assets/themes/cooking_oil/hero_loop.gif',
      firstInitiativeAsset: 'assets/themes/cooking_oil/initiative_first.png',
      secondInitiativeAsset: 'assets/themes/cooking_oil/initiative_second.png',
      thumbAsset: 'assets/themes/cooking_oil/theme_thumb.png',
    ),
    ArenaThemePalette(
      id: ArenaThemeId.goddessSquad,
      label: 'Goddess Squad',
      subtitle: 'Ivory, ash black, antique gold',
      backgroundTint: Color(0xFFD1C7BD),
      backgroundShade: Color(0xFF090707),
      surface: Color(0xFFF7EEDF),
      surfaceStrong: Color(0xFFE1CAA2),
      surfaceMuted: Color(0xFFA58263),
      border: Color(0xFFD1AB67),
      accent: Color(0xFF972D38),
      accentStrong: Color(0xFF5C131C),
      textPrimary: Color(0xFF15110F),
      textSecondary: Color(0xFF51453B),
      warning: Color(0xFFB92A2B),
      backgroundAsset: 'assets/themes/goddess_squad/background_main.png',
      heroGifAsset: 'assets/themes/goddess_squad/hero_loop.gif',
      firstInitiativeAsset: 'assets/themes/goddess_squad/initiative_first.png',
      secondInitiativeAsset:
          'assets/themes/goddess_squad/initiative_second.png',
      thumbAsset: 'assets/themes/goddess_squad/theme_thumb.png',
    ),
    ArenaThemePalette(
      id: ArenaThemeId.infinityRail,
      label: 'Infinity Rail',
      subtitle: 'Navy steel, signal red, rail glow',
      backgroundTint: Color(0xFFBDD0E2),
      backgroundShade: Color(0xFF091521),
      surface: Color(0xFFF2F7FB),
      surfaceStrong: Color(0xFFD6E2EE),
      surfaceMuted: Color(0xFF7C8EA3),
      border: Color(0xFF98AEC3),
      accent: Color(0xFFC95E6B),
      accentStrong: Color(0xFF8C3241),
      textPrimary: Color(0xFF101923),
      textSecondary: Color(0xFF4B6177),
      warning: Color(0xFFCC3B41),
      backgroundAsset: 'assets/themes/infinity_rail/background_main.png',
      heroGifAsset: 'assets/themes/infinity_rail/hero_loop.gif',
      firstInitiativeAsset: 'assets/themes/infinity_rail/initiative_first.png',
      secondInitiativeAsset:
          'assets/themes/infinity_rail/initiative_second.png',
      thumbAsset: 'assets/themes/infinity_rail/theme_thumb.png',
    ),
    ArenaThemePalette(
      id: ArenaThemeId.arcana,
      label: 'Arcana',
      subtitle: 'Midnight navy, amethyst, tarot gold',
      backgroundTint: Color(0xFFD0C0F0),
      backgroundShade: Color(0xFF0C0718),
      surface: Color(0xFFF7EFFD),
      surfaceStrong: Color(0xFFE1CEF2),
      surfaceMuted: Color(0xFF927CB4),
      border: Color(0xFFD6B66F),
      accent: Color(0xFF9163C2),
      accentStrong: Color(0xFF5E3187),
      textPrimary: Color(0xFF141221),
      textSecondary: Color(0xFF564B70),
      warning: Color(0xFFD34B59),
      backgroundAsset: 'assets/themes/arcana/background_main.png',
      heroGifAsset: 'assets/themes/arcana/hero_loop.gif',
      firstInitiativeAsset: 'assets/themes/arcana/initiative_first.png',
      secondInitiativeAsset: 'assets/themes/arcana/initiative_second.png',
      thumbAsset: 'assets/themes/arcana/theme_thumb.png',
    ),
  ];

  static ArenaThemePalette byId(ArenaThemeId id) {
    return all.firstWhere((palette) => palette.id == id);
  }
}
