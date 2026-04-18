import { Storage } from '@apps-in-toss/framework';

export interface AstraAffinityState {
  affection: number;
  lastInteractionDateKey: string | null;
  lastSeenDateKey: string | null;
  lastVariantId: string | null;
  checklistDateKey: string | null;
  rootVisitedByFeature: AstraFeatureVisitMap;
  detailVisitedByFeature: AstraFeatureVisitMap;
  completedByFeature: AstraFeatureVisitMap;
  completionRewardGrantedDateKey: string | null;
}

export const ASTRA_AFFECTION_MIN = 1;
export const ASTRA_AFFECTION_MAX = 20;
export const ASTRA_CHECKLIST_FEATURES = ['today', 'tarot', 'saju', 'iching'] as const;

export type AstraChecklistFeature = (typeof ASTRA_CHECKLIST_FEATURES)[number];
export type AstraChecklistVisitStage = 'root' | 'detail';
export type AstraFeatureVisitMap = Record<AstraChecklistFeature, boolean>;

export const ASTRA_CHECKLIST_LABELS: Record<AstraChecklistFeature, string> = {
  today: '\uC624\uB298\uC758 \uC6B4\uC138',
  tarot: '\uD0C0\uB85C',
  saju: '\uC0AC\uC8FC',
  iching: '\uC8FC\uC5ED',
};

const STORAGE_KEY = 'astra.v1.affection';
const affinityListeners = new Set<(state: AstraAffinityState) => void>();

function emitAstraAffinityState(state: AstraAffinityState): void {
  for (const listener of affinityListeners) {
    try {
      listener(state);
    } catch {
      // Ignore listener failures so storage remains the source of truth.
    }
  }
}

function createEmptyVisitMap(): AstraFeatureVisitMap {
  return {
    today: false,
    tarot: false,
    saju: false,
    iching: false,
  };
}

const INITIAL_STATE: AstraAffinityState = {
  affection: ASTRA_AFFECTION_MIN,
  lastInteractionDateKey: null,
  lastSeenDateKey: null,
  lastVariantId: null,
  checklistDateKey: null,
  rootVisitedByFeature: createEmptyVisitMap(),
  detailVisitedByFeature: createEmptyVisitMap(),
  completedByFeature: createEmptyVisitMap(),
  completionRewardGrantedDateKey: null,
};

let memoryState: AstraAffinityState = INITIAL_STATE;

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
  const rootVisitedByFeature = {
    ...createEmptyVisitMap(),
    ...(input?.rootVisitedByFeature ?? {}),
  };
  const detailVisitedByFeature = {
    ...createEmptyVisitMap(),
    ...(input?.detailVisitedByFeature ?? {}),
  };
  const completedByFeature = {
    ...createEmptyVisitMap(),
    ...(input?.completedByFeature ?? {}),
  };

  return {
    affection: clampAffection(input?.affection ?? INITIAL_STATE.affection),
    lastInteractionDateKey: input?.lastInteractionDateKey ?? null,
    lastSeenDateKey: input?.lastSeenDateKey ?? null,
    lastVariantId: input?.lastVariantId ?? null,
    checklistDateKey: input?.checklistDateKey ?? null,
    rootVisitedByFeature,
    detailVisitedByFeature,
    completedByFeature,
    completionRewardGrantedDateKey: input?.completionRewardGrantedDateKey ?? null,
  };
}

async function readPersistedState(): Promise<AstraAffinityState | null> {
  try {
    const raw = await Storage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<AstraAffinityState>;
    return sanitizeState(parsed);
  } catch {
    return null;
  }
}

async function writePersistedState(state: AstraAffinityState): Promise<void> {
  try {
    await Storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Keep in-memory state even if host storage is unavailable.
  }
}

export async function loadAstraAffinityState(): Promise<AstraAffinityState> {
  const persisted = await readPersistedState();
  const nextState = persisted ?? sanitizeState(memoryState);
  memoryState = nextState;
  return nextState;
}

export async function saveAstraAffinityState(state: AstraAffinityState): Promise<AstraAffinityState> {
  const nextState = sanitizeState(state);
  memoryState = nextState;
  await writePersistedState(nextState);
  emitAstraAffinityState(nextState);
  return nextState;
}

export function subscribeAstraAffinityState(
  listener: (state: AstraAffinityState) => void,
): () => void {
  affinityListeners.add(listener);
  return () => {
    affinityListeners.delete(listener);
  };
}

export function reconcileAstraAffinityState(
  state: AstraAffinityState,
  todayKey = kstDateKey(),
): AstraAffinityState {
  const sanitized = sanitizeState(state);

  const checklistNeedsReset = sanitized.checklistDateKey !== todayKey;

  if (sanitized.lastSeenDateKey === todayKey && !checklistNeedsReset) {
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
    checklistDateKey: todayKey,
    rootVisitedByFeature: checklistNeedsReset ? createEmptyVisitMap() : sanitized.rootVisitedByFeature,
    detailVisitedByFeature: checklistNeedsReset ? createEmptyVisitMap() : sanitized.detailVisitedByFeature,
    completedByFeature: checklistNeedsReset ? createEmptyVisitMap() : sanitized.completedByFeature,
    completionRewardGrantedDateKey: checklistNeedsReset ? null : sanitized.completionRewardGrantedDateKey,
  };
}

export async function bootstrapAstraAffinityState(todayKey = kstDateKey()): Promise<AstraAffinityState> {
  const nextState = reconcileAstraAffinityState(await loadAstraAffinityState(), todayKey);
  return saveAstraAffinityState(nextState);
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

export async function registerAstraChecklistVisit(
  feature: AstraChecklistFeature,
  stage: AstraChecklistVisitStage,
  todayKey = kstDateKey(),
): Promise<{
  state: AstraAffinityState;
  didCompleteFeature: boolean;
  didGrantCompletionReward: boolean;
}> {
  const reconciled = reconcileAstraAffinityState(await loadAstraAffinityState(), todayKey);
  const rootVisitedByFeature = { ...reconciled.rootVisitedByFeature };
  const detailVisitedByFeature = { ...reconciled.detailVisitedByFeature };
  const completedByFeature = { ...reconciled.completedByFeature };

  if (stage === 'root') {
    rootVisitedByFeature[feature] = true;
  } else {
    detailVisitedByFeature[feature] = true;
  }

  const nextCompleted = rootVisitedByFeature[feature] && detailVisitedByFeature[feature];
  const didCompleteFeature = !completedByFeature[feature] && nextCompleted;
  completedByFeature[feature] = nextCompleted;

  const allCompleted = ASTRA_CHECKLIST_FEATURES.every((key) => completedByFeature[key]);
  const rewardAlreadyGranted = reconciled.completionRewardGrantedDateKey === todayKey;
  const didGrantCompletionReward = allCompleted && !rewardAlreadyGranted;

  const nextState: AstraAffinityState = {
    ...reconciled,
    affection: didGrantCompletionReward
      ? clampAffection(reconciled.affection + 1)
      : reconciled.affection,
    checklistDateKey: todayKey,
    lastSeenDateKey: todayKey,
    rootVisitedByFeature,
    detailVisitedByFeature,
    completedByFeature,
    completionRewardGrantedDateKey: didGrantCompletionReward
      ? todayKey
      : reconciled.completionRewardGrantedDateKey,
  };

  return {
    state: await saveAstraAffinityState(nextState),
    didCompleteFeature,
    didGrantCompletionReward,
  };
}
