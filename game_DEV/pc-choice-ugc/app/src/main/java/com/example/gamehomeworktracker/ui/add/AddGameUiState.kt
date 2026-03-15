package com.example.gamehomeworktracker.ui.add

import com.example.gamehomeworktracker.data.preferences.AddGameFilterMode
import com.example.gamehomeworktracker.data.preferences.AddGameSortMode
import com.example.gamehomeworktracker.data.presets.PresetMatch

data class AddGameItemUiModel(
    val packageName: String,
    val label: String,
    val isTracked: Boolean,
    val trackedId: String?,
    val installedOnDevice: Boolean
)

data class PresetSelectionDialogState(
    val packageName: String,
    val appLabel: String,
    val matches: List<PresetMatch>
)

data class ManualSetupDialogState(
    val packageName: String,
    val initialDisplayName: String,
    val presetGameKey: String?,
    val presetConfidence: String?,
    val initialResetMinutesKst: Int = 5 * 60
)

data class AddGameUiState(
    val loading: Boolean = true,
    val searchQuery: String = "",
    val sortMode: AddGameSortMode = AddGameSortMode.NAME,
    val filterMode: AddGameFilterMode = AddGameFilterMode.ALL,
    val items: List<AddGameItemUiModel> = emptyList(),
    val presetDialog: PresetSelectionDialogState? = null,
    val manualDialog: ManualSetupDialogState? = null
)
