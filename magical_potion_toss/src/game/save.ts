import type { PersistentSave, RunState } from './types';

export const SAVE_VERSION = 1;

const SAVE_PREFIX = 'magical-potion-toss-save';

export function createDefaultSave(): PersistentSave {
  return {
    version: SAVE_VERSION,
    completedRuns: 0,
    successfulRuns: 0,
    bestGold: 0,
    highestDayReached: 0,
    discoveredMaterialIds: [],
    discoveredOrderIds: [],
    lastRun: null,
    lastFinishedRun: null,
  };
}

export function loadSave(userKey: string): PersistentSave {
  if (typeof window === 'undefined') {
    return createDefaultSave();
  }

  const raw = window.localStorage.getItem(`${SAVE_PREFIX}:${userKey}`);
  if (!raw) {
    return createDefaultSave();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PersistentSave>;
    return {
      ...createDefaultSave(),
      ...parsed,
      version: SAVE_VERSION,
      discoveredMaterialIds: Array.isArray(parsed.discoveredMaterialIds) ? parsed.discoveredMaterialIds : [],
      discoveredOrderIds: Array.isArray(parsed.discoveredOrderIds) ? parsed.discoveredOrderIds : [],
      lastRun: parsed.lastRun ?? null,
      lastFinishedRun: parsed.lastFinishedRun ?? null,
    };
  } catch {
    return createDefaultSave();
  }
}

export function saveProgress(userKey: string, data: PersistentSave) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(`${SAVE_PREFIX}:${userKey}`, JSON.stringify(data));
}

export function clearSave(userKey: string) {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(`${SAVE_PREFIX}:${userKey}`);
  }

  return createDefaultSave();
}

export function setLastRun(save: PersistentSave, run: RunState | null): PersistentSave {
  return {
    ...save,
    lastRun: run,
  };
}

export function commitFinishedRun(save: PersistentSave, run: RunState): PersistentSave {
  const mergedMaterials = [...new Set([...save.discoveredMaterialIds, ...run.discoveredMaterialIds])];
  const mergedOrders = [...new Set([...save.discoveredOrderIds, ...run.discoveredOrderIds])];
  const success = run.outcome === 'audit-cleared' || run.outcome === 'audit-partial';
  const finalPreview = run.activeDay.preview;
  const isNewBestGold = run.gold > save.bestGold;
  const isNewBestDay = run.day > save.highestDayReached;

  return {
    ...save,
    completedRuns: save.completedRuns + 1,
    successfulRuns: save.successfulRuns + (success ? 1 : 0),
    bestGold: Math.max(save.bestGold, run.gold),
    highestDayReached: Math.max(save.highestDayReached, run.day),
    discoveredMaterialIds: mergedMaterials,
    discoveredOrderIds: mergedOrders,
    lastRun: null,
    lastFinishedRun: run.outcome
      ? {
          outcome: run.outcome,
          day: run.day,
          gold: run.gold,
          grade: finalPreview?.grade,
          orderId: finalPreview?.orderId,
          summaryNote: run.summaryNote,
          wasBestDay: isNewBestDay,
          wasBestGold: isNewBestGold,
        }
      : save.lastFinishedRun,
  };
}
