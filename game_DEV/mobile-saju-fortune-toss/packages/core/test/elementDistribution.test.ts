import { computeSajuChart } from '../src/chart';

describe('element distribution model', () => {
  it('supports stems_only model explicitly', () => {
    const result = computeSajuChart({
      calendar: 'solar',
      date: '1992-10-24',
      time: '05:30',
      timezone: 'Asia/Seoul',
      options: {
        elementDistributionModel: 'stems_only',
        includeHiddenStems: true,
      },
    });

    expect(result.features.elementDistribution.currentModel).toBe('stems_only');
    expect(result.features.elementDistribution.counts).toEqual(result.features.elementDistribution.breakdown.stems);
  });
});
