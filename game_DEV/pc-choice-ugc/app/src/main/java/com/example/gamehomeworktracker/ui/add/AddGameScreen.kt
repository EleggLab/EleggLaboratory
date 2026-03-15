package com.example.gamehomeworktracker.ui.add

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ElevatedAssistChip
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TimeInput
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.rememberTimePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.gamehomeworktracker.data.preferences.AddGameFilterMode
import com.example.gamehomeworktracker.data.preferences.AddGameSortMode
import com.example.gamehomeworktracker.data.presets.PresetMatch
import com.example.gamehomeworktracker.ui.common.PackageIcon

@Composable
fun AddGameRoute(
    onBack: () -> Unit,
    viewModel: AddGameViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    AddGameScreen(
        state = state,
        onBack = onBack,
        onSearchQueryChanged = viewModel::onSearchQueryChanged,
        onFilterModeChanged = viewModel::onFilterModeChanged,
        onSortModeChanged = viewModel::onSortModeChanged,
        onToggleTracked = viewModel::onToggleTracked,
        onSelectPreset = viewModel::selectPreset,
        onDismissPresetDialog = viewModel::dismissPresetDialog,
        onOpenManualSetup = viewModel::openManualSetupFromPresetDialog,
        onDismissManualDialog = viewModel::dismissManualDialog,
        onSubmitManualSetup = viewModel::submitManualSetup
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddGameScreen(
    state: AddGameUiState,
    onBack: () -> Unit,
    onSearchQueryChanged: (String) -> Unit,
    onFilterModeChanged: (AddGameFilterMode) -> Unit,
    onSortModeChanged: (AddGameSortMode) -> Unit,
    onToggleTracked: (AddGameItemUiModel) -> Unit,
    onSelectPreset: (PresetMatch) -> Unit,
    onDismissPresetDialog: () -> Unit,
    onOpenManualSetup: () -> Unit,
    onDismissManualDialog: () -> Unit,
    onSubmitManualSetup: (String, Int, Int) -> Unit
) {
    val trackedCount = state.items.count { it.isTracked }

    Scaffold(
        topBar = {
            TopAppBar(
                colors = TopAppBarDefaults.topAppBarColors(),
                title = { Text("게임 추가") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "뒤로"
                        )
                    }
                }
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 12.dp)
        ) {
            Spacer(modifier = Modifier.height(8.dp))
            OutlinedTextField(
                value = state.searchQuery,
                onValueChange = onSearchQueryChanged,
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                leadingIcon = {
                    Icon(Icons.Default.Search, contentDescription = null)
                },
                label = { Text("게임 이름 또는 패키지 검색") }
            )

            Spacer(modifier = Modifier.height(10.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FilterChip(
                    selected = state.sortMode == AddGameSortMode.NAME,
                    onClick = { onSortModeChanged(AddGameSortMode.NAME) },
                    label = { Text("이름순") }
                )
                FilterChip(
                    selected = state.filterMode == AddGameFilterMode.ALL,
                    onClick = { onFilterModeChanged(AddGameFilterMode.ALL) },
                    label = { Text("전체") }
                )
                FilterChip(
                    selected = state.filterMode == AddGameFilterMode.TRACKED_ONLY,
                    onClick = { onFilterModeChanged(AddGameFilterMode.TRACKED_ONLY) },
                    label = { Text("등록됨") }
                )
            }

            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FilterChip(
                    selected = state.filterMode == AddGameFilterMode.INSTALLED_ONLY,
                    onClick = { onFilterModeChanged(AddGameFilterMode.INSTALLED_ONLY) },
                    label = { Text("설치된 앱") }
                )
                Surface(
                    shape = MaterialTheme.shapes.small,
                    color = MaterialTheme.colorScheme.surfaceVariant
                ) {
                    Text(
                        text = "등록 $trackedCount / 전체 ${state.items.size}",
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
                        style = MaterialTheme.typography.labelMedium
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            if (state.loading) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Text("불러오는 중...")
                }
            } else if (state.items.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "검색 결과가 없습니다.",
                        style = MaterialTheme.typography.bodyLarge
                    )
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(state.items, key = { it.packageName }) { item ->
                        AddGameItemCard(
                            item = item,
                            onToggleTracked = { onToggleTracked(item) }
                        )
                    }
                }
            }
        }
    }

    state.presetDialog?.let { dialog ->
        PresetSelectionDialog(
            dialog = dialog,
            onSelectPreset = onSelectPreset,
            onOpenManualSetup = onOpenManualSetup,
            onDismiss = onDismissPresetDialog
        )
    }

    state.manualDialog?.let { dialog ->
        ManualSetupDialog(
            state = dialog,
            onDismiss = onDismissManualDialog,
            onSubmit = onSubmitManualSetup
        )
    }
}

