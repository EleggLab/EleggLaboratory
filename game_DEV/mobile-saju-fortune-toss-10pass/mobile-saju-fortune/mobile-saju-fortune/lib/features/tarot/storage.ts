import AsyncStorage from '@react-native-async-storage/async-storage';

import type { TarotReadingType } from './deck';

export interface TarotDrawnCard {
  id: string;
  reversed: boolean;
}

export interface TarotSavedResult {
  type: TarotReadingType;
  dateKey: string; // YYYY-MM-DD in KST for "today"
  drawn: TarotDrawnCard[];
  createdAtISO: string;
}

export function kstDateKey(now = new Date()): string {
  // Korea has no DST; treat KST as UTC+9 for deterministic "day" boundaries.
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(kst.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function keyFor(type: TarotReadingType, dateKey: string): string {
  return `tarot.v1.${type}.${dateKey}`;
}

export async function loadTodayTarot(): Promise<TarotSavedResult | null> {
  const dateKey = kstDateKey();
  const raw = await AsyncStorage.getItem(keyFor('today', dateKey));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TarotSavedResult;
  } catch {
    return null;
  }
}

export async function saveTodayTarot(result: TarotSavedResult): Promise<void> {
  await AsyncStorage.setItem(keyFor('today', result.dateKey), JSON.stringify(result));
}

