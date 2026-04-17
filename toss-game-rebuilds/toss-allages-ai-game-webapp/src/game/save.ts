import { LIBRARY_UPGRADES } from './content';
import type {
  BattleOutcome,
  PersistentLastRun,
  PersistentSave,
  SchoolId,
} from './types';

export const SAVE_VERSION = 1;

const SAVE_PREFIX = 'magic-toss-save';

function buildDefaultMastery(): Record<SchoolId, number> {
  return {
    flame: 0,
    frost: 0,
    ward: 0,
    alchemy: 0,
  };
}

export function createDefaultSave(): PersistentSave {
  return {
    version: SAVE_VERSION,
    highestClearedStage: 0,
    currencies: {
      notes: 0,
      ink: 0,
    },
    schoolMastery: buildDefaultMastery(),
    libraryLevels: {},
    lastRun: null,
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
      currencies: {
        ...createDefaultSave().currencies,
        ...parsed.currencies,
      },
      schoolMastery: {
        ...createDefaultSave().schoolMastery,
        ...parsed.schoolMastery,
      },
      libraryLevels: {
        ...parsed.libraryLevels,
      },
      lastRun: parsed.lastRun ?? null,
    };
  } catch {
    return createDefaultSave();
  }
}

export function saveProgress(userKey: string, data: PersistentSave): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(`${SAVE_PREFIX}:${userKey}`, JSON.stringify(data));
}

export function clearSave(userKey: string): PersistentSave {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(`${SAVE_PREFIX}:${userKey}`);
  }

  return createDefaultSave();
}

export function computeMetaBonuses(save: PersistentSave) {
  const barrierLevel = save.libraryLevels.library_barrier_studies ?? 0;
  const quickNotesLevel = save.libraryLevels.library_quick_notes ?? 0;
  const bonusNotesLevel = save.libraryLevels.library_bonus_notes ?? 0;
  const inkDistillerLevel = save.libraryLevels.library_ink_distiller ?? 0;

  return {
    barrierBonusFlat: barrierLevel * 12,
    castSpeedBonus: quickNotesLevel * 0.06,
    bonusNotesRate: bonusNotesLevel * 0.1,
    bonusInkFlat: inkDistillerLevel,
  };
}

export function applyBattleOutcome(
  save: PersistentSave,
  outcome: BattleOutcome,
  schoolId: SchoolId,
): PersistentSave {
  const nextHighestClearedStage = outcome.status === 'victory'
    ? Math.max(save.highestClearedStage, Number.parseInt(outcome.stageId.replace('stage_', ''), 10))
    : save.highestClearedStage;

  return {
    ...save,
    highestClearedStage: nextHighestClearedStage,
    currencies: {
      notes: save.currencies.notes + outcome.notesReward,
      ink: save.currencies.ink + outcome.inkReward,
    },
    schoolMastery: {
      ...save.schoolMastery,
      [schoolId]: save.schoolMastery[schoolId] + outcome.masteryGain,
    },
    lastRun: outcome.lastRunSnapshot,
  };
}

export function setLastRun(save: PersistentSave, lastRun: PersistentLastRun): PersistentSave {
  return {
    ...save,
    lastRun,
  };
}

export function buyLibraryUpgrade(save: PersistentSave, upgradeId: string): PersistentSave {
  const definition = LIBRARY_UPGRADES.find((candidate) => candidate.id === upgradeId);
  if (!definition) {
    return save;
  }

  const currentLevel = save.libraryLevels[upgradeId] ?? 0;
  if (currentLevel >= definition.maxLevel || save.currencies.notes < definition.noteCost) {
    return save;
  }

  return {
    ...save,
    currencies: {
      ...save.currencies,
      notes: save.currencies.notes - definition.noteCost,
    },
    libraryLevels: {
      ...save.libraryLevels,
      [upgradeId]: currentLevel + 1,
    },
  };
}

