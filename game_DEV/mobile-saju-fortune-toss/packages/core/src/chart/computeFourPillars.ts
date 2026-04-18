import { z } from 'zod';
import { branches as branchesData } from '@saju/data';
// @ts-expect-error lunar-javascript does not publish official type definitions.
import { Solar } from 'lunar-javascript';
import * as manseryeok from 'manseryeok/dist/index.js';
import { convertLunarToSolar, convertSolarToLunar } from '../calendar/conversion';
import { formatDate, parseDate, parseTime, type ParsedTime } from '../calendar/parse';
import { DEFAULT_TIMEZONE } from '../calendar/timezone';
import { UserError } from '../errors';
import { BRANCH_TO_ELEMENT, STEM_TO_ELEMENT, STEM_TO_YINYANG } from '../ganji/constants';
import { getYearPillarBySolarYear, shiftPillar, splitPillar } from '../ganji/sexagenary';
import { getTenGod } from '../ganji/tenGods';
import type {
  BirthInput,
  Branch,
  ElementDistributionModel,
  FourPillars,
  HiddenStemDetail,
  MonthPillarRule,
  Pillar,
  Stem,
  YearPillarRule,
} from '../types';

type ManseryeokShape = {
  calculateFourPillars?: (typeof import('manseryeok/dist/index.js'))['calculateFourPillars'];
  default?: {
    calculateFourPillars?: (typeof import('manseryeok/dist/index.js'))['calculateFourPillars'];
  };
};

const manseryeokModule = manseryeok as unknown as ManseryeokShape;
const calculateFourPillarsImpl =
  manseryeokModule.calculateFourPillars ?? manseryeokModule.default?.calculateFourPillars;

function invokeCalculateFourPillars(
  input: Parameters<(typeof import('manseryeok/dist/index.js'))['calculateFourPillars']>[0],
): ReturnType<(typeof import('manseryeok/dist/index.js'))['calculateFourPillars']> {
  if (!calculateFourPillarsImpl) {
    throw new Error('calculateFourPillars export not found in manseryeok');
  }
  return calculateFourPillarsImpl(input);
}

interface YearRuleResult {
  pillar: `${Stem}${Branch}`;
  usedExactIpchun?: boolean;
  ipchunMomentISO?: string;
}

interface LunarJsSolarLike {
  getJulianDay(): number;
  getYear(): number;
  toYmdHms(): string;
}

function resolveLiChunForSolarYear(
  table: Record<string, LunarJsSolarLike | undefined>,
  solarYear: number,
): LunarJsSolarLike | undefined {
  const entries = Object.entries(table)
    .filter(
      ([key, value]) =>
        Boolean(value) && (key === '立春' || key === 'LI_CHUN' || /LI[_-]?CHUN/i.test(key)),
    )
    .map(([, value]) => value as LunarJsSolarLike);

  if (entries.length === 0) {
    return undefined;
  }

  const exactYear = entries.find((entry) => entry.getYear() === solarYear);
  if (exactYear) {
    return exactYear;
  }

  const targetJd = Solar.fromYmdHms(solarYear, 2, 4, 12, 0, 0).getJulianDay();
  return entries
    .slice()
    .sort((a, b) => {
      const aYearGap = Math.abs(a.getYear() - solarYear);
      const bYearGap = Math.abs(b.getYear() - solarYear);
      if (aYearGap !== bYearGap) {
        return aYearGap - bYearGap;
      }
      return Math.abs(a.getJulianDay() - targetJd) - Math.abs(b.getJulianDay() - targetJd);
    })[0];
}

