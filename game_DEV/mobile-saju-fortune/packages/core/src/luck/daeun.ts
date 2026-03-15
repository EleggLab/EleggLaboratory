import { Solar } from 'lunar-javascript';
import type { FourPillars, Gender, LuckComputationModel, LuckCycle } from '../types';
import { STEM_TO_ELEMENT, STEM_TO_YINYANG } from '../ganji/constants';
import { getSexagenaryByIndex, getSexagenaryIndex, splitPillar } from '../ganji/sexagenary';
import { getTenGod } from '../ganji/tenGods';

function getDirection(gender: Gender | undefined, yearStem: string): 'forward' | 'backward' {
  const isYangYear = STEM_TO_YINYANG[yearStem as keyof typeof STEM_TO_YINYANG] === '양';

  if (gender === 'male') {
    return isYangYear ? 'forward' : 'backward';
  }
  if (gender === 'female') {
    return isYangYear ? 'backward' : 'forward';
  }
  return 'forward';
}

function parseBirthSolarDateTime(fourPillars: FourPillars): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} {
  const solar = fourPillars.meta.calendarConversion?.solar ?? fourPillars.meta.input.date;
  const year = Number(solar.slice(0, 4));
  const month = Number(solar.slice(5, 7));
  const day = Number(solar.slice(8, 10));

  const time = fourPillars.meta.input.time;
  if (!time) {
    return { year, month, day, hour: 12, minute: 0 };
  }

  const hour = Number(time.slice(0, 2));
  const minute = Number(time.slice(3, 5));
  return { year, month, day, hour, minute };
}

function computeAdvancedStartAge(fourPillars: FourPillars, direction: 'forward' | 'backward'): number {
  const { year, month, day, hour, minute } = parseBirthSolarDateTime(fourPillars);
  const birthSolar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  const lunar = birthSolar.getLunar();

  const boundary = direction === 'forward' ? lunar.getNextJie().getSolar() : lunar.getPrevJie().getSolar();
  const diffDays = Math.abs(boundary.getJulianDay() - birthSolar.getJulianDay());

  // 전통적으로 3일을 1년으로 환산하는 방식을 사용한다.
  const age = diffDays / 3;
  return Number(Math.max(0.1, age).toFixed(1));
}

function resolveStartAge(
  fourPillars: FourPillars,
  direction: 'forward' | 'backward',
  model: LuckComputationModel,
  override?: number,
): number {
  if (typeof override === 'number') {
    return override;
  }

  if (model === 'advanced_v1') {
    return computeAdvancedStartAge(fourPillars, direction);
  }

  return fourPillars.meta.input.options?.luckStartAge ?? 7;
}

export function computeDaeunCycles(
  fourPillars: FourPillars,
  options?: { startAge?: number; count?: number },
): { direction: 'forward' | 'backward'; startAge: number; computedBy: LuckComputationModel; cycles: LuckCycle[] } {
  const count = options?.count ?? 8;

  const monthPillarText = `${fourPillars.month.stem}${fourPillars.month.branch}`;
  const monthIndex = getSexagenaryIndex(monthPillarText);
  const dayMaster = fourPillars.day.stem;
  const direction = getDirection(fourPillars.meta.input.gender, fourPillars.year.stem);

  const model = fourPillars.meta.input.options?.luckComputationModel ?? 'simple';
  const startAge = resolveStartAge(fourPillars, direction, model, options?.startAge);

  const cycles: LuckCycle[] = [];

  for (let i = 0; i < count; i += 1) {
    const delta = direction === 'forward' ? i + 1 : -(i + 1);
    const pillarText = getSexagenaryByIndex(monthIndex + delta);
    const { stem, branch } = splitPillar(pillarText);

    const cycleStartAge = Number((startAge + i * 10).toFixed(1));
    const cycleEndAge = Number((cycleStartAge + 9.9).toFixed(1));

    cycles.push({
      startAge: cycleStartAge,
      endAge: cycleEndAge,
      pillar: { stem, branch },
      tenGodToDayMaster: getTenGod(dayMaster, stem),
      element: STEM_TO_ELEMENT[stem],
      tags: [`${getTenGod(dayMaster, stem)} 활성`],
    });
  }

  return { direction, startAge, computedBy: model, cycles };
}
