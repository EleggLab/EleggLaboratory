import vectors from './vectors/vectors.v1.json';
import { computeFourPillars } from '../src/chart/computeFourPillars';
import { computeSajuChart } from '../src/chart';
import type { BirthInput } from '../src/types';

interface VectorExpected {
  year: string;
  month: string;
  day: string;
  hour: string | null;
}

interface VectorRow {
  id: string;
  input: BirthInput;
  expected?: VectorExpected;
}

describe('computeFourPillars vectors', () => {
  it('matches frozen snapshot for 34 vectors', () => {
    const actual = (vectors as VectorRow[]).map((vector) => {
      const input = vector.input;
      const result = computeSajuChart(input);
      const { fourPillars, features, luck } = result;

      return {
        id: vector.id,
        input,
        pillars: {
          year: `${fourPillars.year.stem}${fourPillars.year.branch}`,
          month: `${fourPillars.month.stem}${fourPillars.month.branch}`,
          day: `${fourPillars.day.stem}${fourPillars.day.branch}`,
          hour: fourPillars.hour ? `${fourPillars.hour.stem}${fourPillars.hour.branch}` : null,
        },
        confidence: fourPillars.meta.confidence,
        elementModel: features.elementDistribution.currentModel,
        elementCounts: features.elementDistribution.counts,
        tenGodCount: features.tenGodCount,
        strength: features.strength,
        hourCandidates: features.hourCandidates,
        firstLuck: luck.cycles[0],
        firstAnnual: luck.annualCycles[0],
      };
    });

    expect(actual).toMatchSnapshot();
  });

  it('matches expected pillars embedded in vectors', () => {
    const mismatches = (vectors as VectorRow[])
      .filter((vector) => vector.expected)
      .map((vector) => {
        const result = computeSajuChart(vector.input);
        const actual = {
          year: `${result.fourPillars.year.stem}${result.fourPillars.year.branch}`,
          month: `${result.fourPillars.month.stem}${result.fourPillars.month.branch}`,
          day: `${result.fourPillars.day.stem}${result.fourPillars.day.branch}`,
          hour: result.fourPillars.hour
            ? `${result.fourPillars.hour.stem}${result.fourPillars.hour.branch}`
            : null,
        };

        return {
          id: vector.id,
          expected: vector.expected,
          actual,
          isMatch:
            vector.expected?.year === actual.year &&
            vector.expected?.month === actual.month &&
            vector.expected?.day === actual.day &&
            vector.expected?.hour === actual.hour,
        };
      })
      .filter((row) => !row.isMatch);

    expect(mismatches).toEqual([]);
  });

  it('applies jaSiBoundaryRule option at 23:xx', () => {
    const base: BirthInput = {
      calendar: 'solar',
      date: '2000-01-01',
      time: '23:30',
      timezone: 'Asia/Seoul',
    };

    const sameDay = computeFourPillars({
      ...base,
      options: { jaSiBoundaryRule: '23-01_sameDay' },
    });
    const nextDay = computeFourPillars({
      ...base,
      options: { jaSiBoundaryRule: '23-01_nextDay' },
    });

    expect(`${sameDay.day.stem}${sameDay.day.branch}`).not.toBe(
      `${nextDay.day.stem}${nextDay.day.branch}`,
    );
  });

  it('supports configurable jaSi boundary hour', () => {
    const base: BirthInput = {
      calendar: 'solar',
      date: '2000-01-01',
      time: '23:30',
      timezone: 'Asia/Seoul',
      options: { jaSiBoundaryRule: 'configurable' },
    };

    const hour23 = computeFourPillars({
      ...base,
      options: {
        ...base.options,
        jaSiBoundaryHour: 23,
      },
    });

    const hour00 = computeFourPillars({
      ...base,
      options: {
        ...base.options,
        jaSiBoundaryHour: 0,
      },
    });

    expect(`${hour23.day.stem}${hour23.day.branch}`).not.toBe(`${hour00.day.stem}${hour00.day.branch}`);
  });

  it('changes year pillar by rule near ipchun/lunar-new-year window', () => {
    const base: BirthInput = {
      calendar: 'solar',
      date: '2024-02-05',
      time: '12:00',
      timezone: 'Asia/Seoul',
    };

    const ipchun = computeFourPillars({
      ...base,
      options: { yearPillarRule: 'ipchun' },
    });
    const lunarNewYear = computeFourPillars({
      ...base,
      options: { yearPillarRule: 'lunarNewYear' },
    });

    expect(`${ipchun.year.stem}${ipchun.year.branch}`).not.toBe(
      `${lunarNewYear.year.stem}${lunarNewYear.year.branch}`,
    );
  });

  it('applies custom year boundary', () => {
    const custom = computeFourPillars({
      calendar: 'solar',
      date: '2024-01-10',
      time: '12:00',
      timezone: 'Asia/Seoul',
      options: {
        yearPillarRule: 'custom',
        customYearBoundary: { month: 1, day: 15 },
      },
    });

    const defaultCustom = computeFourPillars({
      calendar: 'solar',
      date: '2024-01-10',
      time: '12:00',
      timezone: 'Asia/Seoul',
      options: {
        yearPillarRule: 'custom',
        customYearBoundary: { month: 1, day: 1 },
      },
    });

    expect(`${custom.year.stem}${custom.year.branch}`).not.toBe(`${defaultCustom.year.stem}${defaultCustom.year.branch}`);
  });

  it('supports optional local solar time correction by longitude', () => {
    const base: BirthInput = {
      calendar: 'solar',
      date: '2000-01-02',
      time: '00:10',
      timezone: 'Asia/Seoul',
      location: { lat: 37.5665, lon: 120 },
    };

    const normal = computeFourPillars({
      ...base,
      options: { applyLocalSolarTimeCorrection: false },
    });

    const corrected = computeFourPillars({
      ...base,
      options: { applyLocalSolarTimeCorrection: true },
    });

    const normalDay = `${normal.day.stem}${normal.day.branch}`;
    const correctedDay = `${corrected.day.stem}${corrected.day.branch}`;
    const normalHour = normal.hour ? `${normal.hour.stem}${normal.hour.branch}` : 'none';
    const correctedHour = corrected.hour ? `${corrected.hour.stem}${corrected.hour.branch}` : 'none';

    expect(normalDay !== correctedDay || normalHour !== correctedHour).toBe(true);
    expect(corrected.meta.notes.some((note) => note.includes('태양시 보정'))).toBe(true);
  });
});