const inputSchema = z.object({
  calendar: z.enum(['solar', 'lunar']),
  date: z.string(),
  time: z.string().optional(),
  isLeapMonth: z.boolean().optional(),
  timezone: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'unknown']).optional(),
  location: z
    .object({
      name: z.string().optional(),
      lat: z.number(),
      lon: z.number(),
    })
    .optional(),
  options: z
    .object({
      yearPillarRule: z.enum(['ipchun', 'lunarNewYear', 'custom']).optional(),
      monthPillarRule: z.enum(['solarTerms', 'lunarMonth']).optional(),
      jaSiBoundaryRule: z.enum(['23-01_sameDay', '23-01_nextDay', 'configurable']).optional(),
      jaSiBoundaryHour: z.union([z.literal(0), z.literal(23)]).optional(),
      customYearBoundary: z
        .object({
          month: z.number().int().min(1).max(12),
          day: z.number().int().min(1).max(31),
        })
        .optional(),
      includeHiddenStems: z.boolean().optional(),
      hiddenStemWeights: z.enum(['dominant_only', 'all_weighted']).optional(),
      elementDistributionModel: z
        .enum(['stems_only', 'stems_branches', 'stems_branches_hidden'])
        .optional(),
      strengthModel: z.enum(['simple', 'advanced_v1']).optional(),
      luckComputationModel: z.enum(['simple', 'advanced_v1']).optional(),
      luckStartAge: z.number().int().min(0).max(20).optional(),
      applyLocalSolarTimeCorrection: z.boolean().optional(),
    })
    .optional(),
});

function isBeforeApproxIpchun(solarDate: { year: number; month: number; day: number }): boolean {
  if (solarDate.month < 2) {
    return true;
  }
  return solarDate.month === 2 && solarDate.day < 4;
}

function isBeforeBoundary(
  solarDate: { year: number; month: number; day: number },
  boundary: { month: number; day: number },
): boolean {
  if (solarDate.month < boundary.month) {
    return true;
  }
  if (solarDate.month > boundary.month) {
    return false;
  }
  return solarDate.day < boundary.day;
}

function getIpchunBoundary(
  solarDate: { year: number; month: number; day: number },
  time?: ParsedTime,
): { before: boolean; exact: boolean; termMomentISO?: string } {
  const hour = time?.hour ?? 12;
  const minute = time?.minute ?? 0;

  try {
    const birthSolar = Solar.fromYmdHms(solarDate.year, solarDate.month, solarDate.day, hour, minute, 0);
    const table = birthSolar.getLunar().getJieQiTable() as Record<string, LunarJsSolarLike | undefined>;
    const liChun = resolveLiChunForSolarYear(table, solarDate.year);

    if (!liChun) {
      return { before: isBeforeApproxIpchun(solarDate), exact: false };
    }

    return {
      before: birthSolar.getJulianDay() < liChun.getJulianDay(),
      exact: true,
      termMomentISO: `${liChun.toYmdHms().replace(' ', 'T')}+09:00`,
    };
  } catch {
    return { before: isBeforeApproxIpchun(solarDate), exact: false };
  }
}

function getLunarMonthPillar(yearStem: Stem, lunarMonth: number): `${Stem}${Branch}` {
  const monthBranches: Branch[] = ['인', '묘', '진', '사', '오', '미', '신', '유', '술', '해', '자', '축'];

  const startStemByYearStem: Record<Stem, Stem> = {
    갑: '병',
    기: '병',
    을: '무',
    경: '무',
    병: '경',
    신: '경',
    정: '임',
    임: '임',
    무: '갑',
    계: '갑',
  };

  const stemOrder: Stem[] = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
  const startStem = startStemByYearStem[yearStem];
  const startIndex = stemOrder.indexOf(startStem);
  const stem = stemOrder[(startIndex + lunarMonth - 1 + 10) % 10] as Stem;
  const branch = monthBranches[(lunarMonth - 1 + 12) % 12] as Branch;

  return `${stem}${branch}`;
}

function getHiddenStems(branch: Branch, mode: 'dominant_only' | 'all_weighted'): HiddenStemDetail[] {
  const row = (branchesData as Array<{ branch: Branch; hiddenStems: Array<{ stem: Stem; weight: number }> }>).find(
    (item) => item.branch === branch,
  );

  if (!row) {
    return [];
  }

  const source = mode === 'dominant_only' ? row.hiddenStems.slice(0, 1) : row.hiddenStems;
  return source.map((entry) => ({
    stem: entry.stem,
    element: STEM_TO_ELEMENT[entry.stem],
    yinYang: STEM_TO_YINYANG[entry.stem],
    weight: entry.weight,
  }));
}

