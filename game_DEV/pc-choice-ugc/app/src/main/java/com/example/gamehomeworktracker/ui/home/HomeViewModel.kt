package com.example.gamehomeworktracker.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.gamehomeworktracker.core.time.KstResetCalculator
import com.example.gamehomeworktracker.data.repository.TrackedGameRepository
import com.example.gamehomeworktracker.data.usage.UsageStatsReader
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.time.Instant
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val trackedGameRepository: TrackedGameRepository,
    private val usageStatsReader: UsageStatsReader
) : ViewModel() {

    private val nowFlow = MutableStateFlow(Instant.now())
    private val usageByPackage = MutableStateFlow<Map<String, Long>>(emptyMap())
    private val usagePermissionGranted = MutableStateFlow(usageStatsReader.hasUsagePermission())

    private var tickerJob: Job? = null

    val uiState: StateFlow<HomeUiState> = combine(
        trackedGameRepository.trackedGames,
        nowFlow,
        usageByPackage,
        usagePermissionGranted
    ) { trackedGames, now, usageMap, hasPermission ->
        val updated = trackedGames.map { game ->
            val remainingSeconds = KstResetCalculator.remainingUntilNextReset(now, game.resetMinutesKst).seconds
            HomeGameUiModel(
                id = game.id,
                packageName = game.packageName,
                displayName = game.displayName,
                remainingSeconds = remainingSeconds,
                playMillisToday = usageMap[game.packageName] ?: 0L,
                cleared = game.cleared,
                resetMinutesKst = game.resetMinutesKst,
                presetConfidence = game.presetConfidence
            )
        }
        val completed = updated.count { it.cleared }
        val total = updated.size
        HomeUiState(
            games = updated,
            completedCount = completed,
            totalCount = total,
            progressRatio = if (total == 0) 0f else completed.toFloat() / total.toFloat(),
            usagePermissionGranted = hasPermission,
            nowInstant = now
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = HomeUiState(usagePermissionGranted = usagePermissionGranted.value)
    )

    init {
        viewModelScope.launch {
            trackedGameRepository.syncCycleStates(nowFlow.value)
            refreshUsagePermissionAndData(nowFlow.value)
        }
    }

    fun onAppForegroundChanged(isForeground: Boolean) {
        if (isForeground) {
            startTicker()
        } else {
            stopTicker()
        }
    }

    fun setCleared(gameId: String, cleared: Boolean) {
        viewModelScope.launch {
            trackedGameRepository.setCleared(gameId, cleared)
        }
    }

    fun resetAllCleared() {
        viewModelScope.launch {
            trackedGameRepository.resetAllCleared()
        }
    }

    fun refreshUsagePermissionAndData(now: Instant = Instant.now()) {
        viewModelScope.launch {
            val granted = usageStatsReader.hasUsagePermission()
            usagePermissionGranted.value = granted
            if (granted) {
                usageByPackage.value = usageStatsReader.queryTodayUsageByPackage(now)
            } else {
                usageByPackage.value = emptyMap()
            }
        }
    }

    private fun startTicker() {
        if (tickerJob?.isActive == true) return

        tickerJob = viewModelScope.launch {
            var ticks = 0
            while (true) {
                val now = Instant.now()
                nowFlow.value = now

                if (ticks % 60 == 0) {
                    trackedGameRepository.syncCycleStates(now)
                    refreshUsagePermissionAndData(now)
                }

                ticks += 1
                delay(1_000)
            }
        }
    }

    private fun stopTicker() {
        tickerJob?.cancel()
        tickerJob = null
    }

    override fun onCleared() {
        stopTicker()
        super.onCleared()
    }
}
