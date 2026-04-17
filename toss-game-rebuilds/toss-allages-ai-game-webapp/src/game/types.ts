export type SchoolId = 'flame' | 'frost' | 'ward' | 'alchemy';

export type SceneKind =
  | 'boot'
  | 'lobby'
  | 'class-select'
  | 'battle'
  | 'result'
  | 'library'
  | 'settings';

export type SpellKind = 'projectile' | 'pulse' | 'support';

export type SpellDefinition = {
  baseCooldownMs: number;
  baseDamage: number;
  baseRadius: number;
  color: string;
  description: string;
  id: string;
  kind: SpellKind;
  name: string;
  projectileSpeed?: number;
  school: SchoolId;
  supportHeal?: number;
};

export type PassiveDefinition = {
  description: string;
  id: string;
  maxLevel: number;
  name: string;
};

export type RelicDefinition = {
  description: string;
  id: string;
  name: string;
};

export type LessonDefinition = {
  body: string;
  castSpeedBonus: number;
  description: string;
  id: string;
  name: string;
  noteBonus: number;
  school: SchoolId;
  startingPassives: Record<string, number>;
  startingSpellLevels: Record<string, number>;
  startingSpellIds: string[];
};

export type EnemyArchetype = {
  color: string;
  damage: number;
  hp: number;
  id: string;
  name: string;
  radius: number;
  rewardInk: number;
  rewardNotes: number;
  rewardXp: number;
  speed: number;
};

export type StageWaveDefinition = {
  count: number;
  enemyId: string;
  spawnIntervalMs: number;
};

export type StageDefinition = {
  bossWaveIndex: number;
  completionInk: number;
  completionNotes: number;
  id: string;
  title: string;
  waves: StageWaveDefinition[];
};

export type LibraryUpgradeDefinition = {
  body: string;
  id: string;
  maxLevel: number;
  name: string;
  noteCost: number;
};

export type UpgradeChoiceKind = 'spell-unlock' | 'spell-upgrade' | 'passive' | 'relic';

export type UpgradeChoice = {
  body: string;
  id: string;
  kind: UpgradeChoiceKind;
  label: string;
  targetId: string;
};

export type EnemyInstance = {
  archetypeId: string;
  hitFlashMs: number;
  hp: number;
  id: string;
  maxHp: number;
  radius: number;
  x: number;
  y: number;
};

export type ProjectileInstance = {
  damage: number;
  id: string;
  radius: number;
  spellId: string;
  ttlMs: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
};

export type BattleEvent =
  | { type: 'cast'; spellId: string }
  | { type: 'enemy-hit' }
  | { type: 'enemy-defeated' }
  | { type: 'barrier-hit' }
  | { type: 'level-up' }
  | { type: 'victory' }
  | { type: 'defeat' };

export type BattleState = {
  barrierFlashMs: number;
  barrierHp: number;
  barrierMaxHp: number;
  castTimers: Record<string, number>;
  choiceCount: number;
  elapsedMs: number;
  enemies: EnemyInstance[];
  eventLog: BattleEvent[];
  inkCollected: number;
  knownRelicIds: string[];
  knownSpellIds: string[];
  lastStepEvents: BattleEvent[];
  lessonId: string;
  level: number;
  nextEnemyId: number;
  nextProjectileId: number;
  nextLevelXp: number;
  notesCollected: number;
  passiveLevels: Record<string, number>;
  pendingChoices: UpgradeChoice[];
  projectiles: ProjectileInstance[];
  schoolId: SchoolId;
  spellLevels: Record<string, number>;
  stageId: string;
  status: 'running' | 'level-up' | 'victory' | 'defeat';
  totalKills: number;
  waveIndex: number;
  waveSpawnedCount: number;
  waveSpawnTimerMs: number;
  xp: number;
};

export type BattleOutcome = {
  inkReward: number;
  lastRunSnapshot: PersistentLastRun;
  masteryGain: number;
  notesReward: number;
  timeBonusNotes: number;
  timeLimitSec: number;
  elapsedSec: number;
  resultLabel: string;
  stageId: string;
  status: 'victory' | 'defeat';
  summary: string;
};

export type PersistentLastRun =
  | {
      kind: 'battle';
      lessonId: string;
      savedAt: number;
      stageId: string;
      state: BattleState;
    }
  | {
      kind: 'result';
      outcome: {
        inkReward: number;
        notesReward: number;
        savedAt: number;
        stageId: string;
        status: 'victory' | 'defeat';
      };
    }
  | null;

export type PersistentSave = {
  currencies: {
    ink: number;
    notes: number;
  };
  highestClearedStage: number;
  libraryLevels: Record<string, number>;
  lastRun: PersistentLastRun;
  schoolMastery: Record<SchoolId, number>;
  version: number;
};

export type GameIdentity = {
  key: string;
  source: 'fallback' | 'toss';
  status:
    | 'ready'
    | 'fallback-local'
    | 'fallback-unsupported-version'
    | 'fallback-invalid-category'
    | 'fallback-runtime-error';
};