function buildPillar(
  pillarText: string,
  dayMaster: Stem,
  includeHiddenStems: boolean,
  hiddenMode: 'dominant_only' | 'all_weighted',
): Pillar {
  const { stem, branch } = splitPillar(pillarText);
  const hiddenStems = includeHiddenStems
    ? getHiddenStems(branch, hiddenMode).map((item) => ({
        ...item,
        tenGodToDayMaster: getTenGod(dayMaster, item.stem),
      }))
    : [];

  const base: Pillar = {
    stem,
    branch,
    stemElement: STEM_TO_ELEMENT[stem],
    stemYinYang: STEM_TO_YINYANG[stem],
    branchElementPrimary: BRANCH_TO_ELEMENT[branch],
  };

  if (hiddenStems.length > 0) {
    base.hiddenStems = hiddenStems;
  }

  return base;
}

function applyYearRule(
  yearRule: YearPillarRule,
  solarDate: { year: number; month: number; day: number },
  lunarDate: { year: number; month: number; day: number; isLeapMonth: boolean },
  time: ParsedTime | undefined,
  customBoundary?: { month: number; day: number },
): YearRuleResult {
  if (yearRule === 'custom') {
    const boundary = customBoundary ?? { month: 2, day: 4 };
    const year = isBeforeBoundary(solarDate, boundary) ? solarDate.year - 1 : solarDate.year;
    return { pillar: getYearPillarBySolarYear(year) };
  }

  if (yearRule === 'lunarNewYear') {
    return { pillar: getYearPillarBySolarYear(lunarDate.year) };
  }

  const ipchun = getIpchunBoundary(solarDate, time);
  const year = ipchun.before ? solarDate.year - 1 : solarDate.year;

  const result: YearRuleResult = {
    pillar: getYearPillarBySolarYear(year),
    usedExactIpchun: ipchun.exact,
  };

  if (ipchun.termMomentISO) {
    result.ipchunMomentISO = ipchun.termMomentISO;
  }

  return result;
}

function applyMonthRule(
  monthRule: MonthPillarRule,
  defaultMonthPillar: string,
  yearPillar: `${Stem}${Branch}`,
  lunarMonth: number,
): `${Stem}${Branch}` {
  if (monthRule === 'solarTerms') {
    return defaultMonthPillar as `${Stem}${Branch}`;
  }

  const { stem: yearStem } = splitPillar(yearPillar);
  return getLunarMonthPillar(yearStem, lunarMonth);
}

export function getHourCandidateListFromDayPillar(dayPillar: string): string[] {
  const { stem } = splitPillar(dayPillar);
  const startStemMap: Record<Stem, Stem> = {
    갑: '갑',
    기: '갑',
    을: '병',
    경: '병',
    병: '무',
    신: '무',
    정: '경',
    임: '경',
    무: '임',
    계: '임',
  };

  const stems: Stem[] = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
  const branches: Branch[] = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
  const startStem = startStemMap[stem];
  const startIndex = stems.indexOf(startStem);

  return branches.map((branch, idx) => `${stems[(startIndex + idx) % 10]}${branch}`);
}

function shouldShiftByJaSi(
  rule: '23-01_sameDay' | '23-01_nextDay' | 'configurable',
  time: ParsedTime | undefined,
  configurableBoundaryHour: 0 | 23,
): boolean {
  if (!time) {
    return false;
  }

  if (rule === '23-01_nextDay') {
    return time.hour === 23;
  }
  if (rule === '23-01_sameDay') {
    return false;
  }
  if (rule === 'configurable') {
    return configurableBoundaryHour === 23 && time.hour === 23;
  }
  return false;
}

