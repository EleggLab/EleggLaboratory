package com.example.gamehomeworktracker.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface TrackedGameDao {
    @Query("SELECT * FROM tracked_games ORDER BY lower(displayName)")
    fun observeAll(): Flow<List<TrackedGameEntity>>

    @Query("SELECT * FROM tracked_games ORDER BY lower(displayName)")
    suspend fun getAll(): List<TrackedGameEntity>

    @Query("SELECT * FROM tracked_games WHERE packageName = :packageName LIMIT 1")
    suspend fun findByPackageName(packageName: String): TrackedGameEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(entity: TrackedGameEntity)

    @Query("DELETE FROM tracked_games WHERE id = :id")
    suspend fun deleteById(id: String)

    @Query("UPDATE tracked_games SET cleared = :cleared, clearedAt = :clearedAt WHERE id = :id")
    suspend fun updateCleared(id: String, cleared: Boolean, clearedAt: Long?)

    @Query("UPDATE tracked_games SET cleared = :cleared, clearedAt = :clearedAt, cycleKey = :cycleKey WHERE id = :id")
    suspend fun updateCycleState(id: String, cleared: Boolean, clearedAt: Long?, cycleKey: String)

    @Query("UPDATE tracked_games SET cleared = 0, clearedAt = NULL")
    suspend fun resetAllCleared()
}