@Composable
private fun AddGameItemCard(
    item: AddGameItemUiModel,
    onToggleTracked: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (item.isTracked) {
                MaterialTheme.colorScheme.primaryContainer
            } else {
                MaterialTheme.colorScheme.surface
            }
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            PackageIcon(
                packageName = item.packageName,
                contentDescription = "${item.label} 아이콘",
                modifier = Modifier.size(42.dp)
            )

            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    text = item.label,
                    style = MaterialTheme.typography.titleSmall,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = item.packageName,
                    style = MaterialTheme.typography.bodySmall,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    ElevatedAssistChip(
                        onClick = {},
                        enabled = false,
                        label = {
                            Text(if (item.installedOnDevice) "설치됨" else "미설치")
                        }
                    )
                    if (item.isTracked) {
                        ElevatedAssistChip(
                            onClick = {},
                            enabled = false,
                            label = { Text("등록됨") }
                        )
                    }
                }
            }

            if (item.isTracked) {
                OutlinedButton(onClick = onToggleTracked) {
                    Text("제거")
                }
            } else {
                Button(onClick = onToggleTracked) {
                    Text("추가")
                }
            }
        }
    }
}

@Composable
private fun PresetSelectionDialog(
    dialog: PresetSelectionDialogState,
    onSelectPreset: (PresetMatch) -> Unit,
    onOpenManualSetup: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("프리셋 매칭 결과") },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(300.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "${dialog.appLabel}에 대한 추천 ${dialog.matches.size}개",
                    style = MaterialTheme.typography.bodyMedium
                )
                dialog.matches.forEach { match ->
                    PresetMatchCard(match = match, onSelect = { onSelectPreset(match) })
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onOpenManualSetup) {
                Text("직접 설정")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("취소")
            }
        }
    )
}

@Composable
private fun PresetMatchCard(
    match: PresetMatch,
    onSelect: () -> Unit
) {
    val preset = match.preset
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(10.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = preset.displayName,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold
            )
            Text(
                text = "리셋: ${preset.resetTimeKst ?: "Unknown"}",
                style = MaterialTheme.typography.bodySmall
            )
            Text(
                text = "신뢰도: ${preset.confidence} / score ${match.score}",
                style = MaterialTheme.typography.bodySmall
            )
            if (match.reason.isNotBlank()) {
                Text(
                    text = "매칭 근거: ${match.reason}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Spacer(modifier = Modifier.height(2.dp))
            Button(onClick = onSelect) {
                Text("이 프리셋 사용")
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ManualSetupDialog(
    state: ManualSetupDialogState,
    onDismiss: () -> Unit,
    onSubmit: (String, Int, Int) -> Unit
) {
    var displayName by rememberSaveable(state.packageName) { mutableStateOf(state.initialDisplayName) }
    val timePickerState = rememberTimePickerState(
        initialHour = state.initialResetMinutesKst / 60,
        initialMinute = state.initialResetMinutesKst % 60,
        is24Hour = true
    )

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("리셋시간 직접 설정") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = displayName,
                    onValueChange = { displayName = it },
                    label = { Text("표시 이름") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                TimeInput(state = timePickerState)
            }
        },
        confirmButton = {
            TextButton(onClick = {
                onSubmit(displayName, timePickerState.hour, timePickerState.minute)
            }) {
                Text("저장")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("취소")
            }
        }
    )
}
