import type { Element, SajuChartResult, TenGod } from '../types';

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
  kind?: 'year' | 'month';
  year?: number;
  month?: number;
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
  cycleLabel: string;
  cyclePillar: string;
  cycleElement: string;
  cycleFocus: string;
  cycleRisk: string;
  cycleAction: string;
}

function tenGodGroup(tenGod: TenGod): '비겁' | '식상' | '재성' | '관성' | '인성' {
  if (tenGod === '비견' || tenGod === '겁재') return '비겁';
  if (tenGod === '식신' || tenGod === '상관') return '식상';
  if (tenGod === '정재' || tenGod === '편재') return '재성';
  if (tenGod === '정관' || tenGod === '편관') return '관성';
  return '인성';
}

function hashText(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function parseMonthFromCycle(cycle?: QnaCycleContext): number | undefined {
  if (!cycle) return undefined;
  if (typeof cycle.month === 'number' && cycle.month >= 1 && cycle.month <= 12) {
    return cycle.month;
  }
  const m = cycle.label.match(/-(\d{1,2})$/);
  if (!m) return undefined;
  const month = Number(m[1]);
  if (!Number.isInteger(month) || month < 1 || month > 12) return undefined;
  return month;
}

function cycleNarrative(cycle?: QnaCycleContext): { focus: string; risk: string; action: string } {
  if (!cycle) {
    return {
      focus: '',
      risk: '',
      action: '',
    };
  }

  const group = tenGodGroup(cycle.tenGod);
  const month = parseMonthFromCycle(cycle);
  const monthActions = [
    '초반 계획을 간단히 고정하고 우선순위를 1개만 먼저 완료하세요.',
    '관계/일정 충돌을 줄이기 위해 약속 시간을 10분 단위로 정리하세요.',
    '새 시도보다 기존 루틴의 누수 점검에 시간을 먼저 배분하세요.',
    '결정을 미루기보다 작은 결론을 먼저 확정하고 실행으로 넘기세요.',
    '지출/시간/에너지 중 한 가지 지표를 고정해서 추적하세요.',
    '중간 점검 주간으로 잡고 진행률을 숫자로 기록하세요.',
    '완성도보다 반복성에 집중해 같은 패턴을 2회 이상 재사용하세요.',
    '협업 구간에서는 역할/기한/결과물을 문장으로 명확히 합의하세요.',
    '속도보다 정확도를 우선해 검수 단계를 한 번 더 넣으세요.',
    '결과 공유 타이밍을 앞당겨 피드백을 빠르게 받는 편이 유리합니다.',
    '마무리 단계에서는 할 일보다 버릴 일을 먼저 정리하세요.',
    '다음 달을 위해 템플릿/체크리스트를 남겨 재사용성을 높이세요.',
  ] as const;

  const focusByGroup: Record<typeof group, readonly string[]> = {
    비겁: [
      '사람/네트워크를 넓히기보다 함께 일할 기준을 선명히 하는 흐름입니다.',
      '경쟁보다 협업의 구조를 정리할 때 체감 성과가 좋아집니다.',
      '내 페이스를 지키는 경계 설정이 결과 안정성에 직접 연결됩니다.',
    ],
    식상: [
      '말/표현/결과물을 바깥으로 내보낼수록 기회가 연결되기 쉬운 흐름입니다.',
      '생산 속도를 살리되 전달 형식을 표준화하면 효율이 크게 오릅니다.',
      '실행-피드백-개선의 짧은 사이클이 핵심입니다.',
    ],
    재성: [
      '자원 배분과 거래 조건을 명확히 할수록 손실이 줄어드는 흐름입니다.',
      '수익보다 정산/현금흐름 관리에 집중하면 안정성이 높아집니다.',
      '가격/시간/노력의 교환비를 점검하는 것이 우선입니다.',
    ],
    관성: [
      '규칙/책임/역할이 선명할수록 결과 품질이 올라가는 흐름입니다.',
      '목표 자체보다 기준과 절차를 먼저 고정하는 편이 유리합니다.',
      '신뢰를 쌓는 행동(기한 준수/문서화)이 성과로 이어집니다.',
    ],
    인성: [
      '학습/정리/회복 루틴이 성과의 바닥을 올려주는 흐름입니다.',
      '즉시 확장보다 준비도를 높이는 전략이 효과적입니다.',
      '정보 흡수 후 재구성해서 내 방식으로 표준화하는 것이 핵심입니다.',
    ],
  };

  const riskByGroup: Record<typeof group, readonly string[]> = {
    비겁: [
      '관계 비용이 커지면 정작 해야 할 일의 집중도가 떨어질 수 있습니다.',
      '동업/협업에서 역할이 흐리면 책임 충돌이 생기기 쉽습니다.',
      '비교 심리가 올라오면 의사결정이 흔들릴 수 있습니다.',
    ],
    식상: [
      '설명은 많은데 마감이 늦어지는 패턴이 생길 수 있습니다.',
      '직설적인 전달이 불필요한 마찰로 번질 수 있습니다.',
      '과도한 산출물 생산으로 체력이 먼저 소모될 수 있습니다.',
    ],
    재성: [
      '수익 기회에만 집중하면 누수 관리가 느슨해질 수 있습니다.',
      '단기 거래 우선으로 장기 신뢰를 놓치기 쉽습니다.',
      '지출 통제 없이 확장하면 회복 비용이 커질 수 있습니다.',
    ],
    관성: [
      '규칙이 과해지면 속도와 유연성이 급격히 떨어질 수 있습니다.',
      '책임을 과다하게 떠안아 번아웃으로 이어질 수 있습니다.',
      '평가/완벽주의가 실행 자체를 늦출 위험이 있습니다.',
    ],
    인성: [
      '준비만 길어지고 실행 전환이 늦어질 수 있습니다.',
      '정보 수집 과다로 결론 도출이 지연될 수 있습니다.',
      '회복에 치우쳐 도전 시점을 계속 미루기 쉬운 흐름입니다.',
    ],
  };

  const elementActionMap: Record<Element, string> = {
    목: '기획안을 한 장으로 정리하고 단계별 체크를 붙여 실행하세요.',
    화: '발표/공유를 짧게 자주 하되, 후속 액션을 즉시 문서화하세요.',
    토: '일정표를 고정하고 변수 발생 시 우선순위 재정렬부터 하세요.',
    금: '기준/검수 항목을 체크리스트로 만들고 누락을 줄이세요.',
    수: '기록/복기 시간을 고정해 다음 행동으로 연결하세요.',
  };

  const seed = hashText(`${cycle.label}:${cycle.pillar}:${cycle.tenGod}:${cycle.element}`);
  const focusList = focusByGroup[group];
  const riskList = riskByGroup[group];
  const focus = focusList[seed % focusList.length] ?? focusList[0] ?? '';
  const risk = riskList[(seed + 1) % riskList.length] ?? riskList[0] ?? '';
  const monthAction = monthActions[((month ?? ((seed % 12) + 1)) - 1 + 12) % 12] ?? monthActions[0];
  const elementAction = elementActionMap[cycle.element];

  return {
    focus,
    risk,
    action: `${monthAction} ${elementAction}`,
  };
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
  // Use bracket access to avoid any bundler/parser edge cases with non-ASCII identifiers.
  const peer = (counts['비견'] ?? 0) + (counts['겁재'] ?? 0);
  const output = (counts['식신'] ?? 0) + (counts['상관'] ?? 0);
  const wealth = (counts['정재'] ?? 0) + (counts['편재'] ?? 0);
  const power = (counts['정관'] ?? 0) + (counts['편관'] ?? 0);
  const resource = (counts['정인'] ?? 0) + (counts['편인'] ?? 0);
  const total = peer + output + wealth + power + resource;

  const { top, bottom } = topAndBottomElements(chart.features.elementDistribution.counts);

  const narrative = cycleNarrative(cycle);

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
    cycleLabel: cycle?.label ?? '',
    cyclePillar: cycle?.pillar ?? '',
    cycleElement: cycle?.element ?? '',
    cycleFocus: narrative.focus,
    cycleRisk: narrative.risk,
    cycleAction: narrative.action,
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
  } else if (!text.includes('[시기 포인트]')) {
    text = `${text}\n\n[시기 포인트]\n- 기준: ${context.cycleLabel} · ${context.cyclePillar} · ${context.cycleTenGodLabel} · ${context.cycleElement}\n- 초점: ${context.cycleFocus}\n- 리스크: ${context.cycleRisk}\n- 실행: ${context.cycleAction}`;
  }

  return text.replace(/\n{3,}/g, '\n\n').trim();
}
