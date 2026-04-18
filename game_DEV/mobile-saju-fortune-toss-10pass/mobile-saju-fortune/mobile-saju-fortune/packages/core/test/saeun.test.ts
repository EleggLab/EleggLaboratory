import { computeFourPillars } from '../src/chart/computeFourPillars';
import { computeSaeunCycles, computeSaeunForYear } from '../src/luck/saeun';

describe('saeun', () => {
  it('returns deterministic annual cycles from configured start year', () => {
    const fourPillars = computeFourPillars({
      calendar: 'solar',
      date: '1992-10-24',
      time: '05:30',
      timezone: 'Asia/Seoul',
    });

    const annual = computeSaeunCycles(fourPillars, { startYear: 2024, count: 3 });

    expect(annual).toHaveLength(3);
    expect(annual[0]?.solarYear).toBe(2024);
    expect(`${annual[0]?.pillar.stem}${annual[0]?.pillar.branch}`).toBe('갑진');
    expect(annual[2]?.solarYear).toBe(2026);
  });

  it('computes a single designated year cycle', () => {
    const fourPillars = computeFourPillars({
      calendar: 'solar',
      date: '1992-10-24',
      time: '05:30',
      timezone: 'Asia/Seoul',
    });

    const yearLuck = computeSaeunForYear(fourPillars, 2030);

    expect(yearLuck.solarYear).toBe(2030);
    expect(`${yearLuck.pillar.stem}${yearLuck.pillar.branch}`).toBe('경술');
    expect(yearLuck.tenGodToDayMaster).toBeDefined();
  });
});
