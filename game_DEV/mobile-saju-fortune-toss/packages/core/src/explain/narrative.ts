import type { AnnualLuckCycle, SajuChartResult } from '../types';

const ELEMENT_TRAITS: Record<string, string> = {
  '목': '성장과 확장, 기획/개척 성향',
  '화': '표현과 추진, 에너지 발산 성향',
  '토': '안정과 조율, 운영/관리 성향',
  '금': '정리와 결단, 기준/품질 성향',
  '수': '유연과 탐구, 정보/분석 성향',
};

const TENGOD_TRAITS: Record<string, string> = {
  '비견': '자기주도성과 독립성',
  '겁재': '경쟁/협업에서의 추진력',
  '식신': '꾸준한 생산성과 실행력',
  '상관': '표현력과 문제제기 능력',
  '편재': '기회 포착과 자원 운용',
  '정재': '안정적 재무/실무 운영',
  '편관': '도전 과제 대응력',
  '정관': '책임감과 구조화 능력',
  '편인': '직관과 빠른 학습',
  '정인': '지식 축적과 지원 역량',
};

export interface NarrativeResult {
  profile: string;
  overallLuck: string;
  yearlyLuck?: string;
}

function topTenGod(result: SajuChartResult): [string, number] {
  return Object.entries(result.features.tenGodCount).sort((a, b) => b[1] - a[1])[0] ?? ['비견', 0];
}

function topElements(result: SajuChartResult): string[] {
  return Object.entries(result.features.elementDistribution.counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([element]) => element);
}

