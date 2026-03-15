package com.example.gamehomeworktracker.core.format

import kotlin.math.max

fun formatPlayTime(millis: Long): String {
    val totalMinutes = max(0L, millis / 60_000L)
    return if (totalMinutes < 60) {
        "${totalMinutes}분"
    } else {
        val hours = totalMinutes / 60
        val minutes = totalMinutes % 60
        "${hours}시간 ${minutes.toString().padStart(2, '0')}분"
    }
}

fun formatDurationHhMmSs(totalSeconds: Long): String {
    val safe = max(0L, totalSeconds)
    val hours = safe / 3600
    val minutes = (safe % 3600) / 60
    val seconds = safe % 60
    return "%02d:%02d:%02d".format(hours, minutes, seconds)
}
