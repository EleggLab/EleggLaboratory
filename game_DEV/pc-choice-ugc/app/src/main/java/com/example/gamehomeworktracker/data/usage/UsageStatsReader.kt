package com.example.gamehomeworktracker.data.usage

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.os.Build
import android.os.Process
import com.example.gamehomeworktracker.core.time.KstResetCalculator
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.time.Instant
import javax.inject.Inject
import javax.inject.Singleton

interface UsageStatsReader {
    fun hasUsagePermission(): Boolean
    suspend fun queryTodayUsageByPackage(nowInstant: Instant = Instant.now()): Map<String, Long>
}

@Singleton
class AndroidUsageStatsReader @Inject constructor(
    @ApplicationContext private val context: Context
) : UsageStatsReader {

    private val usageStatsManager: UsageStatsManager by lazy {
        context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    }

    override fun hasUsagePermission(): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
        } else {
            @Suppress("DEPRECATION")
            appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
        }
        return mode == AppOpsManager.MODE_ALLOWED
    }

    override suspend fun queryTodayUsageByPackage(nowInstant: Instant): Map<String, Long> = withContext(Dispatchers.Default) {
        if (!hasUsagePermission()) return@withContext emptyMap()

        val startMillis = KstResetCalculator.startOfTodayKst(nowInstant).toEpochMilli()
        val endMillis = nowInstant.toEpochMilli()
        if (endMillis <= startMillis) return@withContext emptyMap()

        val usageEvents = usageStatsManager.queryEvents(startMillis, endMillis)
        val event = UsageEvents.Event()

        val activeStarts = mutableMapOf<String, Long>()
        val totals = mutableMapOf<String, Long>()

        while (usageEvents.hasNextEvent()) {
            usageEvents.getNextEvent(event)

            val packageName = event.packageName ?: continue
            val timestamp = event.timeStamp

            when (event.eventType) {
                UsageEvents.Event.MOVE_TO_FOREGROUND,
                UsageEvents.Event.ACTIVITY_RESUMED -> {
                    activeStarts[packageName] = timestamp
                }

                UsageEvents.Event.MOVE_TO_BACKGROUND,
                UsageEvents.Event.ACTIVITY_PAUSED -> {
                    val startedAt = activeStarts.remove(packageName) ?: continue
                    if (timestamp > startedAt) {
                        val duration = timestamp - startedAt
                        totals[packageName] = (totals[packageName] ?: 0L) + duration
                    }
                }
            }
        }

        for ((packageName, startedAt) in activeStarts) {
            if (endMillis > startedAt) {
                val duration = endMillis - startedAt
                totals[packageName] = (totals[packageName] ?: 0L) + duration
            }
        }

        totals
    }
}
