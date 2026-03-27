import { hashSeed, makeRng } from '../tarot/random';

export type DailyKind = 'western' | 'chinese';
export type DailySelection = { kind: DailyKind; key: string } | null;

export type WesternZodiacKey =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces';

export const WESTERN_ZODIAC_LABELS: Record<WesternZodiacKey, string> = {
  aries: '양자리',
  taurus: '황소자리',
  gemini: '쌍둥이자리',
  cancer: '게자리',
  leo: '사자자리',
  virgo: '처녀자리',
  libra: '천칭자리',
  scorpio: '전갈자리',
  sagittarius: '사수자리',
  capricorn: '염소자리',
  aquarius: '물병자리',
  pisces: '물고기자리',
};

export const CHINESE_ZODIAC_ORDER = [
  'rat',
  'ox',
  'tiger',
  'rabbit',
  'dragon',
  'snake',
  'horse',
  'goat',
  'monkey',
  'rooster',
  'dog',
  'pig',
] as const;

export type ChineseZodiacKey = (typeof CHINESE_ZODIAC_ORDER)[number];

export const CHINESE_ZODIAC_LABELS: Record<ChineseZodiacKey, string> = {
  rat: '쥐띠',
  ox: '소띠',
  tiger: '호랑이띠',
  rabbit: '토끼띠',
  dragon: '용띠',
  snake: '뱀띠',
  horse: '말띠',
  goat: '양띠',
  monkey: '원숭이띠',
  rooster: '닭띠',
  dog: '개띠',
  pig: '돼지띠',
};

export function kstDateKey(now = new Date()): string {
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(kst.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function yearsForChineseZodiac(key: ChineseZodiacKey): number[] {
  const idx = CHINESE_ZODIAC_ORDER.indexOf(key);
  const base = 1972 + Math.max(0, idx);
  return [base, base + 12, base + 24, base + 36];
}

const OVERALL = [
  '오늘은 해야 할 일을 작게 쪼개서 순서대로 진행하면 흐름이 빠르게 붙습니다.',
  '결정을 급하게 내리기보다 확인 가능한 기준을 먼저 세우면 실수가 크게 줄어듭니다.',
  '한 번에 많이 바꾸기보다 반복 가능한 루틴 1개를 고정하면 체감 성과가 좋습니다.',
  '관계와 일정이 동시에 움직이기 쉬운 날이라, 우선순위를 분명히 하면 마음이 편해집니다.',
  '지금은 확장보다 정리의 효율이 높은 날입니다. 작은 완료를 빠르게 쌓아보세요.',
] as const;

const MONEY = [
  '지출은 즉흥 구매보다 고정비 점검이 더 큰 효과를 냅니다. 자동결제 항목부터 확인하세요.',
  '큰 수익보다 작은 누수를 막는 흐름입니다. 결제 전 10초 체크가 유효합니다.',
  '오늘은 숫자를 적어보는 것만으로도 재정 스트레스가 줄어드는 날입니다.',
  '정산·환불·미청구 항목을 확인하면 생각보다 빠른 개선 포인트가 보입니다.',
] as const;

const LOVE = [
  '관계운은 감정보다 표현 방식이 핵심입니다. 짧고 구체적으로 말할수록 오해가 줄어듭니다.',
  '상대를 설득하기보다 먼저 이해하려는 태도가 유리한 흐름입니다.',
  '답을 빨리 내기보다 대화를 한 번 더 거치면 만족도가 높아질 수 있습니다.',
  '오늘은 작은 약속을 지키는 행동이 신뢰를 크게 올려주는 날입니다.',
] as const;

const WORK = [
  '업무운은 멀티태스킹보다 단일 집중이 유리합니다. 핵심 과제 1개를 먼저 끝내세요.',
  '메모·기록·정리 같은 기본 동작이 성과를 안정적으로 만들어줍니다.',
  '보고서나 전달문은 길이보다 명확성이 중요합니다. 한 문장 요약부터 잡아보세요.',
  '오늘은 결과물을 빠르게 공유하고 피드백 받는 방식이 잘 맞습니다.',
] as const;

const ACTIONS = [
  '30분 안에 끝낼 수 있는 작업 1개를 지금 바로 시작해보세요.',
  '오늘 미룰 일 1개와 반드시 끝낼 일 1개를 분리해서 정리하세요.',
  '결정이 필요한 일은 24시간 보류 규칙을 적용해 충동을 줄이세요.',
  '지출·시간·에너지 중 하나만 기준을 정하고 끝까지 유지해보세요.',
] as const;

function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)] as T;
}

export function buildTodaySeedKey(kind: DailyKind, key: string, chineseYear?: number | null): string {
  if (kind === 'western') return `w:${key}`;
  return `c:${key}:${chineseYear ?? 1996}`;
}

export function buildTodayFortuneDetail(
  dateKey: string,
  selection: Exclude<DailySelection, null>,
  chineseYear?: number | null,
): string {
  const rng = makeRng(hashSeed(`${dateKey}:${buildTodaySeedKey(selection.kind, selection.key, chineseYear)}`));
  return [
    '[오늘의 흐름]',
    pick(rng, OVERALL),
    '',
    '[금전]',
    pick(rng, MONEY),
    '',
    '[관계]',
    pick(rng, LOVE),
    '',
    '[일/학업]',
    pick(rng, WORK),
    '',
    '[실행 2가지]',
    `- ${pick(rng, ACTIONS)}`,
    `- ${pick(rng, ACTIONS)}`,
  ].join('\n');
}

export function getDailySelectionLabel(kind: DailyKind, key: string): string {
  if (kind === 'western') {
    return WESTERN_ZODIAC_LABELS[key as WesternZodiacKey] ?? key;
  }
  return CHINESE_ZODIAC_LABELS[key as ChineseZodiacKey] ?? key;
}
