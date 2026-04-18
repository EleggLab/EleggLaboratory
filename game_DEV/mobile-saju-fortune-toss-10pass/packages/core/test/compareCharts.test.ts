import { compareCharts } from '../src/chart/compareCharts';

describe('compareCharts', () => {
  it('returns element gaps and day master relation', () => {
    const result = compareCharts(
      {
        calendar: 'solar',
        date: '1992-10-24',
        time: '05:30',
        timezone: 'Asia/Seoul',
      },
      {
        calendar: 'solar',
        date: '1995-03-11',
        time: '21:10',
        timezone: 'Asia/Seoul',
      },
    );

    expect(result.comparison.dayMasterRelation).toBeTruthy();
    expect(result.comparison.elementGap).toEqual(
      expect.objectContaining({ 목: expect.any(Number), 화: expect.any(Number) }),
    );
    expect(result.comparison.notes.length).toBeGreaterThan(0);
  });
});
