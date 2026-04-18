export type HomeTab = 'supply' | 'play' | 'codex';
export type AppScene = 'boot' | 'home' | 'run';
export type NoticeTone = 'info' | 'success' | 'warning';

export type GameIdentityStatus =
  | 'ready'
  | 'fallback-invalid-category'
  | 'fallback-unsupported-version'
  | 'fallback-runtime-error'
  | 'fallback-local';

export type GameIdentity = {
  key: string;
  source: 'toss' | 'fallback';
  status: GameIdentityStatus;
};

export type CrewId = 'ria' | 'tae' | 'yuna' | 'doho' | 'nari';
export type BlockKind = 'normal' | 'triangle' | 'steel' | 'cactus' | 'bomb' | 'ball';
export type TriangleOrientation = 'tl' | 'tr' | 'bl' | 'br';
export type AugmentId =
  | 'plus_ball'
  | 'pickup_echo'
  | 'bomb_echo'
  | 'boss_crack'
  | 'combo_charge'
  | 'preview_plus'
  | 'safety_net';
export type BossId = 'vault_keeper' | 'cactus_hydra' | 'steel_warden';

export type CrewDefinition = {
  id: CrewId;
  name: string;
  role: string;
  oneLine: string;
  passive: string;
  active: string;
  unlockCost: number;
  accent: string;
  startBalls: number;
  previewBounces: number;
};

export type AugmentDefinition = {
  id: AugmentId;
  name: string;
  summary: string;
  body: string;
  maxStacks: number;
  tone: 'control' | 'tempo' | 'defense';
};

export type BossDefinition = {
  id: BossId;
  name: string;
  body: string;
  color: string;
  width: number;
  height: number;
};

export type BlockCatalogItem = {
  kind: BlockKind;
  name: string;
  body: string;
  tone: string;
};

export type SupplyReward = {
  step: number;
  gems: number;
  label: string;
};

export type AimState = {
  active: boolean;
  pointerId: number | null;
  x: number;
  y: number;
};

export type BallState = {
  id: number;
  active: boolean;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
};

export type BlockState = {
  id: number;
  kind: BlockKind;
  col: number;
  row: number;
  hp: number;
  maxHp: number;
  orientation: TriangleOrientation | null;
  alive: boolean;
};

export type BossState = {
  id: number;
  bossId: BossId;
  col: number;
  row: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  alive: boolean;
};

export type RunDiscovery = {
  crews: CrewId[];
  blocks: BlockKind[];
  augments: AugmentId[];
  bosses: BossId[];
};

export type RunStats = {
  blocksBroken: number;
  bossesDefeated: number;
  bombsTriggered: number;
};

export type RunState = {
  version: number;
  runId: string;
  crewId: CrewId;
  phase: 'aim' | 'launch' | 'augment' | 'gameover';
  initialSeed: number;
  seed: number;
  idSeed: number;
  turn: number;
  loop: number;
  score: number;
  ballsOwned: number;
  launcherX: number;
  aim: AimState;
  launchQueue: number;
  launchCooldownMs: number;
  launchDirectionX: number;
  launchDirectionY: number;
  balls: BallState[];
  blocks: BlockState[];
  boss: BossState | null;
  bossPendingOffer: boolean;
  ballPickupValue: number;
  launcherDrift: number;
  freezeTurns: number;
  guardCharges: number;
  skillCharge: number;
  skillReady: boolean;
  launchBuffTurns: number;
  skillGlowTurns: number;
  pendingOffer: AugmentId[];
  augments: AugmentId[];
  augmentStacks: Partial<Record<AugmentId, number>>;
  combo: number;
  bestCombo: number;
  lastReturnXs: number[];
  notice: string;
  noticeTone: NoticeTone;
  lastTurnHits: number;
  stats: RunStats;
  discovery: RunDiscovery;
};

export type RunResult = {
  crewId: CrewId;
  loop: number;
  score: number;
  bestCombo: number;
  bossesDefeated: number;
  summary: string;
  finishedAt: number;
};

export type PersistentSave = {
  version: number;
  selectedCrewId: CrewId;
  unlockedCrewIds: CrewId[];
  gems: number;
  dailySupply: {
    dateKey: string | null;
    claimedCount: number;
  };
  records: {
    completedRuns: number;
    bestLoop: number;
    bestScore: number;
    totalBossesDefeated: number;
  };
  discovered: RunDiscovery;
  lastRun: RunState | null;
  lastResult: RunResult | null;
};
