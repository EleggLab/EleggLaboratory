import type { AnnualLuckCycle, SajuChartResult } from '@saju/core';

const ELEMENT_TRAITS: Record<string, string> = {
  목: '성장과 확장, 기획/개척 성향',
  화: '표현과 추진, 에너지 발산 성향',
  토: '안정과 조율, 운영/관리 성향',
  금: '정리와 결단, 기준/품질 성향',
  수: '유연과 탐구, 정보/분석 성향',
};

const TENGOD_TRAITS: Record<string, string> = {
  비견: '자기주도성과 독립성',
  겁재: '경쟁/협업에서의 추진력',
  식신: '꾸준한 생산성과 실행력',
  상관: '표현력과 문제제기 능력',
  편재: '기회 포착과 자원 운용',
  정재: '안정적 재무/실무 운영',
  편관: '도전 과제 대응력',
  정관: '책임감과 구조화 능력',
  편인: '직관과 빠른 학습',
  정인: '지식 축적과 지원 역량',
};

interface NarrativeResult {
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

function formatPillar(stem?: string, branch?: string): string {
  if (!stem || !branch) {
    return '미정';
  }
  return `${stem}${branch}`;
}

function gradeByAvg(value: number, avg: number): '높음' | '보통' | '낮음' {
  if (!Number.isFinite(value) || !Number.isFinite(avg) || avg <= 0) {
    return '보통';
  }
  if (value >= avg * 1.2) return '높음';
  if (value <= avg * 0.8) return '낮음';
  return '보통';
}

export function buildNarrative(
  result: SajuChartResult,
  yearLuck?: AnnualLuckCycle | null,
): NarrativeResult {
  const dayPillar = result.features.dayPillar;
  const dayMasterElement = result.fourPillars.day.stemElement;
  const strength = result.features.strength.level;
  const [dominantTenGod, dominantTenGodValue] = topTenGod(result);
  const dominantElements = topElements(result);

  const counts = result.features.tenGodCount;
  const peer = (counts.비견 ?? 0) + (counts.겁재 ?? 0);
  const output = (counts.식신 ?? 0) + (counts.상관 ?? 0);
  const wealth = (counts.정재 ?? 0) + (counts.편재 ?? 0);
  const power = (counts.정관 ?? 0) + (counts.편관 ?? 0);
  const resource = (counts.정인 ?? 0) + (counts.편인 ?? 0);

  const groupValues = [peer, output, wealth, power, resource].map((v) => (Number.isFinite(v) ? v : 0));
  const groupAvg = groupValues.reduce((acc, v) => acc + v, 0) / 5;

  const peerGrade = gradeByAvg(peer, groupAvg);
  const outputGrade = gradeByAvg(output, groupAvg);
  const wealthGrade = gradeByAvg(wealth, groupAvg);
  const powerGrade = gradeByAvg(power, groupAvg);
  const resourceGrade = gradeByAvg(resource, groupAvg);

  const elementSorted = Object.entries(result.features.elementDistribution.counts).sort((a, b) => b[1] - a[1]);
  const elementDominant = elementSorted
    .slice(0, 2)
    .filter(([, v]) => v > 0)
    .map(([k]) => k);
  const elementLacking = elementSorted
    .slice(-2)
    .filter(([, v]) => v <= 1)
    .map(([k]) => k);

  const yearPillar = formatPillar(result.fourPillars.year.stem, result.fourPillars.year.branch);
  const monthPillar = formatPillar(result.fourPillars.month.stem, result.fourPillars.month.branch);
  const hourPillar = result.fourPillars.hour
    ? formatPillar(result.fourPillars.hour.stem, result.fourPillars.hour.branch)
    : '미정';

  const hourConfidence = result.fourPillars.meta.confidence.hourPillar;
  const hourNote =
    hourConfidence === 'low'
      ? '시간 미상/경계로 인해 시주 관련 내용은 변동 가능성이 큽니다.'
      : hourConfidence === 'medium'
        ? '시주 경계 규칙/입력 오차에 따라 시주 관련 일부 포인트가 달라질 수 있습니다.'
        : null;

  const topTenGods = Object.entries(result.features.tenGodCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, value]) => `${name} ${Number.isFinite(value) ? value.toFixed(2) : String(value)}`);

  const relations = result.features.relations.slice(0, 5).map((hit) => {
    const label = hit.labels?.[0] ?? hit.kind;
    return `${label}: ${hit.matched.join('·')}`;
  });

  const profileLines: string[] = [];
  const keyTags = result.features.keyTags.slice(0, 6);
  profileLines.push(
    `요약: ${dayPillar} 일주, ${dayMasterElement} 기질을 바탕으로 ${dominantTenGod} 테마가 두드러질 수 있는 구조입니다.`,
  );
  if (keyTags.length > 0) {
    profileLines.push(`키워드: ${keyTags.join(', ')}`);
  }
  profileLines.push('');
  profileLines.push('[계산 사실(변하지 않는 값)]');
  profileLines.push(`- 사주: 년주 ${yearPillar} / 월주 ${monthPillar} / 일주 ${dayPillar} / 시주 ${hourPillar}`);
  profileLines.push(`- 일간(나의 기준): ${result.features.dayMaster} (${dayMasterElement})`);
  profileLines.push(`- 강약: ${strength}`);
  profileLines.push(
    `- 오행(현재 집계 기준): 우세 ${elementDominant.join(', ') || '없음'} / 보완 ${elementLacking.join(', ') || '없음'}`,
  );
  profileLines.push(`- 십성 상위: ${topTenGods.join(' · ')}`);
  if (hourNote) {
    profileLines.push(`- 참고: ${hourNote}`);
  }

  profileLines.push('');
  profileLines.push('[성향 요약(오행·십성 기반)]');
  profileLines.push(
    `- 일간 오행 ${dayMasterElement}: ${ELEMENT_TRAITS[dayMasterElement] ?? '복합 성향'}이 기본 결로 깔립니다.`,
  );
  profileLines.push(
    `- 십성 최상위 ${dominantTenGod}(${dominantTenGodValue.toFixed?.(2) ?? dominantTenGodValue}): ${
      TENGOD_TRAITS[dominantTenGod] ?? '복합 성향'
    } 쪽의 습관이 강하게 나타날 수 있습니다.`,
  );
  profileLines.push(
    `- 그룹 밸런스: 비겁(${peerGrade}) · 식상(${outputGrade}) · 재성(${wealthGrade}) · 관성(${powerGrade}) · 인성(${resourceGrade})`,
  );

  profileLines.push('');
  profileLines.push('[읽는 방법(흥미 포인트)]');
  profileLines.push('- 사주는 "성향"을 보여주는 지도이고, 운은 "환경의 테마"에 가깝습니다.');
  profileLines.push('- 같은 구조라도 선택과 환경에 따라 결과는 크게 달라질 수 있습니다.');

  const firstLuck = result.luck.cycles[0];
  const secondLuck = result.luck.cycles[1];
  const thirdLuck = result.luck.cycles[2];
  const overallLines: string[] = [];
  overallLines.push('[대운 흐름(10년 단위, 테마 보기)]');
  overallLines.push(
    firstLuck
      ? `- 1) ${firstLuck.startAge}~${firstLuck.endAge}세: ${firstLuck.pillar.stem}${firstLuck.pillar.branch} · ${firstLuck.tenGodToDayMaster}`
      : '- 1) 대운 정보가 없습니다.',
  );
  overallLines.push(
    secondLuck
      ? `- 2) ${secondLuck.startAge}~${secondLuck.endAge}세: ${secondLuck.pillar.stem}${secondLuck.pillar.branch} · ${secondLuck.tenGodToDayMaster}`
      : '- 2) 대운 정보가 없습니다.',
  );
  if (thirdLuck) {
    overallLines.push(
      `- 3) ${thirdLuck.startAge}~${thirdLuck.endAge}세: ${thirdLuck.pillar.stem}${thirdLuck.pillar.branch} · ${thirdLuck.tenGodToDayMaster}`,
    );
  }

  overallLines.push('');
  overallLines.push('[종합 운(전반적인 흐름 정리)]');
  overallLines.push(
    `- 우세 오행 축은 ${dominantElements.join('/')}이며, 이 축의 장점(속도/정리/표현/운영/탐구 등)을 "반복 가능한 루틴"으로 만들 때 성과의 편차가 줄어듭니다.`,
  );
  overallLines.push(
    `- 강약이 ${strength}일 때는 ${
      strength === '강'
        ? '속도를 내기 쉽지만, 과속하면 주변과 충돌하거나 피로가 누적될 수 있습니다.'
        : strength === '약'
          ? '환경/사람/리듬의 영향을 많이 받기 쉬워, 과부하가 오기 전에 회복 루틴을 확보하는 편이 안전합니다.'
          : '상황 적응력이 좋은 편이지만, 목표가 분산되면 힘이 흩어질 수 있습니다.'
    }`,
  );
  overallLines.push(
    `- 십성 관점으로는 ${dominantTenGod} 테마(${TENGOD_TRAITS[dominantTenGod] ?? '복합'})가 기본 작동 방식이 되기 쉬우니, "내가 어떤 방식으로 일을/관계를 굴리는지"를 관찰하면 이해가 빨라집니다.`,
  );

  overallLines.push('');
  overallLines.push('[실천 팁(현실적 적용)]');
  overallLines.push(
    `- 비겁(${peerGrade})이 높게 나오면: 동업/친구/가족 돈 흐름에서 기준을 먼저 정하고, 역할·정산을 문서로 남기면 안전합니다.`,
  );
  overallLines.push(
    `- 식상(${outputGrade})이 높게 나오면: 기술/콘텐츠/성과를 "쌓아서 보이는 구조"로 만들면 유리합니다. (루틴+포트폴리오)`,
  );
  overallLines.push(
    `- 관성(${powerGrade})이 높게 나오면: 책임/규칙이 늘어날 때 성과가 나기 쉬우나, 과도한 부담은 번아웃으로 이어질 수 있어 리듬 관리가 중요합니다.`,
  );
  overallLines.push(
    `- 인성(${resourceGrade})이 높게 나오면: 공부/정리/기획이 강점이 될 수 있고, 반대로 실행이 느려질 땐 작은 실험을 먼저 설계해 보세요.`,
  );
  overallLines.push(
    `- 재성(${wealthGrade})이 높게 나오면: 거래·자원·기회 감각이 강해질 수 있으니, 손익·현금흐름·리스크 한도를 수치로 관리하면 안정적입니다.`,
  );

  if (relations.length > 0) {
    overallLines.push('');
    overallLines.push('[관계 포인트(합/충 등, 참고)]');
    for (const line of relations) {
      overallLines.push(`- ${line}`);
    }
  }

  overallLines.push('');
  overallLines.push('[다음 단계]');
  overallLines.push('- 궁금한 분야(금전/연애/직장/사업 등)는 "분야별 Q&A" 탭에서 더 길게 확인할 수 있습니다.');

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