export function buildNarrative(
  result: SajuChartResult,
  yearLuck?: AnnualLuckCycle | null,
): NarrativeResult {
  const dayPillar = result.features.dayPillar;
  const dayMaster = result.features.dayMaster;
  const dayMasterElement = result.fourPillars.day.stemElement;
  const strength = result.features.strength.level;
  const [dominantTenGod] = topTenGod(result);
  const dominantElements = topElements(result);

  const counts = result.features.tenGodCount;
  // Use bracket access to avoid any bundler/parser edge cases with non-ASCII identifiers.
  const peer = (counts['비견'] ?? 0) + (counts['겁재'] ?? 0);
  const output = (counts['식신'] ?? 0) + (counts['상관'] ?? 0);
  const wealth = (counts['정재'] ?? 0) + (counts['편재'] ?? 0);
  const power = (counts['정관'] ?? 0) + (counts['편관'] ?? 0);
  const resource = (counts['정인'] ?? 0) + (counts['편인'] ?? 0);

  type GroupKey = 'self' | 'express' | 'money' | 'rule' | 'support';
  const groups: Array<[GroupKey, number]> = [
    ['self', peer],
    ['express', output],
    ['money', wealth],
    ['rule', power],
    ['support', resource],
  ];

  groups.sort((a, b) => {
    const av = Number.isFinite(a[1]) ? a[1] : 0;
    const bv = Number.isFinite(b[1]) ? b[1] : 0;
    return bv - av;
  });

  const top1 = groups[0]?.[0] ?? 'self';
  const top2 = groups[1]?.[0] ?? top1;
  const low = groups[groups.length - 1]?.[0] ?? 'support';

  const GROUP_LABEL: Record<GroupKey, string> = {
    self: '자기동력(주도/경쟁)',
    express: '표현/결과물(생산)',
    money: '돈/자원(관리)',
    rule: '규칙/책임(구조)',
    support: '학습/지원(정리)',
  };

  const GROUP_TIP: Record<GroupKey, { strong: string; caution: string; action: string }> = {
    self: {
      strong: '스스로 기준을 세우고 밀고 가면 속도가 붙습니다.',
      caution: '고집이 강해지면 대립과 피로가 쌓일 수 있어요.',
      action: '내 기준 1줄을 먼저 정하고, 합의할 부분만 문장으로 남겨두세요.',
    },
    express: {
      strong: '생각을 결과물로 바꿔 내는 힘(표현/생산)이 강점이 됩니다.',
      caution: '말이 많아지거나 방향이 자주 바뀌면 집중력이 분산될 수 있어요.',
      action: '초안 1개를 먼저 만들고, 피드백으로 다듬는 루틴을 고정해 보세요.',
    },
    money: {
      strong: '자원과 기회를 다루는 감각(관리/거래)이 강점이 되기 쉽습니다.',
      caution: '기회가 많을수록 지출/약속도 같이 늘어날 수 있어요.',
      action: '손익/현금흐름/한도(시간·돈)를 숫자로 정해두면 안정적입니다.',
    },
    rule: {
      strong: '책임과 구조를 잡을 때 성과가 잘 나옵니다.',
      caution: '부담이 과해지면 번아웃이 오기 쉬워요.',
      action: '역할과 마감만 먼저 고정하고, 나머지는 주 단위로 조정해 보세요.',
    },
    support: {
      strong: '정리·학습·기획처럼 “이해의 축”이 강점이 되기 쉽습니다.',
      caution: '생각이 길어지면 실행이 늦어질 수 있어요.',
      action: '작은 실험 1개(30분)를 먼저 하고, 결과를 보고 다음을 정해 보세요.',
    },
  };

  const elementSorted = Object.entries(result.features.elementDistribution.counts).sort((a, b) => b[1] - a[1]);
  const elementDominant = elementSorted
    .slice(0, 2)
    .filter(([, v]) => v > 0)
    .map(([k]) => k);
  const elementLacking = elementSorted
    .slice(-2)
    .filter(([, v]) => v <= 1)
    .map(([k]) => k);

  const hourConfidence = result.fourPillars.meta.confidence.hourPillar;
  const hourNote =
    hourConfidence === 'low'
      ? '시간 미상/경계로 인해 시주 관련 내용은 변동 가능성이 큽니다.'
      : hourConfidence === 'medium'
        ? '시주 경계 규칙/입력 오차에 따라 시주 관련 일부 포인트가 달라질 수 있습니다.'
        : null;

  const profileLines: string[] = [];

  profileLines.push('[핵심 요약]');
  profileLines.push(`- 일주: ${dayPillar}`);
  profileLines.push(`- 중심(일간): ${dayMaster} (${dayMasterElement})`);
  profileLines.push(`- 기본 기질: ${ELEMENT_TRAITS[dayMasterElement] ?? '복합 성향'}`);

  if (elementDominant.length > 0 || elementLacking.length > 0) {
    const dom = elementDominant.join('/') || '복합';
    const lack = elementLacking.join('/') || '크게 치우치지 않음';
    profileLines.push(`- 오행 흐름: ${dom} 쪽이 도드라지고, ${lack} 쪽은 의식적으로 보완하면 좋아요.`);
  }

  profileLines.push(
    `- 역할 키워드(십성): “${dominantTenGod}” 쪽이 눈에 띄어요. 쉽게 말하면 ${
      TENGOD_TRAITS[dominantTenGod] ?? '복합 성향'
    } 성향입니다.`,
  );

  if (hourNote) {
    profileLines.push(`- 참고: ${hourNote}`);
  }

  profileLines.push('');
  profileLines.push('[이 사람의 리듬]');
  profileLines.push(
    strength === '강'
      ? '- 에너지가 잘 모이는 편이라 “한 번에 밀어붙이는 힘”이 장점입니다. 다만 과속하면 몸/관계에 피로가 먼저 쌓일 수 있어요.'
      : strength === '약'
        ? '- 환경과 리듬의 영향을 크게 받는 편이라 “회복 루틴”이 실력입니다. 컨디션이 올라올 때 속도를 내고, 꺾일 땐 범위를 줄이는 게 안전합니다.'
        : '- 상황에 맞춰 조정하는 힘이 있는 편입니다. 목표를 너무 분산시키지만 않으면 안정적으로 굴러갑니다.',
  );

  profileLines.push('');
  profileLines.push('[잘 먹히는 전략]');
  profileLines.push(`- 강점 1: ${GROUP_LABEL[top1]} — ${GROUP_TIP[top1].strong}`);
  if (top2 !== top1) {
    profileLines.push(`- 강점 2: ${GROUP_LABEL[top2]} — ${GROUP_TIP[top2].strong}`);
  }
  profileLines.push(`- 주의 포인트: ${GROUP_LABEL[low]} — ${GROUP_TIP[low].caution}`);

  profileLines.push('');
  profileLines.push('[오늘부터 써먹기]');
  profileLines.push(`- ${GROUP_TIP[top1].action}`);
  if (top2 !== top1) {
    profileLines.push(`- ${GROUP_TIP[top2].action}`);
  }
  if (low !== top1 && low !== top2) {
    profileLines.push(`- ${GROUP_TIP[low].action}`);
  }

  profileLines.push('');
  profileLines.push('[생각해 볼 질문]');
  profileLines.push('- 지금 나에게 필요한 건 “속도”일까요, “정리”일까요?');
  profileLines.push('- 최근 반복되는 패턴이 있다면, 어느 상황에서 시작되나요?');
  profileLines.push('- 내가 스스로 통제할 수 있는 레버(루틴/관계/돈/공부)는 무엇인가요?');

  const firstLuck = result.luck.cycles[0];
  const secondLuck = result.luck.cycles[1];
  const thirdLuck = result.luck.cycles[2];

  const overallLines: string[] = [];
  overallLines.push('[대운 흐름(10년 단위)]');
  overallLines.push(
    '- 대운은 “좋다/나쁘다”보다, 내 삶에서 어떤 주제가 커지는지(일·관계·돈·공부)의 테마로 보는 편이 안전합니다.',
  );
  overallLines.push('');

  const luckLine = (luck: (typeof result.luck.cycles)[number]): string => {
    const pillar = `${luck.pillar.stem}${luck.pillar.branch}`;
    const theme = TENGOD_TRAITS[luck.tenGodToDayMaster] ?? luck.tenGodToDayMaster;
    return `- ${luck.startAge}~${luck.endAge}세: ${pillar} (${luck.element}) · ${theme}`;
  };

  overallLines.push(firstLuck ? luckLine(firstLuck) : '- 대운 정보가 없습니다.');
  if (secondLuck) overallLines.push(luckLine(secondLuck));
  if (thirdLuck) overallLines.push(luckLine(thirdLuck));

  overallLines.push('');
  overallLines.push('[흐름을 잘 쓰는 요령]');
  overallLines.push(
    `- 지금 사주 구조상 강점으로 쓰기 쉬운 축은 ${GROUP_LABEL[top1]}${top2 !== top1 ? ` · ${GROUP_LABEL[top2]}` : ''}입니다.`,
  );
  overallLines.push(
    `- 반대로 ${GROUP_LABEL[low]} 쪽은 무리하면 흔들리기 쉬운 구간이니, 범위를 줄여 “작게 끝내는 단위”로 리듬을 복원해 보세요.`,
  );
  overallLines.push(
    `- 오행 ${dominantElements.join('/') || '복합'} 쪽의 장점을 “반복 가능한 루틴”으로 만들면 운의 편차가 줄어듭니다.`,
  );

  overallLines.push('');
  overallLines.push('[다음 단계]');
  overallLines.push('- 금전/연애/건강/직장/사업은 “분야별 Q&A”에서 더 길게 확인할 수 있습니다.');
  overallLines.push('- 특정 연도/월을 지정하면, 그 시기의 흐름을 “연/월 운세”로 따로 볼 수 있습니다.');

  if (!yearLuck) {
    return { profile: profileLines.join('\n'), overallLuck: overallLines.join('\n') };
  }

  const yTenGod = yearLuck.tenGodToDayMaster;
  const yPillar = `${yearLuck.pillar.stem}${yearLuck.pillar.branch}`;
  const yTitle = `${yearLuck.solarYear}년 한해운(연운)`;

  const yearlyLines: string[] = [];
  yearlyLines.push(`[${yTitle}]`);
  yearlyLines.push(`- 연운: ${yPillar} / ${yTenGod} / 오행 ${yearLuck.element}`);
  yearlyLines.push(`- 올해 테마: ${TENGOD_TRAITS[yTenGod] ?? '역할 변화'}가 전면에 나타날 수 있습니다.`);
  yearlyLines.push(
    `- 균형 포인트: 연운 오행 ${yearLuck.element}과 기존 우세 오행(${dominantElements.join('/')})의 조합을 보면서 속도/리스크를 조절하세요.`,
  );
  yearlyLines.push('');
  yearlyLines.push('[올해를 읽는 실전 질문]');
  yearlyLines.push('- 올해는 무엇을 늘리고(강화), 무엇을 줄일지(정리)가 분명한가요?');
  yearlyLines.push(`- ${yTenGod} 테마가 커질 때, 내 시간표/관계/돈 흐름은 어떻게 바뀌나요?`);
  yearlyLines.push('');
  yearlyLines.push('[작게 적용해보기]');
  yearlyLines.push('- 월 단위 목표 1개 + 주 단위 체크 1개만 먼저 고정해 보세요. (과도한 계획보다 유지가 중요)');
  yearlyLines.push('- 큰 결정을 할 땐, 현금흐름/체력/관계 비용을 함께 계산해 보세요.');

  return {
    profile: profileLines.join('\n'),
    overallLuck: overallLines.join('\n'),
    yearlyLuck: yearlyLines.join('\n'),
  };
}
