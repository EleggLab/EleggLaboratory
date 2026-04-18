export type DailyKind = 'western' | 'chinese';

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

export type ChineseZodiacKey =
  | 'rat'
  | 'ox'
  | 'tiger'
  | 'rabbit'
  | 'dragon'
  | 'snake'
  | 'horse'
  | 'goat'
  | 'monkey'
  | 'rooster'
  | 'dog'
  | 'pig';

export interface DailyOption<TKey extends string> {
  key: TKey;
  name: string;
}

export interface DailySection {
  title: string;
  lines: string[];
}

interface DailyProfile {
  label: string;
  mood: string;
  strength: string;
  caution: string;
  money: string;
  relation: string;
  study: string;
  tip: string;
}

type ParsedSeed = {
  kind: DailyKind | 'fallback';
  key: string;
  year?: number;
};

const CHINESE_ZODIAC_ORDER: ChineseZodiacKey[] = [
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
];

export const WESTERN_ZODIAC_OPTIONS: DailyOption<WesternZodiacKey>[] = [
  { key: 'aries', name: '양자리' },
  { key: 'taurus', name: '황소자리' },
  { key: 'gemini', name: '쌍둥이자리' },
  { key: 'cancer', name: '게자리' },
  { key: 'leo', name: '사자자리' },
  { key: 'virgo', name: '처녀자리' },
  { key: 'libra', name: '천칭자리' },
  { key: 'scorpio', name: '전갈자리' },
  { key: 'sagittarius', name: '사수자리' },
  { key: 'capricorn', name: '염소자리' },
  { key: 'aquarius', name: '물병자리' },
  { key: 'pisces', name: '물고기자리' },
];

export const CHINESE_ZODIAC_OPTIONS: DailyOption<ChineseZodiacKey>[] = [
  { key: 'rat', name: '쥐띠' },
  { key: 'ox', name: '소띠' },
  { key: 'tiger', name: '호랑이띠' },
  { key: 'rabbit', name: '토끼띠' },
  { key: 'dragon', name: '용띠' },
  { key: 'snake', name: '뱀띠' },
  { key: 'horse', name: '말띠' },
  { key: 'goat', name: '양띠' },
  { key: 'monkey', name: '원숭이띠' },
  { key: 'rooster', name: '닭띠' },
  { key: 'dog', name: '개띠' },
  { key: 'pig', name: '돼지띠' },
];

