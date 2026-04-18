import type { TarotReadingType } from '../tarot/deck';
import type { TarotDrawnCard } from '../tarot/storage';
import type { DailyKind } from '../today/fortune';
import type { SavedSajuPayload } from '../saju/savedInput';

export type FortuneHistoryKind = 'saju' | 'tarot' | 'today' | 'iching';

export type SajuHistoryPayload = SavedSajuPayload;

export interface TarotHistoryPayload {
  createdAtISO: string;
  dateKey: string;
  drawn: TarotDrawnCard[];
  type: TarotReadingType;
}

export interface TodayHistoryPayload {
  chineseYear?: number;
  createdAtISO: string;
  dateKey: string;
  key: string;
  kind: DailyKind;
}

export interface IChingHistoryPayload {
  createdAtISO: string;
  pickedAtISO: string;
}

interface FortuneHistoryEntryBase<K extends FortuneHistoryKind, P> {
  createdAtISO: string;
  id: string;
  kind: K;
  payload: P;
}

export type SajuHistoryEntry = FortuneHistoryEntryBase<'saju', SajuHistoryPayload>;
export type TarotHistoryEntry = FortuneHistoryEntryBase<'tarot', TarotHistoryPayload>;
export type TodayHistoryEntry = FortuneHistoryEntryBase<'today', TodayHistoryPayload>;
export type IChingHistoryEntry = FortuneHistoryEntryBase<'iching', IChingHistoryPayload>;

export type FortuneHistoryEntry =
  | SajuHistoryEntry
  | TarotHistoryEntry
  | TodayHistoryEntry
  | IChingHistoryEntry;
