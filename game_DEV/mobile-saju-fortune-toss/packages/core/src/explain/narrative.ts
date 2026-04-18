import type { AnnualLuckCycle, LuckCycle, SajuChartResult } from '../types';

const ELEMENT_TRAITS: Record<string, string> = {
  목: '성장과 확장, 기획을 넓히는 힘이 있습니다.',
  화: '표현과 추진, 분위기를 끌어올리는 힘이 있습니다.',
  토: '안정과 조율, 운영과 관리에 강점이 있습니다.',
  금: '정리와 결단, 기준을 세우는 힘이 있습니다.',
  수: '유연함과 분석, 흐름을 읽는 힘이 있습니다.',
};

const TEN_GOD_TRAITS: Record<string, string> = {
  비견: '자기주도성과 독립성이 강하게 드러납니다.',
  겁재: '경쟁 상황에서 속도를 내는 힘이 있습니다.',
  식신: '결과물을 꾸준히 만드는 생산성이 좋습니다.',
  상관: '표현력과 문제 제기가 또렷합니다.',
  편재: '기회 포착과 자원 활용 감각이 좋습니다.',
  정재: '현실 감각과 재무 관리력이 좋습니다.',
  편관: '압박 속에서도 버티며 밀어붙이는 힘이 있습니다.',
  정관: '책임감과 구조를 세우는 힘이 있습니다.',
  편인: '직관과 응용 학습이 좋습니다.',
  정인: '기초를 다지고 안정적으로 흡수하는 힘이 있습니다.',
};

export interface NarrativeResult {
  profile: string;
  overallLuck: string;
  yearlyLuck?: string;
}

type GroupKey = 'self' | 'express' | 'money' | 'rule' | 'support';

const GROUP_LABEL: Record<GroupKey, string> = {
  self: '자기 동력',
  express: '표현과 결과',
  money: '재정과 자원',
  rule: '책임과 구조',
  support: '학습과 회복',
};

const GROUP_TIP: Record<GroupKey, { strong: string; caution: string; action: string }> = {
  self: {
    strong: '스스로 기준을 세우고 끌고 가는 힘이 좋습니다.',
    caution: '고집이 강해지면 협업 피로가 커질 수 있습니다.',
    action: '오늘은 목표 하나만 먼저 고정하고 나머지는 뒤로 미루세요.',
  },
  express: {
    strong: '생각을 결과물로 바꾸는 속도가 좋습니다.',
    caution: '말과 아이디어가 많아지면 집중이 흩어질 수 있습니다.',
    action: '초안 하나를 끝까지 밀어붙이는 데 에너지를 쓰세요.',
  },
  money: {
    strong: '기회와 자원을 읽는 감각이 있습니다.',
    caution: '좋아 보이는 흐름을 너무 빨리 확장하면 샐 수 있습니다.',
    action: '들어오는 돈보다 새는 비용부터 먼저 점검하세요.',
  },
  rule: {
    strong: '기준과 마감, 구조를 세우는 힘이 좋습니다.',
    caution: '경직되면 스스로를 지나치게 압박할 수 있습니다.',
    action: '지금 필요한 책임 하나만 분명히 적고 거기서부터 시작하세요.',
  },
  support: {
    strong: '정리하고 복기하며 안정적으로 쌓는 힘이 있습니다.',
    caution: '생각만 길어지면 실행이 늦어질 수 있습니다.',
    action: '30분 안에 끝낼 수 있는 분량으로 쪼개서 바로 실행하세요.',
  },
};

function topTenGod(result: SajuChartResult): [string, number] {
  return Object.entries(result.features.tenGodCount).sort((a, b) => b[1] - a[1])[0] ?? ['비견', 0];
}

function topElements(result: SajuChartResult): string[] {
  return Object.entries(result.features.elementDistribution.counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([element]) => element);
}

