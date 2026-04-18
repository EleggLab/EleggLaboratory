import { TAROT_DECK, spreadFor, type TarotReadingType } from './deck';
import type { TarotDrawnCard } from './storage';

export function isTarotReadingType(value: string | undefined): value is TarotReadingType {
  return value === 'today' || value === 'love' || value === 'money' || value === 'relationship' || value === 'study';
}

export function encodeDrawnCards(cards: TarotDrawnCard[]): string {
  return cards.map((card) => `${card.id}:${card.reversed ? 1 : 0}`).join(',');
}

export function parseDrawnCards(value: string | undefined): TarotDrawnCard[] | null {
  if (!value) return null;

  const parts = value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return null;

  const parsed: TarotDrawnCard[] = [];
  for (const part of parts) {
    const [id, flag] = part.split(':');
    if (!id) return null;
    parsed.push({ id, reversed: flag === '1' });
  }

  return parsed;
}

export function titleForReading(type: TarotReadingType): string {
  if (type === 'today') return '오늘의 운세';
  if (type === 'love') return '연애운';
  if (type === 'money') return '금전운';
  if (type === 'relationship') return '인간관계운';
  return '직업운';
}

export function buildTarotReading(type: TarotReadingType, drawn: TarotDrawnCard[]): string {
  const spread = spreadFor(type);
  const cards = drawn
    .map((drawnCard) => {
      const def = TAROT_DECK.find((card) => card.id === drawnCard.id);
      if (!def) return null;

      const meaning = drawnCard.reversed ? def.meanings.reversed : def.meanings.upright;
      return {
        keywords: meaning.keywords,
        long: meaning.long,
        name: def.nameKo,
        reversed: drawnCard.reversed,
        short: meaning.short,
      };
    })
    .filter(Boolean) as Array<{
    keywords: string[];
    long: string;
    name: string;
    reversed: boolean;
    short: string;
  }>;

  const lines: string[] = [];
  lines.push(`[${titleForReading(type)} 해석]`);
  lines.push('');
  lines.push('[뽑은 카드]');

  cards.forEach((card, idx) => {
    const pos = spread.positions[idx] ?? `카드 ${idx + 1}`;
    lines.push(`- ${pos}: ${card.name} ${card.reversed ? '(역방향)' : '(정방향)'} · ${card.keywords.join(', ')}`);
  });

  lines.push('');
  if (type === 'today') {
    const card = cards[0];
    if (!card) return lines.join('\n');

    lines.push('[오늘의 전달]');
    lines.push(card.long);
    lines.push('');
    lines.push('[실천 팁]');
    lines.push(
      card.reversed ? '- 속도를 줄이고 확인 과정을 한 번 더 거치세요.' : '- 오늘은 한 가지를 먼저 끝내는 흐름이 좋습니다.',
    );
    lines.push('- 해야 할 일 3가지 중 1가지를 먼저 완료해 보세요.');
    return lines.join('\n');
  }

  lines.push('[카드별 해석]');
  cards.forEach((card, idx) => {
    const pos = spread.positions[idx] ?? `카드 ${idx + 1}`;
    lines.push(`- ${pos}: ${card.short}`);
    lines.push(`  ${card.long}`);
  });

  lines.push('');
  lines.push('[종합 정리]');
  lines.push('- 지금은 결론보다 작은 실행을 먼저 쌓는 방식이 유리합니다.');
  lines.push('- 오늘 할 일과 미룰 일을 분리하면 흐름이 한결 안정됩니다.');

  return lines.join('\n');
}
