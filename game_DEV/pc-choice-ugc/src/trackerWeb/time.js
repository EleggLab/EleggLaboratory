const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function pad2(value) {
  return String(value).padStart(2, '0');
}

function getShiftedKstDate(instantMs) {
  return new Date(instantMs + KST_OFFSET_MS);
}

export function kstDateParts(instantMs) {
  const shifted = getShiftedKstDate(instantMs);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    second: shifted.getUTCSeconds(),
  };
}

export function kstDayKey(instantMs) {
  const p = kstDateParts(instantMs);
  return `${p.year}${pad2(p.month + 1)}${pad2(p.day)}`;
}

export function cycleStartKstMs(instantMs, resetMinutesKst) {
  const p = kstDateParts(instantMs);
  const todayMidnightUtcMs = Date.UTC(p.year, p.month, p.day) - KST_OFFSET_MS;
  let start = todayMidnightUtcMs + resetMinutesKst * 60_000;
  if (instantMs < start) {
    start -= DAY_MS;
  }
  return start;
}

export function nextResetKstMs(instantMs, resetMinutesKst) {
  return cycleStartKstMs(instantMs, resetMinutesKst) + DAY_MS;
}

export function cycleKeyKst(instantMs, resetMinutesKst) {
  const start = cycleStartKstMs(instantMs, resetMinutesKst);
  return `${kstDayKey(start)}-${resetMinutesKst}`;
}

export function minutesToHhmm(totalMinutes) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hh = Math.floor(normalized / 60);
  const mm = normalized % 60;
  return `${pad2(hh)}:${pad2(mm)}`;
}

export function hhmmToMinutes(value) {
  const match = /^([0-1]?\d|2[0-3]):([0-5]\d)$/.exec(String(value || '').trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function remainingSecondsToNextReset(instantMs, resetMinutesKst) {
  const diffMs = nextResetKstMs(instantMs, resetMinutesKst) - instantMs;
  return Math.max(0, Math.floor(diffMs / 1000));
}

export function formatHhMmSs(totalSeconds) {
  const safe = Math.max(0, Number(totalSeconds) || 0);
  const hh = Math.floor(safe / 3600);
  const mm = Math.floor((safe % 3600) / 60);
  const ss = safe % 60;
  return `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`;
}

export function formatPlayTime(millis) {
  const minutes = Math.floor(Math.max(0, millis) / 60_000);
  if (minutes < 60) {
    return `${minutes}분`;
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}시간 ${pad2(m)}분`;
}

export function formatNowKst(instantMs) {
  const p = kstDateParts(instantMs);
  return `${p.year}-${pad2(p.month + 1)}-${pad2(p.day)} ${pad2(p.hour)}:${pad2(p.minute)}:${pad2(p.second)} KST`;
}
