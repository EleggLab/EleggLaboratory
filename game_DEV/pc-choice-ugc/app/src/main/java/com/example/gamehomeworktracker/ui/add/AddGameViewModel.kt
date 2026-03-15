package com.example.gamehomeworktracker.ui.add

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.gamehomeworktracker.data.installed.InstalledApp
import com.example.gamehomeworktracker.data.installed.InstalledAppsDataSource
import com.example.gamehomeworktracker.data.preferences.AddGameFilterMode
import com.example.gamehomeworktracker.data.preferences.AddGameSortMode
import com.example.gamehomeworktracker.data.preferences.UserPreferencesDataStore
import com.example.gamehomeworktracker.data.presets.PresetAssetDataSource
import com.example.gamehomeworktracker.data.presets.PresetMatch
import com.example.gamehomeworktracker.data.presets.PresetMatcher
import com.example.gamehomeworktracker.data.repository.TrackedGameRepository
import com.example.gamehomeworktracker.domain.model.UpsertTrackedGameRequest
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AddGameViewModel @Inject constructor(
    private val trackedGameRepository: TrackedGameRepository,
    private val installedAppsDataSource: InstalledAppsDataSource,
    private val presetAssetDataSource: PresetAssetDataSource,
    private val presetMatcher: PresetMatcher,
    private val userPreferencesDataStore: UserPreferencesDataStore
) : ViewModel() {

    private val installedApps = MutableStateFlow<List<InstalledApp>>(emptyList())
    private val presets = MutableStateFlow<List<com.example.gamehomeworktracker.data.presets.PresetFlatGame>>(emptyList())
    private val searchQuery = MutableStateFlow("")
    private val loading = MutableStateFlow(true)
    private val presetDialog = MutableStateFlow<PresetSelectionDialogState?>(null)
    private val manualDialog = MutableStateFlow<ManualSetupDialogState?>(null)

    private val baseUiState = combine(
        installedApps,
        trackedGameRepository.trackedGames,
        searchQuery,
        loading,
        userPreferencesDataStore.preferencesFlow
    ) { installed, tracked, query, isLoading, prefs ->

        val trackedByPackage = tracked.associateBy { it.packageName }
        val installedByPackage = installed.associateBy { it.packageName }

        val sourceItems: List<AddGameItemUiModel> = when (prefs.addGameFilterMode) {
            AddGameFilterMode.ALL -> {
                val installedItems = installed.map { app ->
                    val trackedGame = trackedByPackage[app.packageName]
                    AddGameItemUiModel(
                        packageName = app.packageName,
                        label = app.label,
                        isTracked = trackedGame != null,
                        trackedId = trackedGame?.id,
                        installedOnDevice = true
                    )
                }

                val trackedNotInstalled = tracked
                    .filter { !installedByPackage.containsKey(it.packageName) }
                    .map { trackedGame ->
                        AddGameItemUiModel(
                            packageName = trackedGame.packageName,
                            label = trackedGame.displayName,
                            isTracked = true,
                            trackedId = trackedGame.id,
                            installedOnDevice = false
                        )
                    }

                installedItems + trackedNotInstalled
            }

            AddGameFilterMode.TRACKED_ONLY -> tracked.map { trackedGame ->
                AddGameItemUiModel(
                    packageName = trackedGame.packageName,
                    label = trackedGame.displayName,
                    isTracked = true,
                    trackedId = trackedGame.id,
                    installedOnDevice = installedByPackage.containsKey(trackedGame.packageName)
                )
            }

            AddGameFilterMode.INSTALLED_ONLY -> installed.map { app ->
                val trackedGame = trackedByPackage[app.packageName]
                AddGameItemUiModel(
                    packageName = app.packageName,
                    label = app.label,
                    isTracked = trackedGame != null,
                    trackedId = trackedGame?.id,
                    installedOnDevice = true
                )
            }
        }

        val filtered = sourceItems
            .filter { item ->
                if (query.isBlank()) {
                    true
                } else {
                    val q = query.trim().lowercase()
                    item.label.lowercase().contains(q) || item.packageName.lowercase().contains(q)
                }
            }
            .sortedWith(compareBy<AddGameItemUiModel> { it.label.lowercase() }.thenBy { it.packageName.lowercase() })

        AddGameUiState(
            loading = isLoading,
            searchQuery = query,
            sortMode = prefs.addGameSortMode,
            filterMode = prefs.addGameFilterMode,
            items = filtered
        )
    }

    val uiState: StateFlow<AddGameUiState> = combine(
        baseUiState,
        presetDialog,
        manualDialog
    ) { base, matchDialog, manual ->
        base.copy(
            presetDialog = matchDialog,
            manualDialog = manual
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = AddGameUiState()
    )

    init {
        viewModelScope.launch {
            loading.value = true
            installedApps.value = installedAppsDataSource.loadLaunchableApps()
            presets.value = presetAssetDataSource.loadFlatPresets()
            loading.value = false
        }
    }

    fun onSearchQueryChanged(query: String) {
        searchQuery.value = query
    }

    fun onFilterModeChanged(mode: AddGameFilterMode) {
        viewModelScope.launch {
            userPreferencesDataStore.updateFilterMode(mode)
        }
    }

    fun onSortModeChanged(mode: AddGameSortMode) {
        viewModelScope.launch {
            userPreferencesDataStore.updateSortMode(mode)
        }
    }

    fun onToggleTracked(item: AddGameItemUiModel) {
        if (item.isTracked) {
            item.trackedId?.let { trackedId ->
                viewModelScope.launch {
                    trackedGameRepository.deleteById(trackedId)
                }
            }
            return
        }

        val matches = presetMatcher.match(item.label, item.packageName, presets.value, limit = 5)
        if (matches.isEmpty()) {
            manualDialog.value = ManualSetupDialogState(
                packageName = item.packageName,
                initialDisplayName = item.label,
                presetGameKey = null,
                presetConfidence = null
            )
            return
        }

        presetDialog.value = PresetSelectionDialogState(
            packageName = item.packageName,
            appLabel = item.label,
            matches = matches
        )
    }

    fun dismissPresetDialog() {
        presetDialog.value = null
    }

    fun selectPreset(match: PresetMatch) {
        val dialog = presetDialog.value ?: return
        val preset = match.preset

        if (preset.resetMinutesKst == null) {
            manualDialog.value = ManualSetupDialogState(
                packageName = dialog.packageName,
                initialDisplayName = dialog.appLabel,
                presetGameKey = preset.gameKey,
                presetConfidence = preset.confidence
            )
            presetDialog.value = null
            return
        }

        viewModelScope.launch {
            trackedGameRepository.upsertGame(
                UpsertTrackedGameRequest(
                    packageName = dialog.packageName,
                    displayName = dialog.appLabel,
                    resetMinutesKst = preset.resetMinutesKst,
                    presetGameKey = preset.gameKey,
                    presetConfidence = preset.confidence
                )
            )
            presetDialog.value = null
        }
    }

    fun openManualSetupFromPresetDialog() {
        val dialog = presetDialog.value ?: return
        val first = dialog.matches.firstOrNull()?.preset
        manualDialog.value = ManualSetupDialogState(
            packageName = dialog.packageName,
            initialDisplayName = dialog.appLabel,
            presetGameKey = first?.gameKey,
            presetConfidence = first?.confidence
        )
        presetDialog.value = null
    }

    fun dismissManualDialog() {
        manualDialog.value = null
    }

    fun submitManualSetup(displayName: String, hour: Int, minute: Int) {
        val dialog = manualDialog.value ?: return
        val resetMinutesKst = hour * 60 + minute

        viewModelScope.launch {
            trackedGameRepository.upsertGame(
                UpsertTrackedGameRequest(
                    packageName = dialog.packageName,
                    displayName = displayName.ifBlank { dialog.initialDisplayName },
                    resetMinutesKst = resetMinutesKst,
                    presetGameKey = dialog.presetGameKey,
                    presetConfidence = dialog.presetConfidence ?: "unknown"
                )
            )
            manualDialog.value = null
        }
    }
}
