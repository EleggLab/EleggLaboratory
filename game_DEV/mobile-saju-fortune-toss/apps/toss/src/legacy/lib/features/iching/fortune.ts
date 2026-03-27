import { hashSeed, makeRng } from '../tarot/random';

export type LineValue = 6 | 7 | 8 | 9;
export type TrigramKey = 'qian' | 'kun' | 'zhen' | 'xun' | 'kan' | 'li' | 'gen' | 'dui';

export const TRIGRAMS: Record<
  string,
  { key: TrigramKey; ko: string; hanja: string; symbol: string; keywords: string[]; vibe: string }
> = {
  '111': { key: 'qian', ko: '건(하늘)', hanja: '乾', symbol: '☰', keywords: ['결단', '시작', '주도권'], vibe: '위로 끌어올리는 힘' },
  '000': { key: 'kun', ko: '곤(땅)', hanja: '坤', symbol: '☷', keywords: ['수용', '안정', '지속'], vibe: '받아들이고 키우는 힘' },
  '100': { key: 'zhen', ko: '진(우레)', hanja: '震', symbol: '☳', keywords: ['각성', '돌파', '속도'], vibe: '움직여서 깨우는 힘' },
  '011': { key: 'xun', ko: '손(바람)', hanja: '巽', symbol: '☴', keywords: ['침투', '설득', '유연'], vibe: '스며들어 바꾸는 힘' },
  '010': { key: 'kan', ko: '감(물)', hanja: '坎', symbol: '☵', keywords: ['위험', '깊이', '집중'], vibe: '깊이를 요구하는 힘' },
  '101': { key: 'li', ko: '리(불)', hanja: '離', symbol: '☲', keywords: ['명확', '표현', '주목'], vibe: '밝히고 드러내는 힘' },
  '001': { key: 'gen', ko: '간(산)', hanja: '艮', symbol: '☶', keywords: ['멈춤', '경계', '정리'], vibe: '멈추고 지키는 힘' },
  '110': { key: 'dui', ko: '태(못)', hanja: '兌', symbol: '☱', keywords: ['기쁨', '교류', '완화'], vibe: '교류로 풀어내는 힘' },
};

export function nowTimeText(now: Date): string {
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export function tossLines(seedText: string): LineValue[] {
  const rng = makeRng(hashSeed(seedText));
  const lines: LineValue[] = [];
  for (let i = 0; i < 6; i += 1) {
    let sum: 6 | 7 | 8 | 9 = 6;
    for (let c = 0; c < 3; c += 1) {
      sum = (sum + (rng() < 0.5 ? 0 : 1)) as 6 | 7 | 8 | 9;
    }
    lines.push(sum);
  }
  return lines;
}

export function isYang(v: LineValue): boolean {
  return v === 7 || v === 9;
}

export function isMoving(v: LineValue): boolean {
  return v === 6 || v === 9;
}

export function trigramBits(linesBottomToTop: LineValue[]): string {
  return linesBottomToTop.map((v) => (isYang(v) ? '1' : '0')).join('');
}

export function buildReadingText(upperBits: string, lowerBits: string, movingCount: number): string {
  const upper = TRIGRAMS[upperBits];
  const lower = TRIGRAMS[lowerBits];
  const u = upper ?? { ko: '알 수 없음', hanja: '', symbol: '', keywords: [], vibe: '' };
  const l = lower ?? { ko: '알 수 없음', hanja: '', symbol: '', keywords: [], vibe: '' };

  const intensity =
    movingCount >= 4 ? '변화가 큰 날' : movingCount >= 2 ? '변화가 있는 날' : movingCount === 1 ? '미세 조정의 날' : '흐름 유지의 날';

  const keywords = [...u.keywords, ...l.keywords].slice(0, 6);

  return [
    '[괘상 요약]',
    `- 상괘: ${u.symbol} ${u.ko} ${u.hanja ? `(${u.hanja})` : ''}`,
    `- 하괘: ${l.symbol} ${l.ko} ${l.hanja ? `(${l.hanja})` : ''}`,
    `- 변화(동효): ${movingCount}개 → ${intensity}`,
    '',
    '[핵심 키워드]',
    `- ${keywords.join(' · ') || '—'}`,
    '',
    '[해석]',
    `- 상괘는 “${u.vibe}”, 하괘는 “${l.vibe}”에 가깝습니다.`,
    `- 오늘은 ${intensity}로 읽히며, “${u.keywords[0] ?? '정리'}”와 “${l.keywords[0] ?? '균형'}” 사이의 균형이 포인트가 될 수 있습니다.`,
    '',
    '[조언]',
    '- 크게 바꾸기보다, 기준(규칙) 1개를 정하고 그 기준에 맞춰 행동을 줄여보세요.',
    '- 일이든 관계든 “합의할 문장 1개”를 남기면 흐름이 안정됩니다.',
    '',
    '[주의]',
    `- ${movingCount >= 2 ? '변화가 있는 날에는 과속/충돌이 나기 쉬워요. 속도보다 순서를 챙기세요.' : '흐름이 유지되는 날에는 미루기가 늘 수 있어요. 30분짜리 행동 1개로 리듬을 올리세요.'}`,
    '',
    '[실천 3줄]',
    '- (1) 오늘 해야 할 일 3개를 적고, 1개만 “완료”',
    '- (2) 지출/약속/작업 중 하나만 “한도” 정하기',
    '- (3) 답답하면 10분 산책 또는 호흡 20회',
  ].join('\n');
}

export function buildIChingResult(seedText: string): {
  lines: LineValue[];
  upperBits: string;
  lowerBits: string;
  movingCount: number;
  readingText: string;
} {
  const lines = tossLines(seedText);
  const lowerBits = trigramBits(lines.slice(0, 3));
  const upperBits = trigramBits(lines.slice(3, 6));
  const movingCount = lines.filter(isMoving).length;
  return {
    lines,
    upperBits,
    lowerBits,
    movingCount,
    readingText: buildReadingText(upperBits, lowerBits, movingCount),
  };
}