const WESTERN_PROFILES: Record<WesternZodiacKey, DailyProfile> = {
  aries: {
    label: '양자리',
    mood: '속도보다 방향을 먼저 잡을수록 힘이 붙는 날',
    strength: '시작을 밀어붙이는 추진력',
    caution: '성급한 결론',
    money: '작게 정한 기준을 끝까지 지키는 것',
    relation: '짧아도 분명한 표현',
    study: '한 문제를 끝까지 미는 집중',
    tip: '처음 손댈 한 가지를 먼저 고정하기',
  },
  taurus: {
    label: '황소자리',
    mood: '천천히 굳힌 기준이 결과를 안정시키는 날',
    strength: '꾸준히 버티는 지속력',
    caution: '고집으로 굳어지는 판단',
    money: '실사용 기준으로 소비를 거르는 것',
    relation: '반응보다 신뢰를 쌓는 태도',
    study: '같은 리듬으로 반복하는 힘',
    tip: '늘 하던 루틴 하나를 흔들지 않기',
  },
  gemini: {
    label: '쌍둥이자리',
    mood: '정보를 넓게 보기보다 잘 엮을수록 유리한 날',
    strength: '빠르게 연결하고 정리하는 감각',
    caution: '관심이 흩어지는 흐름',
    money: '선택지를 비교해 보는 습관',
    relation: '가볍지만 정확한 대화',
    study: '짧은 몰입을 여러 번 만드는 방식',
    tip: '메모를 흩뿌리지 말고 한곳에 모으기',
  },
  cancer: {
    label: '게자리',
    mood: '감정이 흔들려도 생활 리듬을 지키면 편해지는 날',
    strength: '세심하게 챙기고 감지하는 능력',
    caution: '마음이 먼저 지치는 흐름',
    money: '생활비 패턴을 차분히 보는 것',
    relation: '상대 속도를 배려하는 온도',
    study: '편한 환경을 만드는 준비',
    tip: '버겁다면 분량보다 컨디션부터 정리하기',
  },
  leo: {
    label: '사자자리',
    mood: '시선을 끌기보다 중심을 세울 때 빛나는 날',
    strength: '분위기를 이끄는 존재감',
    caution: '과열된 자존심',
    money: '좋아 보이는 것과 필요한 것을 구분하기',
    relation: '확신을 주는 말투',
    study: '한 번 정한 목표를 크게 밀어붙이는 힘',
    tip: '체면보다 실속을 한 번 더 확인하기',
  },
  virgo: {
    label: '처녀자리',
    mood: '작은 오류를 고치는 손길이 하루를 편하게 만드는 날',
    strength: '세부를 정리하는 정확함',
    caution: '과한 자기검열',
    money: '작은 새는 비용을 메우는 일',
    relation: '세심한 확인과 응답',
    study: '오답과 빈칸을 메우는 성실함',
    tip: '완벽보다 마감 기준을 먼저 정하기',
  },
  libra: {
    label: '천칭자리',
    mood: '균형을 잡는 판단이 전체 흐름을 살리는 날',
    strength: '조율과 중재',
    caution: '결론을 미루는 습관',
    money: '비교 후 기준을 남기는 습관',
    relation: '부드럽지만 분명한 경계',
    study: '과목 간 균형을 맞추는 운영',
    tip: '좋은 선택보다 끝낼 선택을 먼저 정하기',
  },
  scorpio: {
    label: '전갈자리',
    mood: '겉보다 안쪽 흐름을 읽을수록 강해지는 날',
    strength: '집중해서 파고드는 힘',
    caution: '의심이 깊어지는 흐름',
    money: '숨은 조건을 끝까지 확인하는 것',
    relation: '겉말보다 진심을 보는 감각',
    study: '한 주제를 깊게 파는 집중',
    tip: '확신이 들기 전엔 한 번 더 검증하기',
  },
  sagittarius: {
    label: '사수자리',
    mood: '확장보다 방향을 좁힐수록 효율이 나는 날',
    strength: '넓게 보고 크게 움직이는 감각',
    caution: '너무 많은 계획',
    money: '큰그림보다 당장 필요한 예산 정리',
    relation: '솔직하지만 가벼운 표현',
    study: '큰 목차를 빠르게 잡는 능력',
    tip: '하고 싶은 것보다 해야 하는 것부터 순서 세우기',
  },
  capricorn: {
    label: '염소자리',
    mood: '묵직한 기준을 끝까지 지키면 성과가 남는 날',
    strength: '책임감과 실행력',
    caution: '몸보다 목표를 앞세우는 태도',
    money: '장기 기준으로 쓰임을 따지는 일',
    relation: '말보다 행동으로 보여주는 태도',
    study: '계획을 꾸준히 실행하는 힘',
    tip: '버티기 전에 휴식 한 칸을 먼저 넣기',
  },
  aquarius: {
    label: '물병자리',
    mood: '새로운 감각이 떠오르지만 정리가 있어야 빛나는 날',
    strength: '틀을 벗어나 보는 시선',
    caution: '생각이 너무 앞서는 흐름',
    money: '새 시도보다 기준 점검이 우선',
    relation: '거리감 있는 솔직함',
    study: '새 방식으로 접근하는 발상',
    tip: '떠오른 아이디어를 바로 구조화하기',
  },
  pisces: {
    label: '물고기자리',
    mood: '감각은 풍부하지만 경계를 세워야 편한 날',
    strength: '분위기와 결을 읽는 직감',
    caution: '기분에 휩쓸리는 흐름',
    money: '감정 소비를 줄이는 일',
    relation: '공감하되 선을 넘지 않는 태도',
    study: '몰입이 깊을 때 빠르게 끝내는 방식',
    tip: '무드가 깨지기 전에 작은 완료를 남기기',
  },
};

