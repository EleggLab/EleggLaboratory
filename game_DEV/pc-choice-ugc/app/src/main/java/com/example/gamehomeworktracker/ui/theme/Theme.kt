package com.example.gamehomeworktracker.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

private val LightColors = lightColorScheme(
    primary = BluePrimary,
    onPrimary = androidx.compose.ui.graphics.Color.White,
    primaryContainer = androidx.compose.ui.graphics.Color(0xFFD9E2FF),
    onPrimaryContainer = androidx.compose.ui.graphics.Color(0xFF001A47),
    secondary = SkySecondary,
    onSecondary = androidx.compose.ui.graphics.Color.White,
    secondaryContainer = androidx.compose.ui.graphics.Color(0xFFC8EDFF),
    onSecondaryContainer = androidx.compose.ui.graphics.Color(0xFF001F2A),
    tertiary = AmberTertiary,
    onTertiary = androidx.compose.ui.graphics.Color.White,
    tertiaryContainer = androidx.compose.ui.graphics.Color(0xFFFFDEB6),
    onTertiaryContainer = androidx.compose.ui.graphics.Color(0xFF2B1700),
    background = LightBackground,
    onBackground = androidx.compose.ui.graphics.Color(0xFF101522),
    surface = LightSurface,
    onSurface = androidx.compose.ui.graphics.Color(0xFF101522),
    surfaceVariant = LightSurfaceVariant,
    onSurfaceVariant = androidx.compose.ui.graphics.Color(0xFF414B65),
    outline = LightOutline,
    error = androidx.compose.ui.graphics.Color(0xFFBA1A1A),
    onError = androidx.compose.ui.graphics.Color.White,
    errorContainer = androidx.compose.ui.graphics.Color(0xFFFFDAD6),
    onErrorContainer = androidx.compose.ui.graphics.Color(0xFF410002)
)

private val DarkColors = darkColorScheme(
    primary = BluePrimaryDark,
    onPrimary = androidx.compose.ui.graphics.Color(0xFF002D70),
    primaryContainer = androidx.compose.ui.graphics.Color(0xFF1B3E8A),
    onPrimaryContainer = androidx.compose.ui.graphics.Color(0xFFD9E2FF),
    secondary = SkySecondaryDark,
    onSecondary = androidx.compose.ui.graphics.Color(0xFF003546),
    secondaryContainer = androidx.compose.ui.graphics.Color(0xFF004D64),
    onSecondaryContainer = androidx.compose.ui.graphics.Color(0xFFC8EDFF),
    tertiary = AmberTertiaryDark,
    onTertiary = androidx.compose.ui.graphics.Color(0xFF482900),
    tertiaryContainer = androidx.compose.ui.graphics.Color(0xFF663D00),
    onTertiaryContainer = androidx.compose.ui.graphics.Color(0xFFFFDEB6),
    background = DarkBackground,
    onBackground = androidx.compose.ui.graphics.Color(0xFFDEE3F0),
    surface = DarkSurface,
    onSurface = androidx.compose.ui.graphics.Color(0xFFDEE3F0),
    surfaceVariant = DarkSurfaceVariant,
    onSurfaceVariant = androidx.compose.ui.graphics.Color(0xFFC0C7E0),
    outline = DarkOutline,
    error = androidx.compose.ui.graphics.Color(0xFFFFB4AB),
    onError = androidx.compose.ui.graphics.Color(0xFF690005),
    errorContainer = androidx.compose.ui.graphics.Color(0xFF93000A),
    onErrorContainer = androidx.compose.ui.graphics.Color(0xFFFFDAD6)
)

@Composable
fun GameHomeworkTrackerTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val context = LocalContext.current
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }

        darkTheme -> DarkColors
        else -> LightColors
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = AppTypography,
        content = content
    )
}
