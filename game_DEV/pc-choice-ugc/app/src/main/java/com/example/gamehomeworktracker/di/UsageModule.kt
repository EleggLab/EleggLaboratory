package com.example.gamehomeworktracker.di

import com.example.gamehomeworktracker.data.usage.AndroidUsageStatsReader
import com.example.gamehomeworktracker.data.usage.UsageStatsReader
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class UsageModule {
    @Binds
    @Singleton
    abstract fun bindUsageStatsReader(impl: AndroidUsageStatsReader): UsageStatsReader
}
