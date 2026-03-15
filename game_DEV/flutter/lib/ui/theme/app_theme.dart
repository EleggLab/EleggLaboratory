import 'package:flutter/material.dart';

import 'app_tokens.dart';

class AppTheme {
  static ThemeData light() {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: const Color(0xFF2F7CF6),
      brightness: Brightness.light,
    );

    final baseTextTheme = Typography.blackCupertino.apply(
      bodyColor: colorScheme.onSurface,
      displayColor: colorScheme.onSurface,
    );

    final textTheme = baseTextTheme.copyWith(
      titleLarge: baseTextTheme.titleLarge?.copyWith(
        fontSize: 24,
        fontWeight: FontWeight.w800,
        letterSpacing: -0.2,
      ),
      titleMedium: baseTextTheme.titleMedium?.copyWith(
        fontSize: 18,
        fontWeight: FontWeight.w700,
      ),
      bodyLarge: baseTextTheme.bodyLarge?.copyWith(
        fontSize: 16,
        fontWeight: FontWeight.w500,
      ),
      bodyMedium: baseTextTheme.bodyMedium?.copyWith(
        fontSize: 14,
        fontWeight: FontWeight.w500,
      ),
      bodySmall: baseTextTheme.bodySmall?.copyWith(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        color: colorScheme.onSurfaceVariant,
      ),
      labelLarge: baseTextTheme.labelLarge?.copyWith(
        fontSize: 15,
        fontWeight: FontWeight.w700,
      ),
    );

    final cardShape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(AppTokens.radiusCard),
    );
    final buttonShape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(AppTokens.radiusButton),
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      textTheme: textTheme,
      scaffoldBackgroundColor: colorScheme.surfaceContainerLowest,
      appBarTheme: AppBarTheme(
        backgroundColor: colorScheme.surfaceContainerLowest,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        titleSpacing: 16,
        toolbarHeight: 74,
        titleTextStyle: textTheme.titleMedium?.copyWith(
          color: colorScheme.onSurface,
        ),
      ),
      cardTheme: CardThemeData(
        shape: cardShape,
        elevation: 1,
        shadowColor: colorScheme.shadow.withValues(alpha: 0.06),
        surfaceTintColor: Colors.transparent,
        margin: EdgeInsets.zero,
      ),
      dialogTheme: DialogThemeData(
        shape: cardShape,
        elevation: 1,
        shadowColor: colorScheme.shadow.withValues(alpha: 0.08),
        surfaceTintColor: Colors.transparent,
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          shape: buttonShape,
          minimumSize: const Size(0, AppTokens.minTapTarget),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          foregroundColor: colorScheme.onPrimary,
          backgroundColor: colorScheme.primary,
          textStyle: textTheme.labelLarge,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          shape: buttonShape,
          minimumSize: const Size(0, AppTokens.minTapTarget),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          side: BorderSide(color: colorScheme.outlineVariant),
          textStyle: textTheme.labelLarge,
        ),
      ),
      segmentedButtonTheme: SegmentedButtonThemeData(
        style: ButtonStyle(
          shape: WidgetStatePropertyAll<RoundedRectangleBorder>(buttonShape),
          textStyle: WidgetStatePropertyAll<TextStyle?>(
            textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700),
          ),
        ),
      ),
      chipTheme: ChipThemeData(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: colorScheme.surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(AppTokens.radiusCard + 4),
          ),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppTokens.radiusButton),
        ),
      ),
    );
  }
}
