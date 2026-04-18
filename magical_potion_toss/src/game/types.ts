export type BaseLiquidId = 'water' | 'herbal' | 'refined';

export type MaterialFamilyId = 'herb' | 'flower' | 'mineral' | 'catalyst' | 'risk';

export type MaterialRarityId = 'common' | 'uncommon' | 'rare';

export type TagId = 'Herb' | 'Flower' | 'Mineral' | 'Catalyst' | 'Moonlight';

export type WorkbenchId = 'mortar' | 'drying_rack' | 'distiller' | 'purifier';

export type SceneKind = 'boot' | 'lobby' | 'records' | 'run';

export type GradeId = 'S' | 'A' | 'B' | 'C' | 'F';

export type ScoreBundle = {
  calm: number;
  detox: number;
  purity: number;
  recovery: number;
  sideEffect: number;
  vigor: number;
};

export type ConditionRule =
  | { type: 'always' }
  | { type: 'base'; anyOf: BaseLiquidId[] }
  | { type: 'base-or-tag'; bases: BaseLiquidId[]; tags: TagId[] }
  | { type: 'slot'; anyOf: number[] }
  | { type: 'tag'; anyOf: TagId[] };

export type MaterialEffect = {
  addTag?: TagId;
  amplifyPreviousPositive?: number;
  baseLiquidChange?: BaseLiquidId;
  description: string;
  score?: Partial<ScoreBundle>;
  when?: ConditionRule;
};

export type MaterialFormDefinition = {
  effects: MaterialEffect[];
  key: 'base' | 'processed';
  name: string;
  passive: ScoreBundle;
  workbenchId?: WorkbenchId;
};

export type MaterialDefinition = {
  base: MaterialFormDefinition;
  defaultTag?: TagId;
  family: MaterialFamilyId;
  id: string;
  name: string;
  note: string;
  processed?: MaterialFormDefinition;
  rarity: MaterialRarityId;
  role: string;
  weight: number;
};

export type OrderDefinition = {
  appearanceDay: number;
  baseReward: number;
  bonusReward: number;
  bonusTag?: TagId;
  customerLabel: string;
  exampleCombo: string;
  id: string;
  maxSideEffect: number;
  minPurity: number;
  name: string;
  note: string;
  requiredBase?: BaseLiquidId;
  requiredStats: Partial<Record<'calm' | 'detox' | 'recovery' | 'vigor', number>>;
  requiredTags: TagId[];
};

export type UpgradeEffectCode =
  | 'FIRST_FLOWER_CALM_PLUS'
  | 'FIRST_HERB_RECOVERY_PLUS'
  | 'FIRST_ING_PURITY_PLUS'
  | 'FULL_PREVIEW'
  | 'LAST_ING_SIDEFX_MINUS'
  | 'MATERIAL_OFFER_PLUS'
  | 'ONCE_EXTRA_SLOT'
  | 'PROCESSED_PURITY_PLUS'
  | 'PROCESSED_SIDEFX_MINUS'
  | 'REFINED_TRIGGER_PURITY_PLUS'
  | 'SAVE_ONE_UNUSED'
  | 'TAG_WEIGHT_CATALYST'
  | 'TAG_WEIGHT_FLOWER'
  | 'TAG_WEIGHT_HERB'
  | 'TAG_WEIGHT_MINERAL'
  | 'WORKBENCH_PERFECT_BONUS';

export type UpgradeDefinition = {
  availableDay: number;
  body: string;
  effectCode: UpgradeEffectCode;
  group: 'cauldron' | 'materials' | 'workbench';
  id: string;
  label: string;
  note: string;
  value: number;
  valueLabel?: string;
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

export type PreparedIngredient = {
  defaultTag?: TagId;
  family: MaterialFamilyId;
  formKey: 'base' | 'processed';
  instanceId: string;
  materialId: string;
  name: string;
  source: 'carryover' | 'offer';
};

export type CauldronPreview = {
  baseLiquid: BaseLiquidId;
  bonusSatisfied: boolean;
  carryoverCandidates: string[];
  grade: GradeId;
  hardRequirementsMet: boolean;
  logs: string[];
  missingReasons: string[];
  orderId: string;
  rentDue: number;
  rewardGold: number;
  score: ScoreBundle;
  tags: TagId[];
};

export type DayPhase = 'choose-order' | 'choose-bag' | 'workbench' | 'brew' | 'result' | 'finished';

export type DayState = {
  bag: PreparedIngredient[];
  brewSlots: string[];
  materialOffers: PreparedIngredient[];
  orderChoices: string[];
  phase: DayPhase;
  preview: CauldronPreview | null;
  processedIngredientId: string | null;
  resultCopy: string[];
  selectedOrderId: string | null;
  upgradeChoices: string[];
  useExtraSlot: boolean;
  workbenchId: WorkbenchId | null;
};

export type RunOutcome =
  | 'abandoned'
  | 'audit-cleared'
  | 'audit-partial'
  | 'rent-failed';

export type RunState = {
  activeDay: DayState;
  chosenUpgradeIds: string[];
  day: number;
  discoveredMaterialIds: string[];
  discoveredOrderIds: string[];
  extraSlotUsedDays: number[];
  finishedAt?: number;
  gold: number;
  id: string;
  outcome: RunOutcome | null;
  preservedIngredient: PreparedIngredient | null;
  startedAt: number;
  summaryNote: string;
};

export type PersistentSave = {
  bestGold: number;
  completedRuns: number;
  discoveredMaterialIds: string[];
  discoveredOrderIds: string[];
  highestDayReached: number;
  lastFinishedRun: {
    day: number;
    gold: number;
    grade?: GradeId;
    outcome: RunOutcome;
    orderId?: string;
    summaryNote: string;
    wasBestDay?: boolean;
    wasBestGold?: boolean;
  } | null;
  lastRun: RunState | null;
  successfulRuns: number;
  version: number;
};
