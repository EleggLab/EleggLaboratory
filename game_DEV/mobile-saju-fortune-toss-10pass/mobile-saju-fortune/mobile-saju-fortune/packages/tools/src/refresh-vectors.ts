import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { computeSajuChart } from '@saju/core';

type VectorInput = Parameters<typeof computeSajuChart>[0];

interface VectorRow {
  id: string;
  input: VectorInput;
  notes?: string[];
  expected?: {
    year: string;
    month: string;
    day: string;
    hour: string | null;
  };
}

function formatPillar(stem: string, branch: string): string {
  return `${stem}${branch}`;
}

function main(): void {
  const vectorPath = join(process.cwd(), '..', 'core', 'test', 'vectors', 'vectors.v1.json');
  const vectors = JSON.parse(readFileSync(vectorPath, 'utf8')) as VectorRow[];

  const updated = vectors.map((row) => {
    const chart = computeSajuChart(row.input);
    const expected = {
      year: formatPillar(chart.fourPillars.year.stem, chart.fourPillars.year.branch),
      month: formatPillar(chart.fourPillars.month.stem, chart.fourPillars.month.branch),
      day: formatPillar(chart.fourPillars.day.stem, chart.fourPillars.day.branch),
      hour: chart.fourPillars.hour
        ? formatPillar(chart.fourPillars.hour.stem, chart.fourPillars.hour.branch)
        : null,
    };

    return {
      ...row,
      expected,
    };
  });

  writeFileSync(vectorPath, `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
  console.log(`updated vectors with expected pillars: ${updated.length}`);
}

main();
