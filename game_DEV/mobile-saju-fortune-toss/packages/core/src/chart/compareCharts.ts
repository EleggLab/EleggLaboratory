import { getTenGod } from '../ganji/tenGods';
import type { BirthInput, CompareChartsResult, Element, ElementCount } from '../types';
import { computeSajuChart } from './index';

function topElements(counts: ElementCount): Element[] {
  return (Object.entries(counts) as Array<[Element, number]>)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([element]) => element);
}

function computeElementGap(a: ElementCount, b: ElementCount): ElementCount {
  return {
    목: Number((a.목 - b.목).toFixed(3)),
    화: Number((a.화 - b.화).toFixed(3)),
    토: Number((a.토 - b.토).toFixed(3)),
    금: Number((a.금 - b.금).toFixed(3)),
    수: Number((a.수 - b.수).toFixed(3)),
  };
}

export function compareCharts(aInput: BirthInput, bInput: BirthInput): CompareChartsResult {
  const a = computeSajuChart(aInput);
  const b = computeSajuChart(bInput);

  const aDayMaster = a.fourPillars.day.stem;
  const bDayMaster = b.fourPillars.day.stem;
  const dayMasterRelation = getTenGod(aDayMaster, bDayMaster);

  const aElements = a.features.elementDistribution.counts;
  const bElements = b.features.elementDistribution.counts;
  const notes: string[] = [];

  if (aDayMaster === bDayMaster) {
    notes.push('두 차트의 일간이 동일합니다.');
  } else {
    notes.push(`A 기준 B 일간의 십성 관계는 ${dayMasterRelation}입니다.`);
  }

  notes.push(`A 우세 오행: ${topElements(aElements).join('/')}`);
  notes.push(`B 우세 오행: ${topElements(bElements).join('/')}`);

  return {
    a,
    b,
    comparison: {
      sameDayMaster: aDayMaster === bDayMaster,
      dayMasterRelation,
      dominantElements: {
        a: topElements(aElements),
        b: topElements(bElements),
      },
      elementGap: computeElementGap(aElements, bElements),
      notes,
    },
  };
}
