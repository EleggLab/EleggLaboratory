package com.example.gamehomeworktracker.data.preferences

import android.content.Context
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.userPrefsDataStore by preferencesDataStore(name = "user_prefs")

enum class AddGameSortMode { NAME }
enum class AddGameFilterMode { ALL, TRACKED_ONLY, INSTALLED_ONLY }

data class UserPreferences(
    val addGameSortMode: AddGameSortMode = AddGameSortMode.NAME,
    val addGameFilterMode: AddGameFilterMode = AddGameFilterMode.ALL
)

@Singleton
class UserPreferencesDataStore @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val sortKey = stringPreferencesKey("add_game_sort_mode")
    private val filterKey = stringPreferencesKey("add_game_filter_mode")

    val preferencesFlow: Flow<UserPreferences> = context.userPrefsDataStore.data.map { prefs ->
        UserPreferences(
            addGameSortMode = prefs[sortKey].toEnumOrDefault(AddGameSortMode.NAME),
            addGameFilterMode = prefs[filterKey].toEnumOrDefault(AddGameFilterMode.ALL)
        )
    }

    suspend fun updateSortMode(mode: AddGameSortMode) {
        context.userPrefsDataStore.edit { prefs ->
            prefs[sortKey] = mode.name
        }
    }

    suspend fun updateFilterMode(mode: AddGameFilterMode) {
        context.userPrefsDataStore.edit { prefs ->
            prefs[filterKey] = mode.name
        }
    }
}

private inline fun <reified T : Enum<T>> String?.toEnumOrDefault(default: T): T {
    if (this.isNullOrBlank()) return default
    return runCatching { enumValueOf<T>(this) }.getOrDefault(default)
}