function classifyGroups(result: SajuChartResult): Array<[GroupKey, number]> {
  const counts = result.features.tenGodCount;
  const peer = (counts['비견'] ?? 0) + (counts['겁재'] ?? 0);
  const output = (counts['식신'] ?? 0) + (counts['상관'] ?? 0);
  const money = (counts['편재'] ?? 0) + (counts['정재'] ?? 0);
  const rule = (counts['편관'] ?? 0) + (counts['정관'] ?? 0);
  const support = (counts['편인'] ?? 0) + (counts['정인'] ?? 0);

  const groups: Array<[GroupKey, number]> = [
    ['self', peer],
    ['express', output],
    ['money', money],
    ['rule', rule],
    ['support', support],
  ];

  return groups.sort((a, b) => b[1] - a[1]);
}

function hourConfidenceNote(result: SajuChartResult): string | null {
  const level = result.fourPillars.meta.confidence.hourPillar;
  if (level === 'low') {
    return '시주 정확도가 낮아 세부 해석은 참고용으로만 보는 편이 좋습니다.';
  }
  if (level === 'medium') {
    return '시주 경계 근처라 세부 해석은 실제 체감과 함께 보정해서 읽는 편이 좋습니다.';
  }
  return null;
}

function buildProfileLines(result: SajuChartResult): string[] {
  const dayPillar = result.features.dayPillar;
  const dayMaster = result.features.dayMaster;
  const dayMasterElement = result.fourPillars.day.stemElement;
  const strength = result.features.strength.level;
  const [dominantTenGod] = topTenGod(result);
  const dominantElements = topElements(result);
  const groups = classifyGroups(result);
  const top1 = groups[0]?.[0] ?? 'self';
  const top2 = groups[1]?.[0] ?? top1;
  const low = groups[groups.length - 1]?.[0] ?? 'support';

  const lines: string[] = [];
  lines.push('[사주 요약]');
  lines.push(`- 일주: ${dayPillar}`);
  lines.push(`- 중심 기운: ${dayMaster} (${dayMasterElement})`);
  lines.push(`- 기본 성향: ${ELEMENT_TRAITS[dayMasterElement] ?? '복합적인 성향이 있습니다.'}`);
  lines.push(`- 강하게 드러나는 역할: ${dominantTenGod} · ${TEN_GOD_TRAITS[dominantTenGod] ?? '균형형 기질입니다.'}`);
  if (dominantElements.length > 0) {
    lines.push(`- 두드러지는 오행 흐름: ${dominantElements.join(' / ')}`);
  }

  const confidenceNote = hourConfidenceNote(result);
  if (confidenceNote) {
    lines.push(`- 참고: ${confidenceNote}`);
  }

  lines.push('');
  lines.push('[해석 포인트]');
  if (strength === '강') {
    lines.push('- 기본 에너지가 강한 편이라 추진력이 좋지만, 과열되면 피로가 먼저 옵니다.');
  } else if (strength === '약') {
    lines.push('- 환경과 리듬의 영향을 많이 받는 편이라, 페이스 조절이 곧 성과 관리입니다.');
  } else {
    lines.push('- 상황에 맞춰 조절하는 힘이 있어, 범위를 좁혀 집중하면 안정적으로 결과가 납니다.');
  }
  lines.push(`- 강점 1: ${GROUP_LABEL[top1]} · ${GROUP_TIP[top1].strong}`);
  if (top2 !== top1) {
    lines.push(`- 강점 2: ${GROUP_LABEL[top2]} · ${GROUP_TIP[top2].strong}`);
  }
  lines.push(`- 주의 지점: ${GROUP_LABEL[low]} · ${GROUP_TIP[low].caution}`);

  lines.push('');
  lines.push('[오늘 이렇게 쓰면 좋습니다]');
  lines.push(`- ${GROUP_TIP[top1].action}`);
  if (top2 !== top1) {
    lines.push(`- ${GROUP_TIP[top2].action}`);
  }
  if (low !== top1 && low !== top2) {
    lines.push(`- ${GROUP_TIP[low].action}`);
  }

  return lines;
}

