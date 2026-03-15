package com.example.gamehomeworktracker.domain.model

data class TrackedGame(
    val id: String,
    val packageName: String,
    val displayName: String,
    val resetMinutesKst: Int,
    val cleared: Boolean,
    val clearedAt: Long?,
    val createdAt: Long,
    val presetGameKey: String?,
    val presetConfidence: String?,
    val cycleKey: String
)

data class UpsertTrackedGameRequest(
    val packageName: String,
    val displayName: String,
    val resetMinutesKst: Int,
    val presetGameKey: String? = null,
    val presetConfidence: String? = null
)
