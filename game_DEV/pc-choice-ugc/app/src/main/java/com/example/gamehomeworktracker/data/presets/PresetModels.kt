package com.example.gamehomeworktracker.data.presets

import kotlinx.serialization.Serializable

@Serializable
data class PresetFlatRoot(
    val schemaVersion: Int,
    val generatedAtUtc: String,
    val baseTimezone: String,
    val games: List<PresetFlatGame>
)

@Serializable
data class PresetFlatGame(
    val gameKey: String,
    val displayName: String,
    val aliases: List<String> = emptyList(),
    val resetTimeKst: String? = null,
    val resetMinutesKst: Int? = null,
    val confidence: String = "unknown",
    val sourceUrl: String = "",
    val sourceNote: String = "",
    val packageNameHints: List<String> = emptyList()
)

data class PresetMatch(
    val preset: PresetFlatGame,
    val score: Int,
    val reason: String
)
