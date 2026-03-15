package com.example.gamehomeworktracker.di

import android.content.Context
import androidx.room.Room
import com.example.gamehomeworktracker.data.local.AppDatabase
import com.example.gamehomeworktracker.data.local.TrackedGameDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {
    @Provides
    @Singleton
    fun provideAppDatabase(
        @ApplicationContext context: Context
    ): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "game_homework_tracker.db"
        ).fallbackToDestructiveMigration().build()
    }

    @Provides
    fun provideTrackedGameDao(database: AppDatabase): TrackedGameDao = database.trackedGameDao()
}
