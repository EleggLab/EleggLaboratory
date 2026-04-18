import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  SAJU_INPUT_MAX,
  type SavedSajuInput,
  createSavedSajuInput,
  loadSavedSajuInputs,
  writeSavedSajuInputs,
} from '../saju/savedInput';
import type { FortuneHistoryEntry, FortuneHistoryKind, IChingHistoryEntry, SajuHistoryEntry, TarotHistoryEntry, TodayHistoryEntry } from './types';

const HISTORY_LIMIT = 20;
const MIGRATION_KEY = 'fortune-history.v1.migration.saju-inputs';

const HISTORY_KEYS: Record<FortuneHistoryKind, string> = {
  saju: 'fortune-history.v1.saju',
  tarot: 'fortune-history.v1.tarot',
  today: 'fortune-history.v1.today',
  iching: 'fortune-history.v1.iching',
};

function historyKey(kind: FortuneHistoryKind): string {
  return HISTORY_KEYS[kind];
}

function sortEntries<T extends FortuneHistoryEntry>(entries: T[]): T[] {
  return [...entries].sort((a, b) => Date.parse(b.createdAtISO) - Date.parse(a.createdAtISO));
}

function coerceEntry(kind: FortuneHistoryKind, value: unknown): FortuneHistoryEntry | null {
  if (!value || typeof value !== 'object') return null;
  const safe = value as Partial<FortuneHistoryEntry>;
  if (safe.kind !== kind) return null;
  if (typeof safe.id !== 'string' || safe.id.length === 0) return null;
  if (typeof safe.createdAtISO !== 'string' || safe.createdAtISO.length === 0) return null;
  if (!safe.payload || typeof safe.payload !== 'object') return null;

  if (kind === 'saju') {
    const payload = safe.payload as Record<string, unknown>;
    if (payload.calendar !== 'solar' && payload.calendar !== 'lunar') return null;
    return safe as SajuHistoryEntry;
  }

  if (kind === 'tarot') {
    const payload = safe.payload as Record<string, unknown>;
    if (typeof payload.type !== 'string' || !Array.isArray(payload.drawn) || typeof payload.dateKey !== 'string') return null;
    return safe as TarotHistoryEntry;
  }

  if (kind === 'today') {
    const payload = safe.payload as Record<string, unknown>;
    if (typeof payload.dateKey !== 'string' || typeof payload.key !== 'string') return null;
    if (payload.kind !== 'western' && payload.kind !== 'chinese') return null;
    return safe as TodayHistoryEntry;
  }

  const payload = safe.payload as Record<string, unknown>;
  if (typeof payload.pickedAtISO !== 'string') return null;
  return safe as IChingHistoryEntry;
}

async function loadKindHistory(kind: FortuneHistoryKind): Promise<FortuneHistoryEntry[]> {
  const raw = await AsyncStorage.getItem(historyKey(kind));
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return sortEntries(parsed.map((item) => coerceEntry(kind, item)).filter(Boolean) as FortuneHistoryEntry[]);
  } catch {
    return [];
  }
}

async function writeKindHistory(kind: FortuneHistoryKind, entries: FortuneHistoryEntry[]): Promise<void> {
  await AsyncStorage.setItem(historyKey(kind), JSON.stringify(sortEntries(entries).slice(0, HISTORY_LIMIT)));
  if (kind === 'saju') {
    const legacy = sortEntries(entries as SajuHistoryEntry[])
      .slice(0, SAJU_INPUT_MAX)
      .map<SavedSajuInput>((entry) => ({
        id: entry.id,
        createdAtISO: entry.createdAtISO,
        ...entry.payload,
      }));
    await writeSavedSajuInputs(legacy);
  }
}

function dedupeForSave(entries: FortuneHistoryEntry[], entry: FortuneHistoryEntry): FortuneHistoryEntry[] {
  if (entry.kind === 'saju') {
    return entries;
  }

  if (entry.kind === 'tarot') {
    if (entry.payload.type !== 'today') return entries;
    return entries.filter((item) => {
      if (item.kind !== 'tarot') return true;
      return !(item.payload.type === 'today' && item.payload.dateKey === entry.payload.dateKey);
    });
  }

  if (entry.kind === 'today') {
    return entries.filter((item) => {
      if (item.kind !== 'today') return true;
      return !(
        item.payload.dateKey === entry.payload.dateKey &&
        item.payload.kind === entry.payload.kind &&
        item.payload.key === entry.payload.key &&
        (item.payload.chineseYear ?? null) === (entry.payload.chineseYear ?? null)
      );
    });
  }

  return entries.filter((item) => item.kind !== 'iching' || item.payload.pickedAtISO !== entry.payload.pickedAtISO);
}

export async function listHistory(kind?: FortuneHistoryKind): Promise<FortuneHistoryEntry[]> {
  if (kind) {
    return loadKindHistory(kind);
  }

  const [saju, tarot, today, iching] = await Promise.all([
    loadKindHistory('saju'),
    loadKindHistory('tarot'),
    loadKindHistory('today'),
    loadKindHistory('iching'),
  ]);

  return sortEntries([...saju, ...tarot, ...today, ...iching]);
}

export async function saveHistoryEntry(entry: FortuneHistoryEntry): Promise<FortuneHistoryEntry[]> {
  const current = await loadKindHistory(entry.kind);
  const deduped = dedupeForSave(current, entry);
  const next = sortEntries([entry, ...deduped]).slice(0, HISTORY_LIMIT);
  await writeKindHistory(entry.kind, next);
  return next;
}

export async function deleteHistoryEntry(kind: FortuneHistoryKind, id: string): Promise<FortuneHistoryEntry[]> {
  const current = await loadKindHistory(kind);
  const next = current.filter((item) => item.id !== id);
  await writeKindHistory(kind, next);
  return next;
}

export async function clearHistory(kind: FortuneHistoryKind): Promise<void> {
  await writeKindHistory(kind, []);
}

export async function migrateLegacyHistoryIfNeeded(): Promise<void> {
  const migrated = await AsyncStorage.getItem(MIGRATION_KEY);
  if (migrated === 'done') return;

  const savedInputs = await loadSavedSajuInputs();
  const current = (await loadKindHistory('saju')).filter(
    (entry): entry is SajuHistoryEntry => entry.kind === 'saju',
  );
  const mergedMap = new Map<string, SajuHistoryEntry>();

  current.forEach((entry) => {
    mergedMap.set(entry.id, entry);
  });

  savedInputs.forEach((saved) => {
    mergedMap.set(saved.id, {
      id: saved.id,
      kind: 'saju',
      createdAtISO: saved.createdAtISO,
      payload: {
        calendar: saved.calendar,
        birthYear: saved.birthYear,
        birthMonth: saved.birthMonth,
        birthDay: saved.birthDay,
        birthHour: saved.birthHour,
        birthMinute: saved.birthMinute,
        isLeapMonth: saved.isLeapMonth,
        gender: saved.gender,
        yearRuleIpchun: saved.yearRuleIpchun,
        jaSiNextDay: saved.jaSiNextDay,
      },
    });
  });

  await writeKindHistory('saju', Array.from(mergedMap.values()));
  await AsyncStorage.setItem(MIGRATION_KEY, 'done');
}

export function createSajuHistoryEntry(payload: SajuHistoryEntry['payload'], id?: string, createdAtISO = new Date().toISOString()): SajuHistoryEntry {
  const saved = createSavedSajuInput(payload, createdAtISO);
  return {
    id: id ?? saved.id,
    kind: 'saju',
    createdAtISO,
    payload,
  };
}
