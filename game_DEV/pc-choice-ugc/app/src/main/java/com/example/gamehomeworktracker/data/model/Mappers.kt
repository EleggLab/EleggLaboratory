package com.example.gamehomeworktracker.data.model

import com.example.gamehomeworktracker.data.local.TrackedGameEntity
import com.example.gamehomeworktracker.domain.model.TrackedGame

fun TrackedGameEntity.toDomain(): TrackedGame {
    return TrackedGame(
        id = id,
        packageName = packageName,
        displayName = displayName,
        resetMinutesKst = resetMinutesKst,
        cleared = cleared,
        clearedAt = clearedAt,
        createdAt = createdAt,
        presetGameKey = presetGameKey,
        presetConfidence = presetConfidence,
        cycleKey = cycleKey
    )
}
