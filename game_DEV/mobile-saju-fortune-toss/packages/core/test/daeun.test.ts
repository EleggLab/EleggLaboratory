import { computeFourPillars } from '../src/chart/computeFourPillars';
import { computeDaeunCycles } from '../src/luck/daeun';

describe('daeun', () => {
  it('returns 8 cycles with 10-year ranges by default', () => {
    const fourPillars = computeFourPillars({
      calendar: 'solar',
      date: '1992-10-24',
      time: '05:30',
      gender: 'male',
      timezone: 'Asia/Seoul',
    });

    const luck = computeDaeunCycles(fourPillars);

    expect(luck.computedBy).toBe('simple');
    expect(luck.cycles).toHaveLength(8);
    expect(luck.cycles[0]?.startAge).toBe(7);
    expect(luck.cycles[0]?.endAge).toBe(16.9);
  });

  it('supports custom start age', () => {
    const fourPillars = computeFourPillars({
      calendar: 'solar',
      date: '1992-10-24',
      time: '05:30',
      gender: 'female',
      options: { luckStartAge: 4 },
      timezone: 'Asia/Seoul',
    });

    const luck = computeDaeunCycles(fourPillars);
    expect(luck.startAge).toBe(4);
    expect(luck.cycles[0]?.startAge).toBe(4);
  });

  it('computes advanced_v1 start age from solar terms', () => {
    const fourPillars = computeFourPillars({
      calendar: 'solar',
      date: '1992-10-24',
      time: '05:30',
      gender: 'male',
      timezone: 'Asia/Seoul',
      options: {
        luckComputationModel: 'advanced_v1',
      },
    });

    const luck = computeDaeunCycles(fourPillars);
    expect(luck.computedBy).toBe('advanced_v1');
    expect(luck.startAge).toBeGreaterThan(0);
    expect(luck.startAge).toBeLessThan(20);
  });
});
