import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AstraAffinityState {
  affection: number;
  lastInteractionDateKey: string | null;
  lastSeenDateKey: string | null;
  lastVariantId: string | null;
}

export const ASTRA_AFFECTION_STORAGE_KEY = 'astra.v1.affection';
export const ASTRA_AFFECTION_MIN = 1;
export const ASTRA_AFFECTION_MAX = 10;

const INITIAL_STATE: AstraAffinityState = {
  affection: ASTRA_AFFECTION_MIN,
  lastInteractionDateKey: null,
  lastSeenDateKey: null,
  lastVariantId: null,
};

export function kstDateKey(now = new Date()): string {
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(kst.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function clampAffection(value: number): number {
  return Math.max(ASTRA_AFFECTION_MIN, Math.min(ASTRA_AFFECTION_MAX, Math.trunc(value)));
}

function parseDateKey(dateKey: string): number {
  const [yearPart, monthPart, dayPart] = dateKey.split('-');
  const year = Number(yearPart ?? 1970);
  const month = Number(monthPart ?? 1);
  const day = Number(dayPart ?? 1);
  return Date.UTC(year, month - 1, day);
}

function dayDiff(fromDateKey: string, toDateKey: string): number {
  const from = parseDateKey(fromDateKey);
  const to = parseDateKey(toDateKey);
  return Math.max(0, Math.round((to - from) / 86400000));
}

function sanitizeState(input: Partial<AstraAffinityState> | null | undefined): AstraAffinityState {
  return {
    affection: clampAffection(input?.affection ?? INITIAL_STATE.affection),
    lastInteractionDateKey: input?.lastInteractionDateKey ?? null,
    lastSeenDateKey: input?.lastSeenDateKey ?? null,
    lastVariantId: input?.lastVariantId ?? null,
  };
}

export async function loadAstraAffinityState(): Promise<AstraAffinityState> {
  const raw = await AsyncStorage.getItem(ASTRA_AFFECTION_STORAGE_KEY);
  if (!raw) return INITIAL_STATE;
  try {
    return sanitizeState(JSON.parse(raw) as Partial<AstraAffinityState>);
  } catch {
    return INITIAL_STATE;
  }
}

export async function saveAstraAffinityState(state: AstraAffinityState): Promise<AstraAffinityState> {
  const sanitized = sanitizeState(state);
  await AsyncStorage.setItem(ASTRA_AFFECTION_STORAGE_KEY, JSON.stringify(sanitized));
  return sanitized;
}

export function reconcileAstraAffinityState(
  state: AstraAffinityState,
  todayKey = kstDateKey(),
): AstraAffinityState {
  const sanitized = sanitizeState(state);

  if (sanitized.lastSeenDateKey === todayKey) {
    return sanitized;
  }

  const lastInteraction = sanitized.lastInteractionDateKey;
  const lastSeen = sanitized.lastSeenDateKey;
  const totalMissedSinceInteraction = lastInteraction ? Math.max(0, dayDiff(lastInteraction, todayKey) - 1) : 0;
  const missedAlreadyApplied =
    lastInteraction && lastSeen ? Math.max(0, dayDiff(lastInteraction, lastSeen) - 1) : 0;
  const missedNow = Math.max(0, totalMissedSinceInteraction - missedAlreadyApplied);

  return {
    ...sanitized,
    affection: clampAffection(sanitized.affection - missedNow),
    lastSeenDateKey: todayKey,
  };
}

export async function bootstrapAstraAffinityState(todayKey = kstDateKey()): Promise<AstraAffinityState> {
  const nextState = reconcileAstraAffinityState(await loadAstraAffinityState(), todayKey);
  return saveAstraAffinityState(nextState);
}

export function hasAstraInteractionToday(state: AstraAffinityState, todayKey = kstDateKey()): boolean {
  return state.lastInteractionDateKey === todayKey;
}

export async function registerAstraInteraction(
  currentState: AstraAffinityState,
  todayKey = kstDateKey(),
): Promise<{ state: AstraAffinityState; didIncrease: boolean }> {
  const reconciled = reconcileAstraAffinityState(currentState, todayKey);
  const alreadyInteracted = reconciled.lastInteractionDateKey === todayKey;

  const nextState: AstraAffinityState = {
    ...reconciled,
    affection: alreadyInteracted ? reconciled.affection : clampAffection(reconciled.affection + 1),
    lastInteractionDateKey: todayKey,
    lastSeenDateKey: todayKey,
  };

  return {
    state: await saveAstraAffinityState(nextState),
    didIncrease: !alreadyInteracted,
  };
}

export async function updateAstraLastVariantId(
  currentState: AstraAffinityState,
  variantId: string,
): Promise<AstraAffinityState> {
  return saveAstraAffinityState({
    ...currentState,
    lastVariantId: variantId,
  });
}