function resolveTimezoneOffsetHours(timezone: string | undefined): number | null {
  const tz = timezone ?? DEFAULT_TIMEZONE;
  if (tz === 'Asia/Seoul') {
    return 9;
  }
  const match = /^UTC([+-]\d{1,2})(?::?(\d{2}))?$/i.exec(tz);
  if (!match) {
    return null;
  }
  const hour = Number(match[1]);
  const minute = Number(match[2] ?? '0');
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }
  return hour + Math.sign(hour || 1) * minute / 60;
}

function applyLocalSolarTimeCorrection(
  date: { year: number; month: number; day: number },
  time: ParsedTime,
  longitude: number,
  timezone: string | undefined,
): {
  correctedDate: { year: number; month: number; day: number };
  correctedTime: ParsedTime;
  deltaMinutes: number;
} | null {
  const offsetHours = resolveTimezoneOffsetHours(timezone);
  if (offsetHours === null) {
    return null;
  }

  const standardMeridian = offsetHours * 15;
  const deltaMinutes = Math.round((longitude - standardMeridian) * 4);
  const dt = new Date(Date.UTC(date.year, date.month - 1, date.day, time.hour, time.minute));
  dt.setUTCMinutes(dt.getUTCMinutes() + deltaMinutes);

  return {
    correctedDate: {
      year: dt.getUTCFullYear(),
      month: dt.getUTCMonth() + 1,
      day: dt.getUTCDate(),
    },
    correctedTime: {
      hour: dt.getUTCHours(),
      minute: dt.getUTCMinutes(),
    },
    deltaMinutes,
  };
}

