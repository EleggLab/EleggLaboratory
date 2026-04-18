import type { Element, SajuChartResult, TenGod } from '@saju/core';

export type QnaDomain =
  | 'money'
  | 'love'
  | 'health'
  | 'children'
  | 'parents'
  | 'friends'
  | 'benefactor'
  | 'job'
  | 'business';

export interface QnaCycleContext {
  label: string; // e.g., '2026년', '2026-02'
  pillar: string; // e.g., '갑자'
  tenGod: TenGod;
  element: Element;
}

export interface QnaTemplateContext {
  wealthGrade: string;
  outputGrade: string;
  peerGrade: string;
  powerGrade: string;
  resourceGrade: string;
  dominantElements: string;
  lackingElements: string;
  strengthLevel: string;
  cycleTenGodLabel: string; // e.g., '정재(재성)'
}

function tenGodGroup(tenGod: TenGod): '비겁' | '식상' | '재성' | '관성' | '인성' {
  if (tenGod === '비견' || tenGod === '겁재') return '비겁';
  if (tenGod === '식신' || tenGod === '상관') return '식상';
  if (tenGod === '정재' || tenGod === '편재') return '재성';
  if (tenGod === '정관' || tenGod === '편관') return '관성';
  return '인성';
}

function gradeByRatio(count: number, total: number): string {
  if (total <= 0) return '판단 불가';
  const ratio = count / total;
  if (ratio >= 0.28) return '많은 편';
  if (ratio >= 0.18) return '있는 편';
  if (ratio <= 0.07) return '적은 편';
  return '보통';
}

function topAndBottomElements(counts: Record<Element, number>): { top: Element[]; bottom: Element[] } {
  const entries = (Object.entries(counts) as Array<[Element, number]>).sort((a, b) => b[1] - a[1]);
  return {
    top: entries.slice(0, 2).map(([element]) => element),
    bottom: entries.slice(-2).map(([element]) => element),
  };
}

export function buildQnaTemplateContext(
  chart: SajuChartResult,
  cycle?: QnaCycleContext,
): QnaTemplateContext {
  const counts = chart.features.tenGodCount;
  const peer = counts.비견 + counts.겁재;
  const output = counts.식신 + counts.상관;
  const wealth = counts.정재 + counts.편재;
  const power = counts.정관 + counts.편관;
  const resource = counts.정인 + counts.편인;
  const total = peer + output + wealth + power + resource;

  const { top, bottom } = topAndBottomElements(chart.features.elementDistribution.counts);

  return {
    wealthGrade: gradeByRatio(wealth, total),
    outputGrade: gradeByRatio(output, total),
    peerGrade: gradeByRatio(peer, total),
    powerGrade: gradeByRatio(power, total),
    resourceGrade: gradeByRatio(resource, total),
    dominantElements: top.join('/'),
    lackingElements: bottom.join('/'),
    strengthLevel: chart.features.strength.level,
    cycleTenGodLabel: cycle ? `${cycle.tenGod}(${tenGodGroup(cycle.tenGod)})` : '',
  };
}

export function formatQnaText(template: string, context: QnaTemplateContext): string {
  let text = template;

  for (const [key, value] of Object.entries(context)) {
    text = text.replaceAll(`{{${key}}}`, value);
  }

  // Hide year/month section when no cycle context is provided.
  if (!context.cycleTenGodLabel) {
    text = text.replace(/\n\n\[올해\/이달로 보기\][\s\S]*?(?=\n\n\[|$)/, '');
  }

  return text.replace(/\n{3,}/g, '\n\n').trim();
}

