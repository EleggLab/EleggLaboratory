package com.example.gamehomeworktracker.ui.home

import java.time.Instant

data class HomeGameUiModel(
    val id: String,
    val packageName: String,
    val displayName: String,
    val remainingSeconds: Long,
    val playMillisToday: Long,
    val cleared: Boolean,
    val resetMinutesKst: Int,
    val presetConfidence: String?
)

data class HomeUiState(
    val games: List<HomeGameUiModel> = emptyList(),
    val completedCount: Int = 0,
    val totalCount: Int = 0,
    val progressRatio: Float = 0f,
    val usagePermissionGranted: Boolean = true,
    val nowInstant: Instant = Instant.now()
)
