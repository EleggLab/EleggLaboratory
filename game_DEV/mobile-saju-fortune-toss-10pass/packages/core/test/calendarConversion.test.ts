import { convertLunarToSolar, convertSolarToLunar } from '../src/calendar/conversion';

describe('calendar conversion', () => {
  it('maps known Korean lunar new year date', () => {
    const lunar = convertSolarToLunar(2024, 2, 10);
    expect(lunar).toEqual({
      year: 2024,
      month: 1,
      day: 1,
      isLeapMonth: false,
    });
  });

  it('supports leap month conversion', () => {
    const solar = convertLunarToSolar(2020, 4, 1, true);
    expect(solar).toEqual({ year: 2020, month: 5, day: 23 });

    const lunarBack = convertSolarToLunar(2020, 5, 23);
    expect(lunarBack).toEqual({
      year: 2020,
      month: 4,
      day: 1,
      isLeapMonth: true,
    });
  });
});