const CHINESE_PROFILES: Record<ChineseZodiacKey, DailyProfile> = {
  rat: {
    label: '쥐띠',
    mood: '눈치보다 계산이 빛나는 날',
    strength: '빠른 판단과 센스',
    caution: '너무 많은 경우의 수',
    money: '작게 아끼는 선택을 누적하는 것',
    relation: '상황 파악이 빠른 대화',
    study: '짧게 몰입하는 요령',
    tip: '결정이 늦어지면 기준 하나만 남기기',
  },
  ox: {
    label: '소띠',
    mood: '한 번 정한 흐름을 지킬수록 편해지는 날',
    strength: '꾸준함과 신뢰감',
    caution: '느려 보여도 고집이 되는 순간',
    money: '생활비 구조를 단단히 묶는 일',
    relation: '말보다 지속적인 태도',
    study: '밀도 높은 반복',
    tip: '속도보다 완주를 먼저 생각하기',
  },
  tiger: {
    label: '호랑이띠',
    mood: '기세는 좋지만 타이밍을 조절해야 더 빛나는 날',
    strength: '크게 움직이는 추진력',
    caution: '초반 과속',
    money: '큰 지출의 온도 조절',
    relation: '당당하지만 과하지 않은 표현',
    study: '한 번에 몰아치는 집중',
    tip: '밀기 전에 한 박자만 늦추기',
  },
  rabbit: {
    label: '토끼띠',
    mood: '부드럽게 조율할수록 결과가 예뻐지는 날',
    strength: '분위기를 다독이는 감각',
    caution: '눈치 보며 결정을 미루는 일',
    money: '작은 낭비를 눈치채는 감각',
    relation: '부드럽지만 선명한 말',
    study: '편한 리듬으로 꾸준히 가는 힘',
    tip: '상대 맞춤보다 내 기준을 먼저 세우기',
  },
  dragon: {
    label: '용띠',
    mood: '큰 그림은 좋은데 디테일을 붙일수록 강해지는 날',
    strength: '스케일 있게 보는 시선',
    caution: '과장된 자신감',
    money: '명분보다 실효를 따지는 판단',
    relation: '기세보다 신뢰를 남기는 태도',
    study: '큰 목표를 세우는 추진력',
    tip: '크게 보기 전에 작은 완료 하나 남기기',
  },
  snake: {
    label: '뱀띠',
    mood: '조용히 읽어내는 감각이 빛나는 날',
    strength: '결을 읽는 직감',
    caution: '혼자 너무 깊게 생각하는 것',
    money: '보이지 않는 조건까지 보는 눈',
    relation: '말보다 타이밍을 읽는 감각',
    study: '깊이 있는 분석',
    tip: '확신이 들수록 한 번 더 밖에서 보기',
  },
  horse: {
    label: '말띠',
    mood: '움직임이 빠르니 방향을 먼저 고정하면 좋은 날',
    strength: '순발력과 추진',
    caution: '루틴이 깨지는 속도',
    money: '즉흥 소비를 한 번 더 거르기',
    relation: '활기 있지만 놓치지 않는 배려',
    study: '짧고 강한 집중',
    tip: '에너지가 좋을 때 가장 중요한 것부터 끝내기',
  },
  goat: {
    label: '양띠',
    mood: '환경과 감정 정리가 성과보다 먼저인 날',
    strength: '섬세한 감수성',
    caution: '마음이 먼저 지치는 흐름',
    money: '감정 소비 점검',
    relation: '따뜻하지만 선을 지키는 태도',
    study: '편안한 환경에서 오래 가는 힘',
    tip: '분위기 정리가 끝나면 일도 빨라집니다',
  },
  monkey: {
    label: '원숭이띠',
    mood: '재치가 좋지만 집중 대상을 줄여야 더 강한 날',
    strength: '센스와 전환 능력',
    caution: '산만함',
    money: '이득보다 실수를 줄이는 쪽',
    relation: '재치 있는 분위기 환기',
    study: '지루함을 피하는 요령',
    tip: '여러 개를 건드리기보다 하나를 확실히 끝내기',
  },
  rooster: {
    label: '닭띠',
    mood: '정돈과 기준 세우기가 성과로 이어지는 날',
    strength: '정리와 체크',
    caution: '예민함이 날카로워지는 순간',
    money: '세부 내역 점검',
    relation: '분명한 피드백',
    study: '오답과 빈칸을 메우는 성실함',
    tip: '완벽보다 마감을 먼저 지키기',
  },
  dog: {
    label: '개띠',
    mood: '믿을 수 있는 태도가 흐름을 살리는 날',
    strength: '의리와 꾸준함',
    caution: '걱정을 오래 끌고 가는 일',
    money: '안전한 선택을 유지하는 힘',
    relation: '끝까지 책임지는 말과 행동',
    study: '기본기를 지키는 힘',
    tip: '괜한 걱정보다 이미 한 것을 확인하기',
  },
  pig: {
    label: '돼지띠',
    mood: '마음은 넉넉하지만 경계를 세워야 편한 날',
    strength: '여유와 포용',
    caution: '좋은 마음이 과해지는 것',
    money: '후한 지출을 조절하는 일',
    relation: '따뜻하지만 기준 있는 반응',
    study: '한 번 몰입하면 끝까지 가는 힘',
    tip: '배려와 손해를 구분하기',
  },
};

