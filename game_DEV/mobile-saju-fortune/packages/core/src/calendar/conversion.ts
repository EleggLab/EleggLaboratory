import KoreanLunarCalendar from 'korean-lunar-calendar';

export interface SolarDate {
  year: number;
  month: number;
  day: number;
}

export interface LunarDate {
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
}

export function convertSolarToLunar(year: number, month: number, day: number): LunarDate {
  const calendar = new KoreanLunarCalendar();
  const ok = calendar.setSolarDate(year, month, day);
  if (!ok) {
    throw new Error(`Failed to convert solar date: ${year}-${month}-${day}`);
  }

  const lunar = calendar.getLunarCalendar();
  return {
    year: lunar.year,
    month: lunar.month,
    day: lunar.day,
    isLeapMonth: lunar.intercalation === true,
  };
}

export function convertLunarToSolar(
  year: number,
  month: number,
  day: number,
  isLeapMonth: boolean,
): SolarDate {
  const calendar = new KoreanLunarCalendar();
  const ok = calendar.setLunarDate(year, month, day, isLeapMonth);
  if (!ok) {
    throw new Error(`Failed to convert lunar date: ${year}-${month}-${day} leap=${isLeapMonth}`);
  }

  const solar = calendar.getSolarCalendar();
  return {
    year: solar.year,
    month: solar.month,
    day: solar.day,
  };
}
