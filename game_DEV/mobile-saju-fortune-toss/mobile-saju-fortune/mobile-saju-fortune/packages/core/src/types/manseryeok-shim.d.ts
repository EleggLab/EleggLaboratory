declare module 'manseryeok/dist/index.js' {
  export interface BirthInfo {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    isLunar?: boolean;
    isLeapMonth?: boolean;
  }

  export interface FourPillarsDetail {
    yearString: string;
    monthString: string;
    dayString: string;
    hourString: string;
  }

  export function calculateFourPillars(input: BirthInfo): FourPillarsDetail;
  export function solarToLunar(
    year: number,
    month: number,
    day: number,
  ): { year: number; month: number; day: number; isLeapMonth: boolean };
  export function lunarToSolar(
    year: number,
    month: number,
    day: number,
    isLeapMonth: boolean,
  ): { year: number; month: number; day: number };
}
