package com.example.gamehomeworktracker.data.repository

import com.example.gamehomeworktracker.core.time.KstResetCalculator
import com.example.gamehomeworktracker.data.local.TrackedGameDao
import com.example.gamehomeworktracker.data.local.TrackedGameEntity
import com.example.gamehomeworktracker.data.model.toDomain
import com.example.gamehomeworktracker.domain.model.TrackedGame
import com.example.gamehomeworktracker.domain.model.UpsertTrackedGameRequest
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.time.Instant
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TrackedGameRepository @Inject constructor(
    private val trackedGameDao: TrackedGameDao
) {
    val trackedGames: Flow<List<TrackedGame>> = trackedGameDao.observeAll().map { entities ->
        entities.map { it.toDomain() }
    }

    suspend fun upsertGame(request: UpsertTrackedGameRequest, now: Instant = Instant.now()) {
        val existing = trackedGameDao.findByPackageName(request.packageName)
        val cycleStart = KstResetCalculator.cycleStartKst(now, request.resetMinutesKst)
        val cycleKey = KstResetCalculator.cycleKeyKst(cycleStart, request.resetMinutesKst)

        val entity = TrackedGameEntity(
            id = existing?.id ?: UUID.randomUUID().toString(),
            packageName = request.packageName,
            displayName = request.displayName,
            resetMinutesKst = request.resetMinutesKst,
            cleared = if (existing?.cycleKey == cycleKey) existing.cleared else false,
            clearedAt = if (existing?.cycleKey == cycleKey) existing.clearedAt else null,
            createdAt = existing?.createdAt ?: System.currentTimeMillis(),
            presetGameKey = request.presetGameKey,
            presetConfidence = request.presetConfidence,
            cycleKey = cycleKey
        )

        trackedGameDao.upsert(entity)
    }

    suspend fun deleteById(id: String) {
        trackedGameDao.deleteById(id)
    }

    suspend fun getAll(): List<TrackedGame> {
        return trackedGameDao.getAll().map { it.toDomain() }
    }

    suspend fun setCleared(gameId: String, cleared: Boolean, atMillis: Long = System.currentTimeMillis()) {
        trackedGameDao.updateCleared(gameId, cleared, if (cleared) atMillis else null)
    }

    suspend fun resetAllCleared() {
        trackedGameDao.resetAllCleared()
    }

    suspend fun syncCycleStates(now: Instant = Instant.now()) {
        val entities = trackedGameDao.getAll()
        entities.forEach { entity ->
            val cycleStart = KstResetCalculator.cycleStartKst(now, entity.resetMinutesKst)
            val cycleKey = KstResetCalculator.cycleKeyKst(cycleStart, entity.resetMinutesKst)
            if (cycleKey != entity.cycleKey) {
                trackedGameDao.updateCycleState(
                    id = entity.id,
                    cleared = false,
                    clearedAt = null,
                    cycleKey = cycleKey
                )
            }
        }
    }
}
