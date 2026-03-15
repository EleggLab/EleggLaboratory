package com.example.gamehomeworktracker.data.installed

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

data class InstalledApp(
    val packageName: String,
    val label: String
)

@Singleton
class InstalledAppsDataSource @Inject constructor(
    @ApplicationContext private val context: Context
) {
    suspend fun loadLaunchableApps(): List<InstalledApp> = withContext(Dispatchers.IO) {
        val packageManager = context.packageManager
        val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)

        val activities = packageManager.queryIntentActivities(intent, PackageManager.MATCH_ALL)
        activities
            .map { info ->
                val packageName = info.activityInfo.packageName
                val label = info.loadLabel(packageManager)?.toString()?.trim().orEmpty().ifBlank { packageName }
                InstalledApp(packageName = packageName, label = label)
            }
            .distinctBy { it.packageName }
            .sortedBy { it.label.lowercase() }
    }
}
