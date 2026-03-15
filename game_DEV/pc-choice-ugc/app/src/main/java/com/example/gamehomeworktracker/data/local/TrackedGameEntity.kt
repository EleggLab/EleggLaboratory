package com.example.gamehomeworktracker.data.local

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "tracked_games",
    indices = [Index(value = ["packageName"], unique = true)]
)
data class TrackedGameEntity(
    @PrimaryKey val id: String,
    val packageName: String,
    val displayName: String,
    val resetMinutesKst: Int,
    val cleared: Boolean,
    val clearedAt: Long?,
    val createdAt: Long,
    val presetGameKey: String?,
    val presetConfidence: String?,
    @ColumnInfo(defaultValue = "")
    val cycleKey: String
)
