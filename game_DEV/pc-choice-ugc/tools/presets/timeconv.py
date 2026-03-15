"""Time conversion helpers for preset generation."""

from __future__ import annotations

import re

TIME_RE = re.compile(r"^(\d{1,2}):(\d{2})(?::(\d{2}))?$")


def parse_time_parts(value: str) -> tuple[int, int, int]:
    match = TIME_RE.match(value.strip())
    if not match:
        raise ValueError(f"Invalid time format: {value!r}")
    hour = int(match.group(1))
    minute = int(match.group(2))
    second = int(match.group(3) or "0")
    if hour > 23 or minute > 59 or second > 59:
        raise ValueError(f"Invalid time range: {value!r}")
    return hour, minute, second


def hhmm_to_minutes(value: str) -> int:
    hour, minute, _ = parse_time_parts(value)
    return hour * 60 + minute


def minutes_to_hhmm(total_minutes: int) -> str:
    normalized = total_minutes % (24 * 60)
    hour, minute = divmod(normalized, 60)
    return f"{hour:02d}:{minute:02d}"


def normalize_utc_hhmm(value: str) -> str:
    hour, minute, _ = parse_time_parts(value)
    return f"{hour:02d}:{minute:02d}"


def utc_to_kst_minutes(utc_hhmm_or_hhmmss: str) -> int:
    return (hhmm_to_minutes(utc_hhmm_or_hhmmss) + 9 * 60) % (24 * 60)


def utc_to_kst_hhmm(utc_hhmm_or_hhmmss: str) -> str:
    return minutes_to_hhmm(utc_to_kst_minutes(utc_hhmm_or_hhmmss))


def kst_to_utc_hhmm(kst_hhmm_or_hhmmss: str) -> str:
    return minutes_to_hhmm(hhmm_to_minutes(kst_hhmm_or_hhmmss) - 9 * 60)
