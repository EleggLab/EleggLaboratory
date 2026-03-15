import { STEM_TO_ELEMENT } from '../ganji/constants';
import { getYearPillarBySolarYear, splitPillar } from '../ganji/sexagenary';
import { getTenGod } from '../ganji/tenGods';
import type { AnnualLuckCycle, FourPillars } from '../types';

function getBirthSolarYear(fourPillars: FourPillars): number {
  const solar = fourPillars.meta.calendarConversion?.solar ?? fourPillars.meta.input.date;
  return Number(solar.slice(0, 4));
}

export function computeSaeunForYear(
  fourPillars: FourPillars,
  solarYear: number,
): AnnualLuckCycle {
  const birthSolarYear = getBirthSolarYear(fourPillars);
  const pillarText = getYearPillarBySolarYear(solarYear);
  const { stem, branch } = splitPillar(pillarText);
  const tenGod = getTenGod(fourPillars.day.stem, stem);

  return {
    solarYear,
    age: solarYear - birthSolarYear,
    pillar: { stem, branch },
    tenGodToDayMaster: tenGod,
    element: STEM_TO_ELEMENT[stem],
    tags: [`${stem}${branch} 연운`, `${tenGod} 작동`],
  };
}

export function computeSaeunCycles(
  fourPillars: FourPillars,
  options?: { startYear?: number; count?: number },
): AnnualLuckCycle[] {
  const birthSolarYear = getBirthSolarYear(fourPillars);
  const startAge = fourPillars.meta.input.options?.luckStartAge ?? 7;
  const startYear = options?.startYear ?? birthSolarYear + startAge;
  const count = options?.count ?? 10;

  const cycles: AnnualLuckCycle[] = [];

  for (let i = 0; i < count; i += 1) {
    cycles.push(computeSaeunForYear(fourPillars, startYear + i));
  }

  return cycles;
}