const FLOW_TEMPLATES = [
  (profile: DailyProfile, yearHint: string) =>
    `${yearHint}${profile.label}는 오늘 ${profile.mood.toLowerCase()}입니다. ${profile.strength}을 살리고 ${profile.caution}만 한 번 더 점검해 보세요.`,
  (profile: DailyProfile, yearHint: string) =>
    `${yearHint}${profile.label}는 오늘 ${profile.strength}이 잘 통하는 날입니다. 다만 ${profile.caution}으로 흐르지 않게 속도를 조절하는 편이 좋습니다.`,
  (profile: DailyProfile, yearHint: string) =>
    `${yearHint}오늘 ${profile.label}는 크게 밀기보다 ${profile.strength}을 단단히 쓰는 쪽이 유리합니다. ${profile.caution}만 줄여도 체감이 훨씬 좋아집니다.`,
  (profile: DailyProfile, yearHint: string) =>
    `${yearHint}${profile.label}는 오늘 감보다 기준이 더 잘 통합니다. ${profile.strength}을 앞세우고 ${profile.caution}은 한 번만 눌러 두세요.`,
];

const MONEY_TEMPLATES = [
  (profile: DailyProfile) =>
    `금전운은 큰 수익보다 ${profile.money}에서 차이가 납니다. 오늘은 새는 지출부터 먼저 줄여보세요.`,
  (profile: DailyProfile) =>
    `돈 흐름은 공격적으로 벌리는 것보다 ${profile.money}을 챙길 때 안정됩니다. 당장 줄일 수 있는 항목 한 가지가 핵심입니다.`,
  (profile: DailyProfile) =>
    `오늘 금전운은 계산보다 기준 정리가 중요합니다. ${profile.money}이 바로 체감 실속으로 이어질 수 있습니다.`,
  (profile: DailyProfile) =>
    `무리한 결정보다 ${profile.money}을 확인하는 쪽이 유리합니다. 작은 금액도 반복되면 흐름을 바꿉니다.`,
];

const RELATION_TEMPLATES = [
  (profile: DailyProfile) =>
    `인간관계운은 ${profile.relation}이 핵심입니다. 답을 서두르기보다 말의 결을 먼저 다듬어 보세요.`,
  (profile: DailyProfile) =>
    `오늘 관계 흐름은 내용보다 온도에서 갈립니다. ${profile.relation}을 의식하면 불필요한 충돌이 줄어듭니다.`,
  (profile: DailyProfile) =>
    `${profile.label}는 오늘 관계에서 밀기보다 조율이 잘 맞습니다. ${profile.relation}이 생각보다 큰 차이를 만듭니다.`,
  (profile: DailyProfile) =>
    `대화의 속도보다 ${profile.relation}이 더 중요하게 작용합니다. 짧더라도 분명한 표현이 유리합니다.`,
];

const STUDY_TEMPLATES = [
  (profile: DailyProfile) =>
    `학업운은 새 계획보다 ${profile.study}에서 성과가 납니다. 오늘은 넓히기보다 한 지점을 끝내는 쪽이 좋습니다.`,
  (profile: DailyProfile) =>
    `공부 흐름은 큰 욕심보다 ${profile.study}을 지킬 때 안정됩니다. 짧아도 완결감을 남겨 보세요.`,
  (profile: DailyProfile) =>
    `${profile.label}는 오늘 공부에서 루틴 유지가 강합니다. ${profile.study}을 기준으로 분량을 줄이면 오히려 효율이 납니다.`,
  (profile: DailyProfile) =>
    `학업운은 환경과 방식이 반 이상입니다. ${profile.study}이 살아나는 방식으로 시간을 쪼개 보세요.`,
];

