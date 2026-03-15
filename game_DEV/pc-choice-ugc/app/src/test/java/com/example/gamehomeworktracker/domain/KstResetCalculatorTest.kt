package com.example.gamehomeworktracker.domain

import com.example.gamehomeworktracker.core.time.KstResetCalculator
import org.junit.Assert.assertEquals
import org.junit.Test
import java.time.Instant
import java.time.ZoneId

class KstResetCalculatorTest {
    private val zone = ZoneId.of("Asia/Seoul")

    @Test
    fun cycleStart_beforeReset_usesYesterday() {
        val now = Instant.parse("2026-02-18T17:00:00Z") // 2026-02-19 02:00 KST
        val start = KstResetCalculator.cycleStartKst(now, 5 * 60)
        assertEquals("2026-02-17T20:00:00Z", start.toString()) // 2026-02-18 05:00 KST
    }

    @Test
    fun cycleStart_afterReset_usesToday() {
        val now = Instant.parse("2026-02-19T01:00:00Z") // 10:00 KST
        val start = KstResetCalculator.cycleStartKst(now, 5 * 60)
        assertEquals("2026-02-18T20:00:00Z", start.toString())
    }

    @Test
    fun nextReset_isOneDayAfterCycleStart() {
        val now = Instant.parse("2026-02-19T01:00:00Z")
        val next = KstResetCalculator.nextResetKst(now, 5 * 60)
        assertEquals("2026-02-19T20:00:00Z", next.toString())
    }

    @Test
    fun cycleKey_containsKstDateAndResetMinutes() {
        val cycleStart = Instant.parse("2026-02-18T20:00:00Z")
        val key = KstResetCalculator.cycleKeyKst(cycleStart, 300)
        assertEquals("20260219-300", key)
    }

    @Test
    fun startOfToday_isMidnightKst() {
        val now = Instant.parse("2026-02-19T03:21:00Z")
        val start = KstResetCalculator.startOfTodayKst(now)
        val local = start.atZone(zone)
        assertEquals(0, local.hour)
        assertEquals(0, local.minute)
    }
}
