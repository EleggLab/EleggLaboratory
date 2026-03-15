package com.example.gamehomeworktracker.data.presets

import android.content.Context
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PresetAssetDataSource @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val json = Json { ignoreUnknownKeys = true }

    @Volatile
    private var cached: List<PresetFlatGame>? = null

    suspend fun loadFlatPresets(): List<PresetFlatGame> = withContext(Dispatchers.IO) {
        cached?.let { return@withContext it }

        val content = context.assets.open("presets_kr_flat.json").bufferedReader().use { it.readText() }
        val parsed = json.decodeFromString<PresetFlatRoot>(content)
        parsed.games.also { cached = it }
    }
}
