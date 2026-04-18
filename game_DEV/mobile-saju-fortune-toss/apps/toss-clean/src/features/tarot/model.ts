import type { TarotReadingType } from './deck';

export interface TarotDrawnCard {
  id: string;
  reversed: boolean;
}

type TarotCardMeta = {
  name: string;
  uprightKeywords: string[];
  reversedKeywords: string[];
};

const TAROT_CARD_META: Record<string, TarotCardMeta> = {
  'rws-00-fool': { name: '바보', uprightKeywords: ['시작', '용기', '가능성'], reversedKeywords: ['충동', '산만함', '실수'] },
  'rws-01-magician': { name: '마법사', uprightKeywords: ['집중', '실행', '주도권'], reversedKeywords: ['과장', '허세', '분산'] },
  'rws-02-high-priestess': { name: '여사제', uprightKeywords: ['직감', '관찰', '침착함'], reversedKeywords: ['오해', '불안', '판단 보류'] },
  'rws-03-empress': { name: '여황제', uprightKeywords: ['풍요', '돌봄', '확장'], reversedKeywords: ['과보호', '지침', '과소비'] },
  'rws-04-emperor': { name: '황제', uprightKeywords: ['구조', '책임', '결단'], reversedKeywords: ['경직', '통제', '충돌'] },
  'rws-05-hierophant': { name: '교황', uprightKeywords: ['전통', '학습', '조언'], reversedKeywords: ['답답함', '형식적 태도', '반복'] },
  'rws-06-lovers': { name: '연인', uprightKeywords: ['선택', '조화', '연결'], reversedKeywords: ['갈등', '미련', '엇갈림'] },
  'rws-07-chariot': { name: '전차', uprightKeywords: ['돌파', '속도', '주도'], reversedKeywords: ['무리수', '과속', '충돌'] },
  'rws-08-strength': { name: '힘', uprightKeywords: ['인내', '내면의 힘', '절제'], reversedKeywords: ['지침', '주춤함', '동요'] },
  'rws-09-hermit': { name: '은둔자', uprightKeywords: ['성찰', '거리두기', '정리'], reversedKeywords: ['고립', '지연', '망설임'] },
  'rws-10-wheel': { name: '운명의 수레바퀴', uprightKeywords: ['순환', '기회', '전환'], reversedKeywords: ['정체', '반복', '변수'] },
  'rws-11-justice': { name: '정의', uprightKeywords: ['균형', '판단', '명료함'], reversedKeywords: ['편향', '비판', '불균형'] },
  'rws-12-hanged-man': { name: '매달린 사람', uprightKeywords: ['보류', '관점 전환', '관찰'], reversedKeywords: ['정체', '미련', '답보'] },
  'rws-13-death': { name: '죽음', uprightKeywords: ['정리', '종결', '새 출발'], reversedKeywords: ['미련', '지체', '정체'] },
  'rws-14-temperance': { name: '절제', uprightKeywords: ['조율', '회복', '균형'], reversedKeywords: ['과함', '속도 조절 필요', '지침'] },
  'rws-15-devil': { name: '악마', uprightKeywords: ['집착', '유혹', '압박'], reversedKeywords: ['이탈', '자각', '벗어남'] },
  'rws-16-tower': { name: '탑', uprightKeywords: ['변화', '각성', '파열'], reversedKeywords: ['불안', '흔들림', '후폭풍'] },
  'rws-17-star': { name: '별', uprightKeywords: ['희망', '회복', '영감'], reversedKeywords: ['불안', '지연', '공허함'] },
  'rws-18-moon': { name: '달', uprightKeywords: ['감수성', '직감', '모호함'], reversedKeywords: ['오해', '불안', '착각'] },
  'rws-19-sun': { name: '태양', uprightKeywords: ['선명함', '성과', '개방성'], reversedKeywords: ['과열', '부담', '과장'] },
  'rws-20-judgement': { name: '심판', uprightKeywords: ['각성', '결론', '정리'], reversedKeywords: ['보류', '회피', '미련'] },
  'rws-21-world': { name: '세계', uprightKeywords: ['완성', '마무리', '확장'], reversedKeywords: ['미완', '지연', '정리 필요'] },
};

