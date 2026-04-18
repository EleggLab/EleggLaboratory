import { describe, expect, it } from 'vitest';
import { computeSajuChart, computeSaeunForYear } from '@saju/core';
import { buildNarrative } from '@saju/core';

describe('buildNarrative', () => {
  it('returns profile and overall summary', () => {
    const chart = computeSajuChart({
      calendar: 'solar',
      date: '1992-10-24',
      time: '05:30',
      timezone: 'Asia/Seoul',
    });

    const narrative = buildNarrative(chart);
    expect(narrative.profile).toContain('일주');
    expect(narrative.overallLuck).toContain('대운');
    expect(narrative.yearlyLuck).toBeUndefined();
  });

  it('includes yearly summary when year cycle exists', () => {
    const chart = computeSajuChart({
      calendar: 'solar',
      date: '1992-10-24',
      time: '05:30',
      timezone: 'Asia/Seoul',
    });
    const cycle = computeSaeunForYear(chart.fourPillars, 2030);
    const narrative = buildNarrative(chart, cycle);

    expect(narrative.yearlyLuck).toContain('2030년');
  });
});
