import type { BirthInput, FourPillars, MonthlyLuckCycle } from '../types';
import { STEM_TO_ELEMENT } from '../ganji/constants';
import { getTenGod } from '../ganji/tenGods';
import { computeFourPillars } from '../chart/computeFourPillars';

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * Compute a "month luck" pillar by anchoring the month to a representative solar date-time.
 *
 * Default anchor: 15th day 12:00 (local timezone).
 * This is a pragmatic MVP approximation that avoids requiring a full solar-term moment table.
 */
export function computeMonthLuckForYearMonth(
  natal: FourPillars,
  solarYear: number,
  solarMonth: number,
  options?: { anchorDay?: number; anchorTime?: string },
): MonthlyLuckCycle {
  const timezone = natal.meta.input.timezone ?? 'Asia/Seoul';
  const anchorDay = options?.anchorDay ?? 15;
  const anchorTime = options?.anchorTime ?? '12:00';
  const anchorDate = `${solarYear}-${pad2(solarMonth)}-${pad2(anchorDay)}`;

  const natalInput = natal.meta.input;
  const targetInput: BirthInput = {
    calendar: 'solar',
    date: anchorDate,
    time: anchorTime,
    timezone,
    ...(natalInput.gender !== undefined ? { gender: natalInput.gender } : {}),
    ...(natalInput.options !== undefined ? { options: natalInput.options } : {}),
  };

  const target = computeFourPillars(targetInput);
  const monthStem = target.month.stem;
  const monthBranch = target.month.branch;
  const tenGod = getTenGod(natal.day.stem, monthStem);

  return {
    solarYear,
    solarMonth,
    anchor: {
      date: anchorDate,
      time: anchorTime,
      timezone,
    },
    pillar: { stem: monthStem, branch: monthBranch },
    tenGodToDayMaster: tenGod,
    element: STEM_TO_ELEMENT[monthStem],
    tags: [`${monthStem}${monthBranch} 월운`, `${tenGod} 작동`],
    notes: ['월운 기준: 양력 매월 15일 12:00 (MVP 근사)'],
  };
}

