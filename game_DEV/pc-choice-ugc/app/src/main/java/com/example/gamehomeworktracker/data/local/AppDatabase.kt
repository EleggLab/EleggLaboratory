package com.example.gamehomeworktracker.data.local

import androidx.room.Database
import androidx.room.RoomDatabase

@Database(
    entities = [TrackedGameEntity::class],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun trackedGameDao(): TrackedGameDao
}
