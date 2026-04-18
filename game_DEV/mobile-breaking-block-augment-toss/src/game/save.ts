import { CREWS } from './content';
import type {
  AugmentId,
  BlockKind,
  BossId,
  CrewId,
  NoticeTone,
  PersistentSave,
  RunDiscovery,
  RunResult,
  RunState,
} from './types';

const SAVE_VERSION = 2;
const SAVE_KEY_PREFIX = 'bounce-stack-save:';
const KNOWN_BLOCKS = ['normal', 'triangle', 'steel', 'cactus', 'bomb', 'ball'] as const;
const KNOWN_AUGMENTS = ['plus_ball', 'pickup_echo', 'bomb_echo', 'boss_crack', 'combo_charge', 'preview_plus', 'safety_net'] as const;
const KNOWN_BOSSES = ['vault_keeper', 'cactus_hydra', 'steel_warden'] as const;
const KNOWN_PHASES = ['aim', 'launch', 'augment', 'gameover'] as const;

export type RunRewardBreakdown = {
  gems: number;
  newAugments: number;
  newBosses: number;
  newLoopMilestone: boolean;
};

function createEmptyDiscovery(): RunDiscovery {
  return {
    crews: ['ria'],
    blocks: ['normal', 'ball'],
    augments: [],
    bosses: [],
  };
}

export function createInitialSave(): PersistentSave {
  return {
    version: SAVE_VERSION,
    selectedCrewId: 'ria',
    unlockedCrewIds: ['ria'],
    gems: 1,
    dailySupply: {
      dateKey: null,
      claimedCount: 0,
    },
    records: {
      completedRuns: 0,
      bestLoop: 1,
      bestScore: 0,
      totalBossesDefeated: 0,
    },
    discovered: createEmptyDiscovery(),
    lastRun: null,
    lastResult: null,
  };
}

function sanitizeCrewIds(ids: unknown, fallback: CrewId[]): CrewId[] {
  if (!Array.isArray(ids)) {
    return fallback;
  }

  const available = new Set(CREWS.map((entry) => entry.id));
  const next = ids.filter((value): value is CrewId => typeof value === 'string' && available.has(value as CrewId));
  return next.length > 0 ? Array.from(new Set(next)) : fallback;
}

