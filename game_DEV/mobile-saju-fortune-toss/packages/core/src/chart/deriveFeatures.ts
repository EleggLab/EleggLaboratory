import type {
  Branch,
  DerivedFeatures,
  Element,
  ElementCount,
  ElementDistributionModel,
  FourPillars,
  StrengthAnalysis,
  TenGodCount,
} from '../types';
import { BRANCH_TO_ELEMENT, CONTROLS, GENERATES } from '../ganji/constants';
import { detectRelations } from '../ganji/relations';
import { getTenGod } from '../ganji/tenGods';
import { getHourCandidateListFromDayPillar } from './computeFourPillars';

function emptyElementCount(): ElementCount {
  return { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
}

function emptyTenGodCount(): TenGodCount {
  return {
    비견: 0,
    겁재: 0,
    식신: 0,
    상관: 0,
    편재: 0,
    정재: 0,
    편관: 0,
    정관: 0,
    편인: 0,
    정인: 0,
  };
}

function addElement(target: ElementCount, element: Element, amount = 1): void {
  target[element] += amount;
}

function normalizeElementCount(target: ElementCount): ElementCount {
  return {
    목: Number(target.목.toFixed(3)),
    화: Number(target.화.toFixed(3)),
    토: Number(target.토.toFixed(3)),
    금: Number(target.금.toFixed(3)),
    수: Number(target.수.toFixed(3)),
  };
}

function computeStrength(
  fourPillars: FourPillars,
  supportCount: number,
  controlCount: number,
): StrengthAnalysis {
  const model = fourPillars.meta.ruleVersion.strengthModel;
  const dayElement = fourPillars.day.stemElement;
  const monthElement = fourPillars.month.branchElementPrimary;

  if (model === 'simple') {
    const supportElement = GENERATES[dayElement];
    const isSupported = monthElement === dayElement || monthElement === supportElement;
    const level = isSupported ? '강' : supportCount >= controlCount ? '중' : '약';
    const reasons = [
      `월지 오행(${monthElement})과 일간 오행(${dayElement}) 관계`,
      `비겁/인성 계열 지지 ${supportCount}건`,
      `관성/재성 압력 ${controlCount}건`,
    ];
    return { model, level, reasons };
  }

  let score = 50;
  const reasons: string[] = [];
  const resource = GENERATES[dayElement];
  const controlledBy = Object.entries(CONTROLS).find(([, value]) => value === dayElement)?.[0] as
    | Element
    | undefined;

  if (monthElement === dayElement) {
    score += 20;
    reasons.push('월지가 일간과 동일 오행으로 통근 보강');
  } else if (monthElement === resource) {
    score += 14;
    reasons.push('월지가 일간을 생하는 오행');
  } else if (controlledBy && monthElement === controlledBy) {
    score -= 14;
    reasons.push('월지가 일간을 극하는 오행');
  }

  score += supportCount * 6;
  score -= controlCount * 5;

  const bounded = Math.max(0, Math.min(100, score));
  const level = bounded >= 62 ? '강' : bounded >= 44 ? '중' : '약';

  reasons.push(`비겁/인성 가산 ${supportCount * 6}점`);
  reasons.push(`관성/재성 감산 ${controlCount * 5}점`);

  return { model, level, score: bounded, reasons };
}

function topElements(counts: ElementCount): Element[] {
  return (Object.entries(counts) as Array<[Element, number]>).sort((a, b) => b[1] - a[1]).map(([k]) => k);
}

function resolveElementDistributionModel(fourPillars: FourPillars): ElementDistributionModel {
  const configured = fourPillars.meta.input.options?.elementDistributionModel;
  if (configured) {
    return configured;
  }

  const includeHidden = fourPillars.meta.input.options?.includeHiddenStems ?? true;
  return includeHidden ? 'stems_branches_hidden' : 'stems_branches';
}

export function deriveFeatures(fourPillars: FourPillars): DerivedFeatures {
  const pillars = [fourPillars.year, fourPillars.month, fourPillars.day, fourPillars.hour].filter(
    Boolean,
  ) as NonNullable<FourPillars['hour']>[];

  const stemsCount = emptyElementCount();
  const branchesCount = emptyElementCount();
  const hiddenCount = emptyElementCount();

  const dayMaster = fourPillars.day.stem;
  const dayElement = fourPillars.day.stemElement;
  const supportElement = GENERATES[dayElement];
  const controlledBy = Object.entries(CONTROLS).find(([, value]) => value === dayElement)?.[0] as
    | Element
    | undefined;

  const tenGodCount = emptyTenGodCount();
  let supportCount = 0;
  let controlCount = 0;

  for (const pillar of pillars) {
    addElement(stemsCount, pillar.stemElement, 1);
    addElement(branchesCount, BRANCH_TO_ELEMENT[pillar.branch], 1);

    const tg = getTenGod(dayMaster, pillar.stem);
    tenGodCount[tg] += 1;

    if (pillar.stemElement === dayElement || pillar.stemElement === supportElement) {
      supportCount += 1;
    }
    if (controlledBy && pillar.stemElement === controlledBy) {
      controlCount += 1;
    }

    for (const hidden of pillar.hiddenStems ?? []) {
      addElement(hiddenCount, hidden.element, hidden.weight ?? 1);
      const hiddenTenGod = getTenGod(dayMaster, hidden.stem);
      tenGodCount[hiddenTenGod] += hidden.weight ?? 1;

      if (hidden.element === dayElement || hidden.element === supportElement) {
        supportCount += hidden.weight ?? 1;
      }
      if (controlledBy && hidden.element === controlledBy) {
        controlCount += hidden.weight ?? 1;
      }
    }
  }

  const currentModel = resolveElementDistributionModel(fourPillars);

  const counts = emptyElementCount();
  for (const element of ['목', '화', '토', '금', '수'] as Element[]) {
    if (currentModel === 'stems_only') {
      counts[element] = stemsCount[element];
      continue;
    }

    if (currentModel === 'stems_branches') {
      counts[element] = stemsCount[element] + branchesCount[element];
      continue;
    }

    counts[element] = stemsCount[element] + branchesCount[element] + hiddenCount[element];
  }

  const relations = detectRelations(
    pillars.map((pillar) => pillar.branch as Branch),
    pillars.map((pillar) => pillar.stem),
  );

  const strength = computeStrength(fourPillars, supportCount, controlCount);
  const sortedElements = topElements(counts);

  const keyTags: string[] = [
    `일간 ${dayMaster}${dayElement}`,
    `강약 ${strength.level}`,
    `우세 오행 ${sortedElements.slice(0, 2).join('/')}`,
  ];

  if (relations.some((item) => item.kind === 'clash')) {
    keyTags.push('충 관계 존재');
  }

  const result: DerivedFeatures = {
    dayMaster,
    dayPillar: `${fourPillars.day.stem}${fourPillars.day.branch}`,
    tenGodCount,
    elementDistribution: {
      currentModel,
      counts: normalizeElementCount(counts),
      breakdown: {
        stems: normalizeElementCount(stemsCount),
        branches: normalizeElementCount(branchesCount),
        hiddenStems: normalizeElementCount(hiddenCount),
      },
    },
    relations,
    strength,
    keyTags,
  };

  if (!fourPillars.hour) {
    result.hourCandidates = getHourCandidateListFromDayPillar(result.dayPillar);
  }

  return result;
}
