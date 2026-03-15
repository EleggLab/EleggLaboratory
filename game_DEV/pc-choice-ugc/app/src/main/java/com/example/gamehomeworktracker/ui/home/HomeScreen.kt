package com.example.gamehomeworktracker.ui.home

import android.content.Intent
import android.provider.Settings
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.gamehomeworktracker.core.format.formatDurationHhMmSs
import com.example.gamehomeworktracker.core.format.formatPlayTime
import com.example.gamehomeworktracker.ui.common.PackageIcon
import com.example.gamehomeworktracker.ui.theme.OnSuccessContainer
import com.example.gamehomeworktracker.ui.theme.SuccessContainer

@Composable
fun HomeRoute(
    onNavigateToAddGame: () -> Unit,
    onNavigateToInfo: () -> Unit,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_START -> viewModel.onAppForegroundChanged(true)
                Lifecycle.Event.ON_STOP -> viewModel.onAppForegroundChanged(false)
                else -> Unit
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
            viewModel.onAppForegroundChanged(false)
        }
    }

    HomeScreen(
        state = state,
        onAddGameClick = onNavigateToAddGame,
        onInfoClick = onNavigateToInfo,
        onSetCleared = viewModel::setCleared,
        onResetAll = viewModel::resetAllCleared,
        onRefreshUsagePermission = viewModel::refreshUsagePermissionAndData
    )
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)
@Composable
fun HomeScreen(
    state: HomeUiState,
    onAddGameClick: () -> Unit,
    onInfoClick: () -> Unit,
    onSetCleared: (String, Boolean) -> Unit,
    onResetAll: () -> Unit,
    onRefreshUsagePermission: () -> Unit
) {
    val context = LocalContext.current
    var undoDialogTarget by remember { mutableStateOf<HomeGameUiModel?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                ),
                title = { Text("모바일 게임 숙제 트래커") },
                actions = {
                    IconButton(onClick = onInfoClick) {
                        Icon(imageVector = Icons.Default.Info, contentDescription = "정보")
                    }
                }
            )
        },
        bottomBar = {
            Surface(tonalElevation = 4.dp) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    FilledTonalButton(
                        onClick = onAddGameClick,
                        modifier = Modifier
                            .weight(1f)
                            .height(52.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null)
                        Spacer(modifier = Modifier.size(8.dp))
                        Text("게임 추가")
                    }
                    OutlinedButton(
                        onClick = onResetAll,
                        modifier = Modifier
                            .weight(1f)
                            .height(52.dp)
                    ) {
                        Icon(Icons.Default.Refresh, contentDescription = null)
                        Spacer(modifier = Modifier.size(8.dp))
                        Text("전체 초기화")
                    }
                }
            }
        }
    ) { innerPadding ->
        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 12.dp),
            contentPadding = PaddingValues(top = 8.dp, bottom = 96.dp)
        ) {
            item(span = { GridItemSpan(2) }) {
                ProgressSummaryCard(state = state)
            }

            if (!state.usagePermissionGranted) {
                item(span = { GridItemSpan(2) }) {
                    UsagePermissionBanner(
                        onOpenPermissionSettings = {
                            context.startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
                            onRefreshUsagePermission()
                        }
                    )
                }
            }

            if (state.games.isEmpty()) {
                item(span = { GridItemSpan(2) }) {
                    EmptyStateCard(onAddGameClick = onAddGameClick)
                }
            } else {
                items(state.games, key = { it.id }) { game ->
                    GameCard(
                        game = game,
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                if (game.cleared) {
                                    undoDialogTarget = game
                                } else {
                                    onSetCleared(game.id, true)
                                }
                            }
                    )
                }
            }
        }
    }

    undoDialogTarget?.let { game ->
        AlertDialog(
            onDismissRequest = { undoDialogTarget = null },
            title = { Text("숙제 안했나요?") },
            text = { Text("완료 체크를 해제할까요?") },
            confirmButton = {
                Button(
                    onClick = {
                        onSetCleared(game.id, false)
                        undoDialogTarget = null
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.errorContainer,
                        contentColor = MaterialTheme.colorScheme.onErrorContainer
                    )
                ) {
                    Text("안했어요")
                }
            },
            dismissButton = {
                TextButton(onClick = { undoDialogTarget = null }) {
                    Text("그대로 둘게요")
                }
            }
        )
    }
}

@Composable
private fun ProgressSummaryCard(state: HomeUiState) {
    val percent = if (state.totalCount == 0) 0 else (state.progressRatio * 100f).toInt()
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Text(
                text = "오늘 숙제 진행",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onPrimaryContainer
            )
            LinearProgressIndicator(
                progress = { state.progressRatio },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "완료 ${state.completedCount}/${state.totalCount}",
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
                Text(
                    text = "$percent%",
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
        }
    }
}

@Composable
private fun UsagePermissionBanner(
    onOpenPermissionSettings: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.errorContainer
        )
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = "플레이 시간 집계를 위해 Usage Access 권한이 필요합니다.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onErrorContainer
            )
            Button(onClick = onOpenPermissionSettings) {
                Text("권한 설정으로 이동")
            }
        }
    }
}

@Composable
private fun EmptyStateCard(onAddGameClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "등록된 게임이 없습니다",
                style = MaterialTheme.typography.titleMedium
            )
            Text(
                text = "하단의 게임 추가 버튼으로 시작하세요.",
                style = MaterialTheme.typography.bodyMedium
            )
            FilledTonalButton(onClick = onAddGameClick) {
                Icon(Icons.Default.Add, contentDescription = null)
                Spacer(modifier = Modifier.size(8.dp))
                Text("게임 추가")
            }
        }
    }
}

@Composable
private fun GameCard(
    game: HomeGameUiModel,
    modifier: Modifier = Modifier
) {
    val colors = if (game.cleared) {
        CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    } else {
        CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    }

    Card(
        modifier = modifier,
        colors = colors,
        border = if (game.cleared) {
            null
        } else {
            BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.2f))
        },
        elevation = CardDefaults.cardElevation(defaultElevation = if (game.cleared) 1.dp else 5.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = 176.dp)
                .padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                PackageIcon(
                    packageName = game.packageName,
                    contentDescription = "${game.displayName} 아이콘",
                    modifier = Modifier.size(40.dp)
                )
                Text(
                    text = game.displayName,
                    style = MaterialTheme.typography.titleSmall,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f)
                )
            }
            Text(
                text = formatDurationHhMmSs(game.remainingSeconds),
                style = MaterialTheme.typography.titleLarge
            )
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Schedule,
                    contentDescription = null,
                    modifier = Modifier.size(14.dp),
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "리셋 ${formatResetTimeKst(game.resetMinutesKst)} KST",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.AccessTime,
                    contentDescription = null,
                    modifier = Modifier.size(14.dp),
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "오늘 ${formatPlayTime(game.playMillisToday)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            if (game.cleared) {
                Surface(
                    color = SuccessContainer,
                    shape = MaterialTheme.shapes.small
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 8.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = "숙제 완료",
                            style = MaterialTheme.typography.labelLarge,
                            color = OnSuccessContainer
                        )
                    }
                }
            } else {
                Text(
                    text = "탭해서 완료 체크",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}

private fun formatResetTimeKst(resetMinutesKst: Int): String {
    val hour = (resetMinutesKst / 60).toString().padStart(2, '0')
    val minute = (resetMinutesKst % 60).toString().padStart(2, '0')
    return "$hour:$minute"
}