function sanitizeStringList<T extends string>(value: unknown, allow: readonly T[], fallback: T[]): T[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const allowSet = new Set(allow);
  const next = value.filter((entry): entry is T => typeof entry === 'string' && allowSet.has(entry as T));
  return Array.from(new Set(next.length > 0 ? next : fallback));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function sanitizeNoticeTone(value: unknown): NoticeTone {
  return value === 'success' || value === 'warning' || value === 'info' ? value : 'info';
}

function sanitizePhase(value: unknown): RunState['phase'] {
  return KNOWN_PHASES.includes(value as RunState['phase']) ? (value as RunState['phase']) : 'aim';
}

function rehydrateRunResult(value: unknown): RunResult | null {
  if (!isRecord(value)) {
    return null;
  }

  const crewId = sanitizeCrewIds([value.crewId], ['ria'])[0];
  const loop = typeof value.loop === 'number' ? value.loop : null;
  const score = typeof value.score === 'number' ? value.score : null;
  const bestCombo = typeof value.bestCombo === 'number' ? value.bestCombo : null;
  const bossesDefeated = typeof value.bossesDefeated === 'number' ? value.bossesDefeated : null;
  const summary = typeof value.summary === 'string' ? value.summary : null;
  const finishedAt = typeof value.finishedAt === 'number' ? value.finishedAt : null;

  if (loop === null || score === null || bestCombo === null || bossesDefeated === null || summary === null || finishedAt === null) {
    return null;
  }

  return {
    crewId,
    loop,
    score,
    bestCombo,
    bossesDefeated,
    summary,
    finishedAt,
  };
}

function rehydrateRunState(value: unknown, fallbackCrewId: CrewId): RunState | null {
  if (!isRecord(value)) {
    return null;
  }

  const candidate = value as Partial<RunState>;
  const seedValue = typeof candidate.seed === 'number'
    ? candidate.seed
    : typeof candidate.initialSeed === 'number'
      ? candidate.initialSeed
      : null;

  if (seedValue === null) {
    return null;
  }

  if (!isRecord(candidate.aim) || !isRecord(candidate.stats) || !Array.isArray(candidate.balls) || !Array.isArray(candidate.blocks)) {
    return null;
  }

  const crewId = sanitizeCrewIds([candidate.crewId], [fallbackCrewId])[0];
  const normalizedSeed = seedValue >>> 0;
  const discovery = isRecord(candidate.discovery) ? candidate.discovery as Partial<RunDiscovery> : {};

  return {
    ...(candidate as RunState),
    version: typeof candidate.version === 'number' ? candidate.version : SAVE_VERSION,
    runId: typeof candidate.runId === 'string' && candidate.runId.length > 0 ? candidate.runId : `run-${normalizedSeed}`,
    crewId,
    phase: sanitizePhase(candidate.phase),
    initialSeed: typeof candidate.initialSeed === 'number' ? candidate.initialSeed >>> 0 : normalizedSeed,
    seed: normalizedSeed,
    pendingOffer: sanitizeStringList(candidate.pendingOffer, KNOWN_AUGMENTS, []),
    augments: sanitizeStringList(candidate.augments, KNOWN_AUGMENTS, []),
    lastReturnXs: Array.isArray(candidate.lastReturnXs)
      ? candidate.lastReturnXs.filter((entry): entry is number => typeof entry === 'number' && Number.isFinite(entry))
      : [],
    noticeTone: sanitizeNoticeTone(candidate.noticeTone),
    discovery: {
      crews: sanitizeStringList(discovery.crews, CREWS.map((entry) => entry.id), [crewId]),
      blocks: sanitizeStringList(discovery.blocks, KNOWN_BLOCKS, createEmptyDiscovery().blocks),
      augments: sanitizeStringList(discovery.augments, KNOWN_AUGMENTS, []),
      bosses: sanitizeStringList(discovery.bosses, KNOWN_BOSSES, []),
    },
  };
}

export function mergeDiscovery(base: RunDiscovery, incoming: Partial<RunDiscovery>): RunDiscovery {
  const merge = <T extends string>(source: T[], next: T[] | undefined) => Array.from(new Set([...(source ?? []), ...(next ?? [])]));

  return {
    crews: merge(base.crews, incoming.crews),
    blocks: merge(base.blocks, incoming.blocks),
    augments: merge(base.augments, incoming.augments),
    bosses: merge(base.bosses, incoming.bosses),
  };
}

export function rehydratePersistentSave(parsed: Partial<PersistentSave>): PersistentSave {
  const fallback = createInitialSave();
  const selectedCrewId = sanitizeCrewIds([parsed.selectedCrewId], [fallback.selectedCrewId])[0];

  return {
    version: SAVE_VERSION,
    selectedCrewId,
    unlockedCrewIds: sanitizeCrewIds(parsed.unlockedCrewIds, fallback.unlockedCrewIds),
    gems: typeof parsed.gems === 'number' ? parsed.gems : fallback.gems,
    dailySupply: {
      dateKey: typeof parsed.dailySupply?.dateKey === 'string' ? parsed.dailySupply.dateKey : fallback.dailySupply.dateKey,
      claimedCount: typeof parsed.dailySupply?.claimedCount === 'number' ? parsed.dailySupply.claimedCount : fallback.dailySupply.claimedCount,
    },
    records: {
      completedRuns: typeof parsed.records?.completedRuns === 'number' ? parsed.records.completedRuns : fallback.records.completedRuns,
      bestLoop: typeof parsed.records?.bestLoop === 'number' ? parsed.records.bestLoop : fallback.records.bestLoop,
      bestScore: typeof parsed.records?.bestScore === 'number' ? parsed.records.bestScore : fallback.records.bestScore,
      totalBossesDefeated: typeof parsed.records?.totalBossesDefeated === 'number'
        ? parsed.records.totalBossesDefeated
        : fallback.records.totalBossesDefeated,
    },
    discovered: {
      crews: sanitizeStringList(parsed.discovered?.crews, CREWS.map((entry) => entry.id), fallback.discovered.crews),
      blocks: sanitizeStringList(parsed.discovered?.blocks, KNOWN_BLOCKS, fallback.discovered.blocks),
      augments: sanitizeStringList(parsed.discovered?.augments, KNOWN_AUGMENTS, fallback.discovered.augments),
      bosses: sanitizeStringList(parsed.discovered?.bosses, KNOWN_BOSSES, fallback.discovered.bosses),
    },
    lastRun: rehydrateRunState(parsed.lastRun, selectedCrewId),
    lastResult: rehydrateRunResult(parsed.lastResult),
  };
}

export function loadSave(identityKey: string): PersistentSave {
  if (typeof window === 'undefined') {
    return createInitialSave();
  }

  try {
    const raw = window.localStorage.getItem(`${SAVE_KEY_PREFIX}${identityKey}`);
    if (!raw) {
      return createInitialSave();
    }

    const parsed = JSON.parse(raw) as Partial<PersistentSave>;
    return rehydratePersistentSave(parsed);
  } catch {
    return createInitialSave();
  }
}

export function saveProgress(identityKey: string, save: PersistentSave) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(`${SAVE_KEY_PREFIX}${identityKey}`, JSON.stringify(save));
}

