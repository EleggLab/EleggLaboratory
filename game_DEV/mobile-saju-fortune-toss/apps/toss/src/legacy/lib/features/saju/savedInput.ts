import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BirthInput } from '@saju/core';

export type CalendarType = 'solar' | 'lunar';

export const SAJU_INPUT_STORAGE_KEY = 'saju:birth-input:v1';
export const SAJU_INPUT_MAX = 10;

export interface SavedSajuInput {
  id: string;
  createdAtISO: string;
  calendar: CalendarType;
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  birthHour: string;
  birthMinute: string;
  isLeapMonth: boolean;
  gender: BirthInput['gender'];
  yearRuleIpchun: boolean;
  jaSiNextDay: boolean;
}

export type SavedSajuPayload = Omit<SavedSajuInput, 'id' | 'createdAtISO'>;

export function onlyDigits(value: string, maxLen: number): string {
  return value.replace(/\D/g, '').slice(0, maxLen);
}

export function safeInt(value: string, min: number, max: number): number | null {
  const n = Number(value);
  if (!Number.isInteger(n)) return null;
  if (n < min || n > max) return null;
  return n;
}

export function normalizeSavedInput(parsed: unknown): SavedSajuInput | null {
  if (!parsed || typeof parsed !== 'object') return null;
  const safe = parsed as Partial<SavedSajuInput>;
  if (safe.calendar !== 'solar' && safe.calendar !== 'lunar') return null;

  return {
    id: typeof safe.id === 'string' && safe.id.length > 0 ? safe.id : `legacy-${Date.now()}-${Math.random()}`,
    createdAtISO:
      typeof safe.createdAtISO === 'string' && safe.createdAtISO.length > 0
        ? safe.createdAtISO
        : new Date().toISOString(),
    calendar: safe.calendar,
    birthYear: typeof safe.birthYear === 'string' ? onlyDigits(safe.birthYear, 4) : '',
    birthMonth: typeof safe.birthMonth === 'string' ? onlyDigits(safe.birthMonth, 2) : '',
    birthDay: typeof safe.birthDay === 'string' ? onlyDigits(safe.birthDay, 2) : '',
    birthHour: typeof safe.birthHour === 'string' ? onlyDigits(safe.birthHour, 2) : '',
    birthMinute: typeof safe.birthMinute === 'string' ? onlyDigits(safe.birthMinute, 2) : '',
    isLeapMonth: Boolean(safe.isLeapMonth),
    gender:
      safe.gender === 'male' ||
      safe.gender === 'female' ||
      safe.gender === 'other' ||
      safe.gender === 'unknown'
        ? safe.gender
        : 'unknown',
    yearRuleIpchun: typeof safe.yearRuleIpchun === 'boolean' ? safe.yearRuleIpchun : true,
    jaSiNextDay: typeof safe.jaSiNextDay === 'boolean' ? safe.jaSiNextDay : true,
  };
}

export function formatSavedInputSummary(saved: SavedSajuInput): string {
  const date = `${saved.birthYear || '----'}-${(saved.birthMonth || '--').padStart(2, '0')}-${(saved.birthDay || '--').padStart(2, '0')}`;
  const timeKnown = Boolean(saved.birthHour && saved.birthMinute);
  const time = timeKnown ? `${saved.birthHour.padStart(2, '0')}:${saved.birthMinute.padStart(2, '0')}` : '시간 모름';
  const calendar = saved.calendar === 'solar' ? '양력' : '음력';
  const leap = saved.calendar === 'lunar' && saved.isLeapMonth ? ' (윤달)' : '';
  const genderLabel =
    saved.gender === 'male' ? '남' : saved.gender === 'female' ? '여' : saved.gender === 'other' ? '기타' : '미입력';
  return `${calendar}${leap} · ${date} ${time} · ${genderLabel}`;
}

export function createSavedSajuInput(payload: SavedSajuPayload, createdAtISO = new Date().toISOString()): SavedSajuInput {
  return {
    id: `saju-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    createdAtISO,
    ...payload,
  };
}

export async function loadSavedSajuInputs(): Promise<SavedSajuInput[]> {
  const raw = await AsyncStorage.getItem(SAJU_INPUT_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsedUnknown = JSON.parse(raw) as unknown;
    const parsedList = Array.isArray(parsedUnknown) ? parsedUnknown : [parsedUnknown];
    return parsedList
      .map((item) => normalizeSavedInput(item))
      .filter((item): item is SavedSajuInput => Boolean(item))
      .slice(0, SAJU_INPUT_MAX);
  } catch {
    return [];
  }
}

export async function writeSavedSajuInputs(inputs: SavedSajuInput[]): Promise<void> {
  await AsyncStorage.setItem(SAJU_INPUT_STORAGE_KEY, JSON.stringify(inputs.slice(0, SAJU_INPUT_MAX)));
}