function luckLine(luck: LuckCycle): string {
  const pillar = `${luck.pillar.stem}${luck.pillar.branch}`;
  const theme = TEN_GOD_TRAITS[luck.tenGodToDayMaster] ?? luck.tenGodToDayMaster;
  return `- ${luck.startAge}~${luck.endAge}세: ${pillar} (${luck.element}) · ${theme}`;
}

function buildOverallLuckLines(result: SajuChartResult): string[] {
  const groups = classifyGroups(result);
  const top1 = groups[0]?.[0] ?? 'self';
  const top2 = groups[1]?.[0] ?? top1;
  const low = groups[groups.length - 1]?.[0] ?? 'support';
  const dominantElements = topElements(result);

  const firstLuck = result.luck.cycles[0];
  const secondLuck = result.luck.cycles[1];
  const thirdLuck = result.luck.cycles[2];

  const lines: string[] = [];
  lines.push('[전체 흐름]');
  lines.push('- 대운은 “어떤 주제가 반복해서 중요해지는가”를 보여주는 장기 흐름입니다.');
  lines.push('');
  lines.push(firstLuck ? luckLine(firstLuck) : '- 확인 가능한 대운 정보가 아직 없습니다.');
  if (secondLuck) lines.push(luckLine(secondLuck));
  if (thirdLuck) lines.push(luckLine(thirdLuck));
  lines.push('');
  lines.push('[읽는 법]');
  lines.push(`- 지금 구조에서 특히 강한 축은 ${GROUP_LABEL[top1]}${top2 !== top1 ? ` · ${GROUP_LABEL[top2]}` : ''}입니다.`);
  lines.push(`- 반대로 ${GROUP_LABEL[low]}은 무리해서 밀면 쉽게 흔들릴 수 있으니 범위를 줄여 접근하는 편이 좋습니다.`);
  lines.push(`- 오행 ${dominantElements.join(' / ') || '균형형'} 쪽 강점을 루틴으로 바꾸면 흐름이 더 안정됩니다.`);
  return lines;
}

function buildYearlyLuckLines(result: SajuChartResult, yearLuck: AnnualLuckCycle): string[] {
  const dominantElements = topElements(result);
  const theme = TEN_GOD_TRAITS[yearLuck.tenGodToDayMaster] ?? yearLuck.tenGodToDayMaster;
  const pillar = `${yearLuck.pillar.stem}${yearLuck.pillar.branch}`;

  return [
    `[${yearLuck.solarYear}년 흐름]`,
    `- 세운: ${pillar} / ${yearLuck.element} / ${theme}`,
    `- 올해는 ${yearLuck.tenGodToDayMaster} 성향이 앞에 드러나기 쉬운 해입니다.`,
    `- 기존 강점(${dominantElements.join(' / ') || '균형형'})과 맞물리면 속도가 붙고, 반대로 과하면 피로가 커질 수 있습니다.`,
    '',
    '[올해 이렇게 쓰면 좋습니다]',
    '- 한 번에 크게 넓히기보다, 검증 가능한 단위로 끊어 반응을 보는 편이 안전합니다.',
    '- 좋게 풀릴 때도 마감과 예산, 체력의 기준을 같이 적어두면 흐름이 오래 갑니다.',
  ];
}

export function buildNarrative(
  result: SajuChartResult,
  yearLuck?: AnnualLuckCycle | null,
): NarrativeResult {
  const profile = buildProfileLines(result).join('\n');
  const overallLuck = buildOverallLuckLines(result).join('\n');

  if (!yearLuck) {
    return { profile, overallLuck };
  }

  return {
    profile,
    overallLuck,
    yearlyLuck: buildYearlyLuckLines(result, yearLuck).join('\n'),
  };
}
