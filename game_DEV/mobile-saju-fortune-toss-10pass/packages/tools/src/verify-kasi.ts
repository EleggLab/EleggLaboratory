import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { convertSolarToLunar } from '@saju/core';
import { Solar } from 'lunar-javascript';
import { solarToLunar as manseryeokSolarToLunar } from 'manseryeok';

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

interface ApiItem {
  lunYear: string;
  lunMonth: string;
  lunDay: string;
  lunLeapmonth: string;
}

interface ApiResponse {
  response?: {
    body?: {
      items?: {
        item?: ApiItem[] | ApiItem;
      };
    };
  };
}

interface SolarTermItem {
  dateName?: string;
  locdate?: string;
}

interface SolarTermResponse {
  response?: {
    body?: {
      items?: {
        item?: SolarTermItem[] | SolarTermItem;
      };
    };
  };
}

function parseYmd(date: string): { year: number; month: number; day: number } {
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) {
    throw new Error(`Invalid date format: ${date}`);
  }
  return { year, month, day };
}

function normalizeLunar(item: ApiItem): LunarLike {
  return {
    year: Number(item.lunYear),
    month: Number(item.lunMonth),
    day: Number(item.lunDay),
    isLeapMonth: item.lunLeapmonth === '윤',
  };
}

function toText(value: LunarLike): string {
  return `${value.year}-${value.month}-${value.day} leap=${value.isLeapMonth ? '윤' : '평'}`;
}

function isSame(a: LunarLike, b: LunarLike): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day && a.isLeapMonth === b.isLeapMonth;
}

async function fetchLunarFromDataGo(serviceKey: string, date: string): Promise<LunarLike | null> {
  const { year, month, day } = parseYmd(date);
  const url = new URL('https://apis.data.go.kr/B090041/openapi/service/LrsrCldInfoService/getLunCalInfo');
  url.searchParams.set('solYear', String(year));
  url.searchParams.set('solMonth', String(month).padStart(2, '0'));
  url.searchParams.set('solDay', String(day).padStart(2, '0'));
  url.searchParams.set('ServiceKey', serviceKey);
  url.searchParams.set('_type', 'json');

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const json = (await response.json()) as ApiResponse;
  const item = json.response?.body?.items?.item;
  if (!item) {
    return null;
  }
  const row = Array.isArray(item) ? item[0] : item;
  return row ? normalizeLunar(row) : null;
}

async function fetchSolarTermFromDataGo(serviceKey: string, date: string): Promise<SolarTermItem | null> {
  const { year, month, day } = parseYmd(date);
  const url = new URL('https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/get24DivisionsInfo');
  url.searchParams.set('solYear', String(year));
  url.searchParams.set('solMonth', String(month).padStart(2, '0'));
  url.searchParams.set('solDay', String(day).padStart(2, '0'));
  url.searchParams.set('ServiceKey', serviceKey);
  url.searchParams.set('_type', 'json');

  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }

  const json = (await response.json()) as SolarTermResponse;
  const item = json.response?.body?.items?.item;
  if (!item) {
    return null;
  }
  return Array.isArray(item) ? (item[0] ?? null) : item;
}

function toLunarFromLunarJs(year: number, month: number, day: number): LunarLike {
  const lunar = Solar.fromYmd(year, month, day).getLunar();
  const monthValue = lunar.getMonth();
  return {
    year: lunar.getYear(),
    month: Math.abs(monthValue),
    day: lunar.getDay(),
    isLeapMonth: monthValue < 0,
  };
}

async function main(): Promise<void> {
  const serviceKey = process.env.DATA_GO_KASI_SERVICE_KEY;
  const limitRaw = process.env.VERIFY_LIMIT;
  const limit = Number.isFinite(Number(limitRaw)) ? Math.max(1, Number(limitRaw)) : 10;

  const vectorsPath = join(process.cwd(), '..', 'core', 'test', 'vectors', 'vectors.v1.json');
  const vectors = JSON.parse(readFileSync(vectorsPath, 'utf8')) as VectorRow[];
  const solarVectors = vectors.filter((vector) => vector.input.calendar === 'solar').slice(0, limit);

  let coreVsManseryeokSame = 0;
  let coreVsLunarJsSame = 0;
  let remoteChecked = 0;
  let remoteMatch = 0;

  console.log(`verify:kasi start (vectors=${solarVectors.length}, withDataGo=${serviceKey ? 'yes' : 'no'})`);

  for (const row of solarVectors) {
    const { year, month, day } = parseYmd(row.input.date);

    const core = convertSolarToLunar(year, month, day);
    const manseryeok = manseryeokSolarToLunar(year, month, day);
    const lunarJs = toLunarFromLunarJs(year, month, day);

    if (isSame(core, manseryeok)) {
      coreVsManseryeokSame += 1;
    }
    if (isSame(core, lunarJs)) {
      coreVsLunarJsSame += 1;
    }

    const localSummary =
      `${row.id}: core=${toText(core)} | manseryeok=${toText(manseryeok)} | lunar-js=${toText(lunarJs)}`;

    if (!serviceKey) {
      console.log(localSummary);
      continue;
    }

    const remote = await fetchLunarFromDataGo(serviceKey, row.input.date);
    if (!remote) {
      console.log(`${localSummary} | data.go: no-item`);
      continue;
    }

    remoteChecked += 1;
    const isRemoteMatch = isSame(core, remote);
    if (isRemoteMatch) {
      remoteMatch += 1;
    }

    const solarTerm = await fetchSolarTermFromDataGo(serviceKey, row.input.date);
    const termText = solarTerm?.dateName ? ` | solarTerm=${solarTerm.dateName} (${solarTerm.locdate ?? 'n/a'})` : '';

    console.log(
      `${localSummary} | data.go=${toText(remote)} | coreVsDataGo=${isRemoteMatch ? 'MATCH' : 'DIFF'}${termText}`,
    );
  }

  console.log('--- summary ---');
  console.log(`core vs manseryeok: ${coreVsManseryeokSame}/${solarVectors.length}`);
  console.log(`core vs lunar-javascript: ${coreVsLunarJsSame}/${solarVectors.length}`);
  if (serviceKey) {
    console.log(`core vs data.go.kr: ${remoteMatch}/${remoteChecked}`);
  } else {
    console.log('core vs data.go.kr: skipped (DATA_GO_KASI_SERVICE_KEY missing)');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
