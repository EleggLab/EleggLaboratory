import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import KoreanLunarCalendar from 'korean-lunar-calendar';
import { Solar } from 'lunar-javascript';
import { calculateFourPillars, solarToLunar } from 'manseryeok';

interface VectorInput {
  calendar: 'solar' | 'lunar';
  date: string;
  time?: string;
  timezone?: string;
}

interface VectorRow {
  id: string;
  input: VectorInput;
}

interface LunarLike {
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
}

const HANJA_STEMS = '\u7532\u4e59\u4e19\u4e01\u620a\u5df1\u5e9a\u8f9b\u58ec\u7678';
const HANJA_BRANCHES = '\u5b50\u4e11\u5bc5\u536f\u8fb0\u5df3\u5348\u672a\u7533\u9149\u620c\u4ea5';
const KO_STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const KO_BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

function parseYmd(date: string): { year: number; month: number; day: number } {
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) {
    throw new Error(`Invalid date format: ${date}`);
  }
  return { year, month, day };
}

function parseHm(time: string | undefined): { hour: number; minute: number } {
  if (!time) {
    return { hour: 12, minute: 0 };
  }
  return {
    hour: Number(time.slice(0, 2)),
    minute: Number(time.slice(3, 5)),
  };
}

function toKoGanZhi(hanjaGanZhi: string): string {
  const chars = [...hanjaGanZhi];
  const stemHanja = chars[0] ?? '';
  const branchHanja = chars[1] ?? '';

  const stemIndex = HANJA_STEMS.indexOf(stemHanja);
  const branchIndex = HANJA_BRANCHES.indexOf(branchHanja);

  if (stemIndex === -1 || branchIndex === -1) {
    return hanjaGanZhi;
  }

  return `${KO_STEMS[stemIndex]}${KO_BRANCHES[branchIndex]}`;
}

function toLunarFromLunarJs(year: number, month: number, day: number): LunarLike {
  const lunar = Solar.fromYmd(year, month, day).getLunar();
  const lunarMonth = lunar.getMonth();

  return {
    year: lunar.getYear(),
    month: Math.abs(lunarMonth),
    day: lunar.getDay(),
    isLeapMonth: lunarMonth < 0,
  };
}

function toLunarFromKlc(year: number, month: number, day: number): LunarLike {
  const klc = new KoreanLunarCalendar();
  klc.setSolarDate(year, month, day);
  const lunar = klc.getLunarCalendar();

  return {
    year: lunar.year,
    month: lunar.month,
    day: lunar.day,
    isLeapMonth: lunar.intercalation === true,
  };
}

function toText(value: LunarLike): string {
  return `${value.year}-${value.month}-${value.day} leap=${value.isLeapMonth ? '윤' : '평'}`;
}

function isSame(a: LunarLike, b: LunarLike): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day && a.isLeapMonth === b.isLeapMonth;
}

function comparePillars(year: number, month: number, day: number, hour: number, minute: number): {
  mYear: string;
  mMonth: string;
  mDay: string;
  mHour: string;
  lYear: string;
  lMonth: string;
  lDay: string;
  lHour: string;
} {
  const m = calculateFourPillars({
    year,
    month,
    day,
    hour,
    minute,
    isLunar: false,
  });

  const lunar = Solar.fromYmdHms(year, month, day, hour, minute, 0).getLunar();

  return {
    mYear: m.yearString,
    mMonth: m.monthString,
    mDay: m.dayString,
    mHour: m.hourString,
    lYear: toKoGanZhi(lunar.getYearInGanZhiByLiChun()),
    lMonth: toKoGanZhi(lunar.getMonthInGanZhiExact()),
    lDay: toKoGanZhi(lunar.getDayInGanZhiExact2()),
    lHour: toKoGanZhi(lunar.getTimeInGanZhi()),
  };
}

async function main(): Promise<void> {
  const limitRaw = process.env.VERIFY_LIMIT;
  const limit = Number.isFinite(Number(limitRaw)) ? Math.max(1, Number(limitRaw)) : 20;

  const vectorsPath = join(process.cwd(), '..', 'core', 'test', 'vectors', 'vectors.v1.json');
  const vectors = JSON.parse(readFileSync(vectorsPath, 'utf8')) as VectorRow[];
  const solarVectors = vectors.filter((vector) => vector.input.calendar === 'solar').slice(0, limit);

  let manseryeokVsKlc = 0;
  let manseryeokVsLunarJs = 0;
  let klcVsLunarJs = 0;

  let pillarFullMatch = 0;

  console.log(`verify:cross start (vectors=${solarVectors.length})`);

  for (const row of solarVectors) {
    const { year, month, day } = parseYmd(row.input.date);
    const { hour, minute } = parseHm(row.input.time);

    const mLunar = solarToLunar(year, month, day);
    const klcLunar = toLunarFromKlc(year, month, day);
    const ljsLunar = toLunarFromLunarJs(year, month, day);

    if (isSame(mLunar, klcLunar)) {
      manseryeokVsKlc += 1;
    }
    if (isSame(mLunar, ljsLunar)) {
      manseryeokVsLunarJs += 1;
    }
    if (isSame(klcLunar, ljsLunar)) {
      klcVsLunarJs += 1;
    }

    const pillars = comparePillars(year, month, day, hour, minute);
    const isPillarFullMatch =
      pillars.mYear === pillars.lYear &&
      pillars.mMonth === pillars.lMonth &&
      pillars.mDay === pillars.lDay &&
      pillars.mHour === pillars.lHour;

    if (isPillarFullMatch) {
      pillarFullMatch += 1;
    }

    console.log(
      `${row.id}: lunar[m=${toText(mLunar)}|k=${toText(klcLunar)}|l=${toText(ljsLunar)}] ` +
        `pillars[m=${pillars.mYear}/${pillars.mMonth}/${pillars.mDay}/${pillars.mHour}` +
        `, l=${pillars.lYear}/${pillars.lMonth}/${pillars.lDay}/${pillars.lHour}]` +
        ` fullMatch=${isPillarFullMatch ? 'Y' : 'N'}`,
    );
  }

  console.log('--- summary ---');
  console.log(`solar->lunar manseryeok == KLC: ${manseryeokVsKlc}/${solarVectors.length}`);
  console.log(`solar->lunar manseryeok == lunar-js: ${manseryeokVsLunarJs}/${solarVectors.length}`);
  console.log(`solar->lunar KLC == lunar-js: ${klcVsLunarJs}/${solarVectors.length}`);
  console.log(`four-pillars manseryeok == lunar-js(exact): ${pillarFullMatch}/${solarVectors.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
