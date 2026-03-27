import { UserError } from '../errors';

export interface ParsedDate {
  year: number;
  month: number;
  day: number;
}

export interface ParsedTime {
  hour: number;
  minute: number;
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^(\d{2}):(\d{2})$/;

export function parseDate(date: string): ParsedDate {
  const match = DATE_RE.exec(date);
  if (!match) {
    throw new UserError('INVALID_DATE', '날짜 형식은 YYYY-MM-DD 이어야 합니다.', { date });
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const dt = new Date(Date.UTC(year, month - 1, day));

  if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) {
    throw new UserError('INVALID_DATE', '유효하지 않은 날짜입니다.', { date });
  }

  return { year, month, day };
}

export function parseTime(time?: string): ParsedTime | undefined {
  if (!time) {
    return undefined;
  }

  const match = TIME_RE.exec(time);
  if (!match) {
    throw new UserError('INVALID_TIME', '시간 형식은 HH:mm 이어야 합니다.', { time });
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new UserError('INVALID_TIME', '시간 범위가 유효하지 않습니다.', { time });
  }

  return { hour, minute };
}

export function formatDate(date: ParsedDate): string {
  const month = String(date.month).padStart(2, '0');
  const day = String(date.day).padStart(2, '0');
  return `${date.year}-${month}-${day}`;
}

export function addDays(date: ParsedDate, delta: number): ParsedDate {
  const dt = new Date(Date.UTC(date.year, date.month - 1, date.day));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return {
    year: dt.getUTCFullYear(),
    month: dt.getUTCMonth() + 1,
    day: dt.getUTCDate(),
  };
}
