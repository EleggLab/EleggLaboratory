package com.example.gamehomeworktracker.core.time

import java.time.Duration
import java.time.Instant
import java.time.LocalTime
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter

object KstResetCalculator {
    private const val MINUTES_PER_DAY = 24 * 60
    val zoneId: ZoneId = ZoneId.of("Asia/Seoul")

    fun cycleStartKst(nowInstant: Instant, resetMinutesKst: Int): Instant {
        require(resetMinutesKst in 0 until MINUTES_PER_DAY) { "resetMinutesKst must be in 0..1439" }

        val nowKst = nowInstant.atZone(zoneId)
        val resetTime = LocalTime.of(resetMinutesKst / 60, resetMinutesKst % 60)
        val todayReset = ZonedDateTime.of(nowKst.toLocalDate(), resetTime, zoneId)

        val cycleDate = if (nowKst.isBefore(todayReset)) nowKst.toLocalDate().minusDays(1) else nowKst.toLocalDate()
        return ZonedDateTime.of(cycleDate, resetTime, zoneId).toInstant()
    }

    fun nextResetKst(nowInstant: Instant, resetMinutesKst: Int): Instant {
        return cycleStartKst(nowInstant, resetMinutesKst).plus(Duration.ofDays(1))
    }

    fun cycleKeyKst(cycleStartInstant: Instant, resetMinutesKst: Int): String {
        val datePart = cycleStartInstant.atZone(zoneId).toLocalDate().format(DateTimeFormatter.BASIC_ISO_DATE)
        return "$datePart-$resetMinutesKst"
    }

    fun startOfTodayKst(nowInstant: Instant): Instant {
        return nowInstant.atZone(zoneId).toLocalDate().atStartOfDay(zoneId).toInstant()
    }

    fun remainingUntilNextReset(nowInstant: Instant, resetMinutesKst: Int): Duration {
        val next = nextResetKst(nowInstant, resetMinutesKst)
        return Duration.between(nowInstant, next)
    }
}