const TIP_TEMPLATES = [
  (profile: DailyProfile) => `${profile.tip}을 오늘의 첫 행동으로 두세요.`,
  (profile: DailyProfile) => `${profile.caution}은 크게 키우지 말고, 끝낼 수 있는 단위만 남겨 두세요.`,
  (profile: DailyProfile) => `${profile.strength}이 살아나는 순간을 메모하면 내일 흐름도 읽기 쉬워집니다.`,
  (profile: DailyProfile) => `오늘은 ${profile.money}과 ${profile.relation} 중 하나만 먼저 챙겨도 충분합니다.`,
  (profile: DailyProfile) => `기준이 흔들리면 ${profile.tip}부터 다시 해 보세요.`,
];

const FALLBACK_PROFILE: DailyProfile = {
  label: '오늘의 운세',
  mood: '기준을 세우면 흐름이 안정되는 날',
  strength: '한 가지에 집중하는 힘',
  caution: '급한 결론',
  money: '지출을 정리하는 일',
  relation: '짧고 분명한 표현',
  study: '기본 루틴 유지',
  tip: '가장 중요한 일 한 가지를 먼저 정하기',
};

function hashSeed(text: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let x = Math.imul(state ^ (state >>> 15), 1 | state);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function pickUnique<T>(rng: () => number, items: readonly T[], count: number): T[] {
  const pool = [...items];
  const picked: T[] = [];
  while (pool.length > 0 && picked.length < count) {
    const index = Math.floor(rng() * pool.length);
    const next = pool.splice(index, 1)[0];
    if (next) {
      picked.push(next);
    }
  }
  return picked;
}

function pickOne<T>(rng: () => number, items: readonly T[]): T {
  const picked = pickUnique(rng, items, 1)[0] ?? items[0];
  if (picked === undefined) {
    throw new Error('Cannot pick from an empty array.');
  }
  return picked;
}

function parseSeedKey(seedKey: string): ParsedSeed {
  const [kind, key, rawYear] = seedKey.split(':');
  const year = rawYear ? Number.parseInt(rawYear, 10) : undefined;
  if ((kind === 'western' || kind === 'chinese') && key) {
    return { kind, key, year: Number.isFinite(year) ? year : undefined };
  }
  return { kind: 'fallback', key: seedKey };
}

function profileForSeed(seed: ParsedSeed): DailyProfile {
  if (seed.kind === 'western') {
    return WESTERN_PROFILES[seed.key as WesternZodiacKey] ?? FALLBACK_PROFILE;
  }
  if (seed.kind === 'chinese') {
    return CHINESE_PROFILES[seed.key as ChineseZodiacKey] ?? FALLBACK_PROFILE;
  }
  return FALLBACK_PROFILE;
}

export function kstDateKey(now = new Date()): string {
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const year = kst.getUTCFullYear();
  const month = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const day = String(kst.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function yearsForChineseZodiac(key: ChineseZodiacKey): number[] {
  const index = CHINESE_ZODIAC_ORDER.indexOf(key);
  const baseYear = 1972 + Math.max(index, 0);
  return [baseYear, baseYear + 12, baseYear + 24, baseYear + 36];
}

export function getDailyOption(kind: DailyKind, key: string): DailyOption<string> | null {
  if (kind === 'western') {
    return WESTERN_ZODIAC_OPTIONS.find((option) => option.key === key) ?? null;
  }
  return CHINESE_ZODIAC_OPTIONS.find((option) => option.key === key) ?? null;
}

export function buildDailySections(dateKey: string, seedKey: string): DailySection[] {
  const seed = parseSeedKey(seedKey);
  const profile = profileForSeed(seed);
  const yearHint = seed.kind === 'chinese' && seed.year ? `${seed.year}년 기준으로 보면 ` : '';
  const rng = makeRng(hashSeed(`${dateKey}:${seedKey}`));
  const tips = pickUnique(rng, TIP_TEMPLATES, 2).map((template) => `- ${template(profile)}`);

  return [
    { title: '오늘의 흐름', lines: [pickOne(rng, FLOW_TEMPLATES)(profile, yearHint)] },
    { title: '금전운', lines: [pickOne(rng, MONEY_TEMPLATES)(profile)] },
    { title: '인간관계운', lines: [pickOne(rng, RELATION_TEMPLATES)(profile)] },
    { title: '학업운', lines: [pickOne(rng, STUDY_TEMPLATES)(profile)] },
    { title: '오늘의 팁', lines: tips },
  ];
}