export function clearSave(identityKey: string) {
  const next = createInitialSave();
  saveProgress(identityKey, next);
  return next;
}

export function getDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function normalizeDailySupply(save: PersistentSave, dateKey = getDateKey()) {
  if (save.dailySupply.dateKey === dateKey) {
    return save;
  }

  return {
    ...save,
    dailySupply: {
      dateKey,
      claimedCount: 0,
    },
  };
}

export function claimDailySupply(save: PersistentSave, rewardGems: number, dateKey = getDateKey()) {
  const normalized = normalizeDailySupply(save, dateKey);
  return {
    ...normalized,
    gems: normalized.gems + rewardGems,
    dailySupply: {
      dateKey,
      claimedCount: normalized.dailySupply.claimedCount + 1,
    },
  };
}

export function unlockCrew(save: PersistentSave, crewId: CrewId, cost: number) {
  if (save.unlockedCrewIds.includes(crewId) || save.gems < cost) {
    return save;
  }

  return {
    ...save,
    gems: save.gems - cost,
    unlockedCrewIds: Array.from(new Set([...save.unlockedCrewIds, crewId])),
    discovered: mergeDiscovery(save.discovered, {
      crews: [crewId],
    }),
  };
}

export function selectCrew(save: PersistentSave, crewId: CrewId) {
  if (!save.unlockedCrewIds.includes(crewId)) {
    return save;
  }

  return {
    ...save,
    selectedCrewId: crewId,
    discovered: mergeDiscovery(save.discovered, {
      crews: [crewId],
    }),
  };
}

export function withRunSnapshot(save: PersistentSave, run: RunState | null) {
  return {
    ...save,
    lastRun: run,
  };
}

export function withMergedDiscovery(save: PersistentSave, discovery: Partial<RunDiscovery>) {
  return {
    ...save,
    discovered: mergeDiscovery(save.discovered, discovery),
  };
}

export function getRunRewardBreakdown(save: PersistentSave, run: RunState): RunRewardBreakdown {
  const newAugments = run.discovery.augments.filter((augmentId) => !save.discovered.augments.includes(augmentId)).length;
  const newBosses = run.discovery.bosses.filter((bossId) => !save.discovered.bosses.includes(bossId)).length;
  const previousLoopMilestone = Math.floor(save.records.bestLoop / 5);
  const nextLoopMilestone = Math.floor(run.loop / 5);
  const newLoopMilestone = run.loop >= 5 && nextLoopMilestone > previousLoopMilestone;

  return {
    gems: (newAugments > 0 ? 1 : 0) + newBosses + (newLoopMilestone ? 1 : 0),
    newAugments,
    newBosses,
    newLoopMilestone,
  };
}

export function finishRun(save: PersistentSave, run: RunState, summary: string, rewardGems = 0): PersistentSave {
  const result: RunResult = {
    crewId: run.crewId,
    loop: run.loop,
    score: run.score,
    bestCombo: run.bestCombo,
    bossesDefeated: run.stats.bossesDefeated,
    summary,
    finishedAt: Date.now(),
  };

  return {
    ...withMergedDiscovery(save, run.discovery),
    gems: save.gems + rewardGems,
    lastRun: null,
    lastResult: result,
    records: {
      completedRuns: save.records.completedRuns + 1,
      bestLoop: Math.max(save.records.bestLoop, run.loop),
      bestScore: Math.max(save.records.bestScore, run.score),
      totalBossesDefeated: save.records.totalBossesDefeated + run.stats.bossesDefeated,
    },
  };
}

export function addDiscoveryToRun<T extends CrewId | BlockKind | AugmentId | BossId>(
  list: T[],
  value: T,
) {
  return list.includes(value) ? list : [...list, value];
}