export function computeFourPillars(input: BirthInput): FourPillars {
  const parsed = inputSchema.parse(input) as BirthInput;
  const requestedIncludeHidden = parsed.options?.includeHiddenStems ?? true;
  const elementDistributionModel: ElementDistributionModel =
    parsed.options?.elementDistributionModel ??
    (requestedIncludeHidden ? 'stems_branches_hidden' : 'stems_branches');

  const includeHiddenStems =
    elementDistributionModel === 'stems_branches_hidden' ? true : requestedIncludeHidden;

  const options = {
    yearPillarRule: parsed.options?.yearPillarRule ?? 'ipchun',
    monthPillarRule: parsed.options?.monthPillarRule ?? 'solarTerms',
    jaSiBoundaryRule: parsed.options?.jaSiBoundaryRule ?? '23-01_nextDay',
    jaSiBoundaryHour: parsed.options?.jaSiBoundaryHour ?? 23,
    customYearBoundary: parsed.options?.customYearBoundary,
    includeHiddenStems,
    hiddenStemWeights: parsed.options?.hiddenStemWeights ?? 'all_weighted',
    elementDistributionModel,
    strengthModel: parsed.options?.strengthModel ?? 'simple',
    luckComputationModel: parsed.options?.luckComputationModel ?? 'simple',
    applyLocalSolarTimeCorrection: parsed.options?.applyLocalSolarTimeCorrection ?? false,
  };

  const date = parseDate(parsed.date);
  const time = parseTime(parsed.time);

  let solarDate = date;
  let lunarDate: { year: number; month: number; day: number; isLeapMonth: boolean };

  if (parsed.calendar === 'lunar') {
    if (parsed.isLeapMonth === undefined) {
      throw new UserError('MISSING_LEAP_MONTH', '음력 입력 시 윤달 여부가 필요합니다.');
    }
    solarDate = convertLunarToSolar(date.year, date.month, date.day, parsed.isLeapMonth);
    lunarDate = {
      year: date.year,
      month: date.month,
      day: date.day,
      isLeapMonth: parsed.isLeapMonth,
    };
  } else {
    lunarDate = convertSolarToLunar(date.year, date.month, date.day);
  }

  let calculationSolarDate = solarDate;
  let calculationTime = time;
  let solarCorrectionDeltaMinutes: number | null = null;

  if (options.applyLocalSolarTimeCorrection) {
    if (parsed.location && time) {
      const correction = applyLocalSolarTimeCorrection(
        solarDate,
        time,
        parsed.location.lon,
        parsed.timezone,
      );
      if (correction) {
        calculationSolarDate = correction.correctedDate;
        calculationTime = correction.correctedTime;
        solarCorrectionDeltaMinutes = correction.deltaMinutes;
      }
    }
  }

  const hour = calculationTime?.hour ?? 12;
  const minute = calculationTime?.minute ?? 0;
  const engineBaseDate = parsed.calendar === 'lunar' ? calculationSolarDate : calculationSolarDate;

  const engineResult = invokeCalculateFourPillars({
    year: engineBaseDate.year,
    month: engineBaseDate.month,
    day: engineBaseDate.day,
    hour,
    minute,
    isLunar: false,
  });

  const yearRuleResult = applyYearRule(
    options.yearPillarRule,
    calculationSolarDate,
    lunarDate,
    calculationTime,
    options.customYearBoundary,
  );

  const yearPillar = yearRuleResult.pillar;
  const monthPillar = applyMonthRule(
    options.monthPillarRule,
    engineResult.monthString,
    yearPillar,
    lunarDate.month,
  );

  let dayPillar = engineResult.dayString;
  if (shouldShiftByJaSi(options.jaSiBoundaryRule, calculationTime, options.jaSiBoundaryHour)) {
    dayPillar = shiftPillar(dayPillar, 1);
  }

  const { stem: dayMaster } = splitPillar(dayPillar);

  const year = buildPillar(
    yearPillar,
    dayMaster,
    options.includeHiddenStems,
    options.hiddenStemWeights,
  );
  const month = buildPillar(
    monthPillar,
    dayMaster,
    options.includeHiddenStems,
    options.hiddenStemWeights,
  );
  const day = buildPillar(dayPillar, dayMaster, options.includeHiddenStems, options.hiddenStemWeights);

  const hourPillarText = calculationTime ? engineResult.hourString : undefined;
  const hourPillar = hourPillarText
    ? buildPillar(hourPillarText, dayMaster, options.includeHiddenStems, options.hiddenStemWeights)
    : undefined;

  const notes: string[] = [];
  if (options.yearPillarRule === 'ipchun') {
    if (yearRuleResult.usedExactIpchun) {
      notes.push('입춘 절입 시각을 절기 계산값으로 판정했습니다.');
    } else {
      notes.push('입춘 절입 시각 계산 실패로 2월 4일 근사값을 사용했습니다.');
    }
  }
  if (options.yearPillarRule === 'custom') {
    const boundary = options.customYearBoundary ?? { month: 2, day: 4 };
    notes.push(`사용자 정의 연주 경계(${boundary.month}월 ${boundary.day}일)를 적용했습니다.`);
  }
  if (options.jaSiBoundaryRule === '23-01_nextDay') {
    notes.push('자시 경계 옵션에 따라 23:00~23:59 출생은 일주를 다음날 기준으로 보정합니다.');
  }
  if (options.jaSiBoundaryRule === 'configurable') {
    notes.push(`자시 configurable 경계 시각: ${String(options.jaSiBoundaryHour).padStart(2, '0')}:00`);
  }
  if (!calculationTime) {
    notes.push('출생 시간이 없어 시주는 비워두고 후보 12개를 제공합니다.');
  }
  if (options.applyLocalSolarTimeCorrection) {
    if (!parsed.location) {
      notes.push('태양시 보정 옵션이 켜져 있지만 출생지 경도가 없어 보정을 생략했습니다.');
    } else if (!time) {
      notes.push('태양시 보정 옵션이 켜져 있지만 출생 시간이 없어 보정을 생략했습니다.');
    } else if (solarCorrectionDeltaMinutes === null) {
      notes.push('태양시 보정 옵션이 켜져 있지만 timezone 형식이 지원되지 않아 보정을 생략했습니다.');
    } else {
      notes.push(`출생지 경도 기반 태양시 보정(${solarCorrectionDeltaMinutes >= 0 ? '+' : ''}${solarCorrectionDeltaMinutes}분)을 적용했습니다.`);
    }
  }
  if (options.monthPillarRule === 'lunarMonth') {
    notes.push('월주를 음력 월 기준으로 재산출했습니다.');
  }
  if (options.luckComputationModel === 'advanced_v1') {
    notes.push('대운 시작 나이는 출생 시각과 절기(절) 간격을 3일=1년으로 환산한 advanced_v1을 사용합니다.');
  }
  if (elementDistributionModel === 'stems_only') {
    notes.push('오행 분포 집계는 천간만 포함합니다.');
  } else if (elementDistributionModel === 'stems_branches') {
    notes.push('오행 분포 집계는 천간+지지(주오행)를 포함합니다.');
  } else {
    notes.push('오행 분포 집계는 천간+지지+지장간(가중)을 포함합니다.');
  }

  const pillarAmbiguity =
    options.yearPillarRule !== 'ipchun' ||
    options.monthPillarRule !== 'solarTerms' ||
    options.jaSiBoundaryRule !== '23-01_nextDay';

  const baseResult: FourPillars = {
    year,
    month,
    day,
    meta: {
      input: {
        ...parsed,
        timezone: parsed.timezone ?? DEFAULT_TIMEZONE,
        options: {
          ...parsed.options,
          yearPillarRule: options.yearPillarRule,
          monthPillarRule: options.monthPillarRule,
          jaSiBoundaryRule: options.jaSiBoundaryRule,
          jaSiBoundaryHour: options.jaSiBoundaryHour,
          ...(options.customYearBoundary ? { customYearBoundary: options.customYearBoundary } : {}),
          includeHiddenStems: options.includeHiddenStems,
          hiddenStemWeights: options.hiddenStemWeights,
          elementDistributionModel: options.elementDistributionModel,
          strengthModel: options.strengthModel,
          luckComputationModel: options.luckComputationModel,
          applyLocalSolarTimeCorrection: options.applyLocalSolarTimeCorrection,
        },
      },
      computedAt: new Date().toISOString(),
      calendarConversion: {
        solar: formatDate(solarDate),
        lunar: {
          y: lunarDate.year,
          m: lunarDate.month,
          d: lunarDate.day,
          isLeap: lunarDate.isLeapMonth,
        },
      },
      ...(yearRuleResult.ipchunMomentISO
        ? {
            solarTerms: {
              currentTerm: '입춘',
              termMomentISO: yearRuleResult.ipchunMomentISO,
            },
          }
        : {}),
      notes,
      confidence: {
        calendarConversion: 'high',
        hourPillar: calculationTime ? 'high' : 'low',
        pillarRuleAmbiguity: pillarAmbiguity ? 'present' : 'none',
      },
      ruleVersion: {
        yearPillarRule: options.yearPillarRule,
        monthPillarRule: options.monthPillarRule,
        jaSiBoundaryRule: options.jaSiBoundaryRule,
        elementDistributionModel: options.elementDistributionModel,
        tenGods: 'v1',
        hiddenStems: 'v1',
        strengthModel: options.strengthModel,
        luckComputationModel: options.luckComputationModel,
        applyLocalSolarTimeCorrection: options.applyLocalSolarTimeCorrection,
      },
    },
  };

  if (hourPillar) {
    baseResult.hour = hourPillar;
  }

  return baseResult;
}

export function getHourPillarCandidates(input: BirthInput): string[] {
  const parsed = inputSchema.parse(input) as BirthInput;
  const date = parseDate(parsed.date);
  const solarDate = (() => {
    if (parsed.calendar !== 'lunar') {
      return date;
    }
    if (parsed.isLeapMonth === undefined) {
      throw new UserError('MISSING_LEAP_MONTH', '음력 입력 시 윤달 여부가 필요합니다.');
    }
    return convertLunarToSolar(date.year, date.month, date.day, parsed.isLeapMonth);
  })();

  const day = invokeCalculateFourPillars({
    year: solarDate.year,
    month: solarDate.month,
    day: solarDate.day,
    hour: 12,
    minute: 0,
    isLunar: false,
  }).dayString;

  return getHourCandidateListFromDayPillar(day);
}