const TYPE_COPY: Record<
  TarotReadingType,
  {
    title: string;
    positions: string[];
    emphasisNoun: string;
    closingHeading: string;
    closingNotes: string[];
  }
> = {
  today: {
    title: '오늘의 운세',
    positions: ['오늘의 핵심 흐름'],
    emphasisNoun: '하루 흐름',
    closingHeading: '오늘의 조언',
    closingNotes: [
      '오늘은 결론보다 리듬을 맞추는 쪽이 더 중요합니다.',
      '한 번에 하나만 고르고, 나머지는 미련 없이 미루는 편이 흐름을 안정시킵니다.',
    ],
  },
  love: {
    title: '애정운',
    positions: ['현재 감정선', '상대의 반응', '관계 조언'],
    emphasisNoun: '관계 흐름',
    closingHeading: '관계 조언',
    closingNotes: [
      '애정운은 감정의 크기보다 표현의 결이 더 중요합니다.',
      '명확한 한 문장이 여러 추측보다 관계를 편하게 만듭니다.',
    ],
  },
  money: {
    title: '금전운',
    positions: ['현재 재정 흐름', '숨어 있는 변수', '지출 조언'],
    emphasisNoun: '재정 흐름',
    closingHeading: '금전 조언',
    closingNotes: [
      '금전운은 더 버는 문제보다 새는 곳을 막는 문제에서 먼저 갈립니다.',
      '지금 당장 줄일 수 있는 지출 하나를 찾는 쪽이 흐름을 안정시킵니다.',
    ],
  },
  relationship: {
    title: '인간관계운',
    positions: ['현재 분위기', '상대의 입장', '대화 조언'],
    emphasisNoun: '관계 흐름',
    closingHeading: '관계 조언',
    closingNotes: [
      '인간관계는 정답보다 온도가 중요합니다.',
      '반응하기 전에 상대가 어디서 불편한지 한 번 더 읽어보는 편이 좋습니다.',
    ],
  },
  study: {
    title: '학업운',
    positions: ['현재 집중도', '흔들리는 지점', '실행 조언'],
    emphasisNoun: '학습 흐름',
    closingHeading: '학업 조언',
    closingNotes: [
      '학업운은 계획의 양보다 리듬의 유지에서 점수가 갈립니다.',
      '오늘 끝낼 분량을 줄여서 완주하는 편이 흐름을 지키는 데 유리합니다.',
    ],
  },
};

const UPRIGHT_TEMPLATES = [
  (position: string, label: string, emphasis: string, _noun: string) =>
    `${position}의 ${label} 카드는 지금 ${emphasis}을 먼저 살리는 편이 좋다고 말합니다.`,
  (position: string, label: string, emphasis: string, noun: string) =>
    `${label} 카드는 ${position}에서 ${emphasis}을 분명하게 잡으면 ${noun}이 더 또렷해질 수 있다고 조언합니다.`,
  (position: string, label: string, emphasis: string, _noun: string) =>
    `${position}에 놓인 ${label}는 무리하게 넓히기보다 ${emphasis}을 또렷하게 만드는 쪽이 도움이 된다고 보여줍니다.`,
  (position: string, label: string, emphasis: string, _noun: string) =>
    `${label} 카드는 ${position}에서 ${emphasis}을 중심으로 세우면 다음 선택이 더 쉬워질 수 있다고 말합니다.`,
];

