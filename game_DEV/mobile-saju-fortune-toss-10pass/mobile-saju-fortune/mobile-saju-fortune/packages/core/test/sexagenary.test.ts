import { getSexagenaryByIndex, getSexagenaryList, getYearPillarBySolarYear, shiftPillar } from '../src/ganji/sexagenary';

describe('sexagenary cycle', () => {
  it('contains 60 unique pillars', () => {
    const list = getSexagenaryList();
    expect(list).toHaveLength(60);
    expect(new Set(list).size).toBe(60);
  });

  it('wraps correctly on 60-step shift', () => {
    expect(shiftPillar('갑자', 60)).toBe('갑자');
    expect(getSexagenaryByIndex(0)).toBe('갑자');
    expect(getSexagenaryByIndex(59)).toBe('계해');
  });

  it('maps known years', () => {
    expect(getYearPillarBySolarYear(1984)).toBe('갑자');
    expect(getYearPillarBySolarYear(2024)).toBe('갑진');
    expect(getYearPillarBySolarYear(2023)).toBe('계묘');
  });
});