const REVERSED_TEMPLATES = [
  (position: string, label: string, emphasis: string, _noun: string) =>
    `${position}의 ${label} 카드는 지금 ${emphasis}이 과해질 수 있으니, 속도를 늦추고 흐름을 다시 정리하라고 말합니다.`,
  (position: string, label: string, emphasis: string, _noun: string) =>
    `${label} 카드는 ${position}에서 ${emphasis}이 엇나가기 쉬우니, 덜어내고 확인하는 편이 좋다고 보여줍니다.`,
  (position: string, label: string, emphasis: string, _noun: string) =>
    `${position}에 나온 ${label}는 ${emphasis}을 바로 밀기보다 한 템포 쉬고 조율해야 덜 흔들린다고 경고합니다.`,
  (position: string, label: string, emphasis: string, _noun: string) =>
    `${label} 카드는 ${position}에서 ${emphasis}이 급해질수록 오히려 흐름이 꼬일 수 있으니, 확인과 정리를 먼저 하라고 조언합니다.`,
];

function metaForCard(cardId: string): TarotCardMeta {
  return (
    TAROT_CARD_META[cardId] ?? {
      name: '카드',
      uprightKeywords: ['집중', '흐름', '변화'],
      reversedKeywords: ['지연', '정리', '주의'],
    }
  );
}

function hashSeed(text: string): number {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function pickOne<T>(rng: () => number, items: readonly T[]): T {
  const index = Math.floor(rng() * items.length);
  const picked = items[index] ?? items[0];
  if (picked === undefined) {
    throw new Error('Cannot pick from an empty array.');
  }
  return picked;
}

function readingCopyFor(type: TarotReadingType) {
  return TYPE_COPY[type];
}

export function isTarotReadingType(value: string | undefined): value is TarotReadingType {
  return value === 'today' || value === 'love' || value === 'money' || value === 'relationship' || value === 'study';
}

export function titleForReading(type: TarotReadingType): string {
  return readingCopyFor(type).title;
}

export function tarotCardLabel(cardId: string): string {
  return metaForCard(cardId).name;
}

export function tarotOrientationLabel(reversed: boolean): string {
  return reversed ? '역방향' : '정방향';
}

export function tarotKeywordText(cardId: string, reversed: boolean): string {
  const meta = metaForCard(cardId);
  return (reversed ? meta.reversedKeywords : meta.uprightKeywords).join(', ');
}

export function encodeTarotCards(cards: TarotDrawnCard[]): string {
  return cards.map((card) => `${card.id}:${card.reversed ? 1 : 0}`).join(',');
}

export function parseTarotCards(value: string | undefined): TarotDrawnCard[] | null {
  if (!value) return null;
  const parts = value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return null;

  const parsed: TarotDrawnCard[] = [];
  for (const part of parts) {
    const [id, reversed] = part.split(':');
    if (!id) return null;
    parsed.push({ id, reversed: reversed === '1' });
  }

  return parsed;
}

export function buildTarotReading(type: TarotReadingType, drawn: TarotDrawnCard[]): string {
  const copy = readingCopyFor(type);
  const seed = hashSeed(`${type}:${encodeTarotCards(drawn)}`);
  const rng = makeRng(seed);
  const lines: string[] = [`[${copy.title} 리딩]`, ''];

  drawn.forEach((card, index) => {
    const position = copy.positions[index] ?? `카드 ${index + 1}`;
    const label = tarotCardLabel(card.id);
    const orientation = tarotOrientationLabel(card.reversed);
    const keywords = tarotKeywordText(card.id, card.reversed);
    const meta = metaForCard(card.id);
    const emphasis = card.reversed ? (meta.reversedKeywords[0] ?? '조율') : (meta.uprightKeywords[0] ?? '집중');
    const template = card.reversed ? pickOne(rng, REVERSED_TEMPLATES) : pickOne(rng, UPRIGHT_TEMPLATES);

    lines.push(`${position}: ${label} (${orientation})`);
    lines.push(`- 핵심 키워드: ${keywords}`);
    lines.push(`- ${template(position, label, emphasis, copy.emphasisNoun)}`);
    lines.push('');
  });

  lines.push(`[${copy.closingHeading}]`);
  lines.push(...copy.closingNotes.map((line) => `- ${line}`));

  return lines.join('\n');
}
