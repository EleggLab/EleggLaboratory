import {
  AUGMENTS,
  BOSSES,
  BLOCK_CATALOG,
  CREWS,
  getAugmentById,
  getBossById,
  getCrewById,
} from './content';
import { addDiscoveryToRun } from './save';
import type {
  AugmentId,
  BallState,
  BlockKind,
  BlockState,
  BossId,
  BossState,
  CrewId,
  RunState,
  TriangleOrientation,
} from './types';

export const SAVE_VERSION = 2;
export const BOARD_COLS = 8;
export const BOARD_ROWS = 10;
export const BOARD_FLOOR_Y = BOARD_ROWS + 0.86;
export const LAUNCHER_Y = BOARD_ROWS + 0.28;
export const BALL_RADIUS = 0.14;
export const BALL_SPEED = 8.8;
export const LAUNCH_INTERVAL_MS = 55;
export const SKILL_CHARGE_MAX = 100;
const AIM_SNAP_HEIGHT = 0.9;
const AIM_NEAR_BLEND = 0.28;

type Point = { x: number; y: number };

type Rect = { x: number; y: number; width: number; height: number };

type BossSupportMode = 'single-normal' | 'single-steel' | 'readable-flank' | 'endurance-flank' | 'scaled-steel';

type BossWaveRule = {
  cycle: number;
  hpFloor: number;
  hpFactor: number;
  flankMode: BossSupportMode;
  steelBaseHp: number;
  steelStep: number;
  normalBaseHp: number;
  normalStep: number;
  summary: string;
};

export type BossWaveGuide = {
  cycle: number;
  loop: number;
  bossId: BossId;
  bossName: string;
  hpBand: string;
  flankLabel: string;
  summary: string;
};

export type BossWavePreview = {
  guide: BossWaveGuide;
  distance: number;
  isCurrent: boolean;
};

const BOSS_WAVE_RULES: BossWaveRule[] = [
  {
    cycle: 1,
    hpFloor: 8,
    hpFactor: 1.5,
    flankMode: 'single-normal',
    steelBaseHp: 0,
    steelStep: 0,
    normalBaseHp: 2,
    normalStep: 0.4,
    summary: '첫 보스는 읽기 쉬운 단일 normal 지원으로 온보딩에 집중합니다.',
  },
  {
    cycle: 2,
    hpFloor: 16,
    hpFactor: 1.35,
    flankMode: 'single-steel',
    steelBaseHp: 4,
    steelStep: 0.35,
    normalBaseHp: 0,
    normalStep: 0,
    summary: '둘째 보스는 steel 한쪽 압박만 남겨 중반 리듬을 유지합니다.',
  },
  {
    cycle: 3,
    hpFloor: 26,
    hpFactor: 1.25,
    flankMode: 'readable-flank',
    steelBaseHp: 5,
    steelStep: 0.3,
    normalBaseHp: 6,
    normalStep: 0.35,
    summary: '셋째 보스는 steel 1, normal 1 구조로 후반 첫 장벽을 읽을 수 있게 만듭니다.',
  },
  {
    cycle: 4,
    hpFloor: 28,
    hpFactor: 1.4,
    flankMode: 'endurance-flank',
    steelBaseHp: 6,
    steelStep: 0.25,
    normalBaseHp: 7,
    normalStep: 0.3,
    summary: '넷째 보스는 장기전 관문이지만 double steel 벽은 피합니다.',
  },
];

export type CreateRunOptions = {
  seed?: number;
};

function getBossCycle(loop: number) {
  return Math.max(1, Math.floor(loop / 5));
}

function getBossIdForCycle(cycle: number): BossId {
  return BOSSES[(cycle - 1) % BOSSES.length].id;
}

function getBossWaveRule(cycle: number): BossWaveRule {
  const explicit = BOSS_WAVE_RULES.find((rule) => rule.cycle === cycle);
  if (explicit) {
    return explicit;
  }

  return {
    cycle,
    hpFloor: 20,
    hpFactor: 1.4 + ((cycle - 5) * 0.12),
    flankMode: 'scaled-steel',
    steelBaseHp: 6,
    steelStep: 0.45,
    normalBaseHp: 0,
    normalStep: 0,
    summary: '다섯째 보스 이후는 steel 압박을 조금씩 늘리되 기존 주기보다 급격히 튀지 않게 확장합니다.',
  };
}

function calculateBossHpFromRule(rule: BossWaveRule, loop: number, sizeFactor: number) {
  return Math.max(rule.hpFloor, Math.ceil(loop * rule.hpFactor * sizeFactor));
}

function getBossFlankLabel(rule: BossWaveRule) {
  switch (rule.flankMode) {
    case 'single-normal':
      return 'normal 지원 1개';
    case 'single-steel':
      return 'steel 압박 1개';
    case 'readable-flank':
      return 'steel 1 + normal 1';
    case 'endurance-flank':
      return '장기전 flank split';
    case 'scaled-steel':
      return 'steel 압박 확장';
  }
}

export function getBossWaveGuide(cycle: number): BossWaveGuide {
  const rule = getBossWaveRule(cycle);
  const loop = cycle * 5;
  const bossId = getBossIdForCycle(cycle);
  const boss = getBossById(bossId);
  const hp = calculateBossHpFromRule(rule, loop, (boss.width * boss.height) / 4);

  return {
    cycle,
    loop,
    bossId,
    bossName: boss.name,
    hpBand: `시작 HP ${hp}`,
    flankLabel: getBossFlankLabel(rule),
    summary: rule.summary,
  };
}

export function getBossWaveRoadmap(limit = 4) {
  return Array.from({ length: limit }, (_, index) => getBossWaveGuide(index + 1));
}

export function getBossWavePreview(loop: number, bossAlive: boolean): BossWavePreview {
  if (bossAlive && loop > 0 && loop % 5 === 0) {
    return {
      guide: getBossWaveGuide(getBossCycle(loop)),
      distance: 0,
      isCurrent: true,
    };
  }

  const nextLoop = loop % 5 === 0 ? loop + 5 : loop + (5 - (loop % 5));
  return {
    guide: getBossWaveGuide(getBossCycle(nextLoop)),
    distance: Math.max(0, nextLoop - loop),
    isCurrent: false,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function magnitude(x: number, y: number) {
  return Math.sqrt((x * x) + (y * y));
}

function normalize(x: number, y: number) {
  const length = magnitude(x, y);
  if (length < 0.0001) {
    return null;
  }

  return { x: x / length, y: y / length };
}

function reflect(vx: number, vy: number, nx: number, ny: number) {
  const dot = (vx * nx) + (vy * ny);
  return {
    vx: vx - (2 * dot * nx),
    vy: vy - (2 * dot * ny),
  };
}

function average(values: number[]) {
  if (values.length === 0) {
    return BOARD_COLS / 2;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function nextSeed(seed: number) {
  return (seed * 1664525 + 1013904223) >>> 0;
}

function randomFromRun(run: RunState) {
  run.seed = nextSeed(run.seed);
  return run.seed / 0xFFFFFFFF;
}

function randomInt(run: RunState, min: number, max: number) {
  return min + Math.floor(randomFromRun(run) * ((max - min) + 1));
}

function cloneRun(state: RunState): RunState {
  return {
    ...state,
    aim: { ...state.aim },
    balls: state.balls.map((ball) => ({ ...ball })),
    blocks: state.blocks.map((block) => ({ ...block })),
    boss: state.boss ? { ...state.boss } : null,
    pendingOffer: [...state.pendingOffer],
    augments: [...state.augments],
    augmentStacks: { ...state.augmentStacks },
    lastReturnXs: [...state.lastReturnXs],
    stats: { ...state.stats },
    discovery: {
      crews: [...state.discovery.crews],
      blocks: [...state.discovery.blocks],
      augments: [...state.discovery.augments],
      bosses: [...state.discovery.bosses],
    },
  };
}

function nextId(run: RunState) {
  run.idSeed += 1;
  return run.idSeed;
}

function createBall(id: number, x: number): BallState {
  return {
    id,
    active: false,
    x,
    y: LAUNCHER_Y,
    prevX: x,
    prevY: LAUNCHER_Y,
    vx: 0,
    vy: 0,
  };
}

function ensureBallPool(run: RunState, size: number) {
  while (run.balls.length < size) {
    run.balls.push(createBall(run.balls.length + 1, run.launcherX));
  }
}

function ballLaunchPadding() {
  return BALL_RADIUS + 0.24;
}

function createBlock(
  run: RunState,
  kind: BlockKind,
  col: number,
  row: number,
  hp: number,
  orientation: TriangleOrientation | null = null,
) {
  run.discovery.blocks = addDiscoveryToRun(run.discovery.blocks, kind);
  return {
    id: nextId(run),
    kind,
    col,
    row,
    hp,
    maxHp: hp,
    orientation,
    alive: true,
  } satisfies BlockState;
}

function createBoss(run: RunState, bossId: BossId, col: number) {
  const template = getBossById(bossId);
  run.discovery.bosses = addDiscoveryToRun(run.discovery.bosses, bossId);
  return {
    id: nextId(run),
    bossId,
    col,
    row: 0,
    width: template.width,
    height: template.height,
    hp: calculateBossHp(run, template.width, template.height),
    maxHp: calculateBossHp(run, template.width, template.height),
    alive: true,
  } satisfies BossState;
}

function getBlockRect(block: BlockState): Rect {
  return {
    x: block.col,
    y: block.row,
    width: 1,
    height: 1,
  };
}

function getBossRect(boss: BossState): Rect {
  return {
    x: boss.col,
    y: boss.row,
    width: boss.width,
    height: boss.height,
  };
}

function isCellOccupied(run: RunState, col: number, row: number) {
  if (run.blocks.some((block) => block.alive && block.col === col && block.row === row)) {
    return true;
  }

  if (run.boss && run.boss.alive) {
    const boss = run.boss;
    return col >= boss.col
      && col < boss.col + boss.width
      && row >= boss.row
      && row < boss.row + boss.height;
  }

  return false;
}

function pickupBonus(run: RunState) {
  return (run.augmentStacks.pickup_echo ?? 0) + (run.crewId === 'nari' ? 1 : 0);
}

function bombRadius(run: RunState) {
  return 1 + (run.augmentStacks.bomb_echo ?? 0) + (run.crewId === 'doho' ? 1 : 0);
}

function previewBounceCount(run: RunState) {
  return getCrewById(run.crewId).previewBounces + (run.augmentStacks.preview_plus ?? 0);
}

function bossDamageBonus(run: RunState) {
  return run.augmentStacks.boss_crack ?? 0;
}

function skillChargeGain(run: RunState) {
  return 8 + ((run.augmentStacks.combo_charge ?? 0) * 4);
}

function damageForHit(run: RunState, againstBoss: boolean) {
  const base = 1 + (run.launchBuffTurns > 0 ? 1 : 0);
  return base + (againstBoss ? bossDamageBonus(run) : 0);
}

function spawnSupportPickup(run: RunState) {
  for (let row = 1; row >= 0; row -= 1) {
    for (let attempt = 0; attempt < BOARD_COLS; attempt += 1) {
      const col = randomInt(run, 0, BOARD_COLS - 1);
      if (!isCellOccupied(run, col, row)) {
        run.blocks.push(createBlock(run, 'ball', col, row, 1));
        return;
      }
    }
  }
}

function spawnGuaranteedPickup(run: RunState, row = 0) {
  const emptyColumns = Array.from({ length: BOARD_COLS }, (_, index) => index)
    .filter((col) => !run.blocks.some((block) => block.alive && block.col === col && block.row === row));

  if (emptyColumns.length === 0) {
    return;
  }

  const col = emptyColumns[randomInt(run, 0, emptyColumns.length - 1)];
  run.blocks.push(createBlock(run, 'ball', col, row, 1));
}

function spawnBossWavePickup(run: RunState) {
  for (const row of [0, 1]) {
    const before = run.blocks.length;
    spawnGuaranteedPickup(run, row);
    if (run.blocks.length > before) {
      return;
    }
  }
}

function createStandardRow(run: RunState) {
  const count = randomInt(run, 4, 6);
  const columns = Array.from({ length: BOARD_COLS }, (_, index) => index);
  const picked: number[] = [];

  while (picked.length < count && columns.length > 0) {
    const index = randomInt(run, 0, columns.length - 1);
    picked.push(columns[index]);
    columns.splice(index, 1);
  }

  for (const col of picked.sort((left, right) => left - right)) {
    let kind: BlockKind;
    const roll = randomFromRun(run);
    if (roll < 0.46) {
      kind = 'normal';
    } else if (roll < 0.64) {
      kind = 'triangle';
    } else if (roll < 0.79) {
      kind = 'steel';
    } else if (roll < 0.9) {
      kind = 'cactus';
    } else {
      kind = 'bomb';
    }

    const hp = rollHp(run, kind);
    const orientation = kind === 'triangle'
      ? (['tl', 'tr', 'bl', 'br'][randomInt(run, 0, 3)] as TriangleOrientation)
      : null;
    run.blocks.push(createBlock(run, kind, col, 0, hp, orientation));
  }

  if (run.crewId === 'tae' && run.loop > 0 && run.loop % 4 === 0) {
    spawnSupportPickup(run);
  }
}

function createBossWave(run: RunState) {
  const bossCycle = getBossCycle(run.loop);
  const rule = getBossWaveRule(bossCycle);
  const bossId = getBossIdForCycle(bossCycle);
  const bossTemplate = getBossById(bossId);
  const col = clamp(Math.floor((BOARD_COLS - bossTemplate.width) / 2), 0, BOARD_COLS - bossTemplate.width);
  run.boss = createBoss(run, bossId, col);

  const supportCandidates = [0, BOARD_COLS - 1].filter((candidate) => !isCellOccupied(run, candidate, 1));
  const supports = (rule.flankMode === 'single-normal' || rule.flankMode === 'single-steel') && supportCandidates.length > 0
    ? [supportCandidates[randomInt(run, 0, supportCandidates.length - 1)]]
    : supportCandidates;
  const steelAnchor = (rule.flankMode === 'readable-flank' || rule.flankMode === 'endurance-flank') && supports.length > 1
    ? supports[randomInt(run, 0, supports.length - 1)]
    : null;
  const loopOffset = Math.max(0, run.loop - (bossCycle * 5));

  for (const supportCol of supports) {
    const supportKind: BlockKind = rule.flankMode === 'single-normal'
      ? 'normal'
      : (rule.flankMode === 'readable-flank' || rule.flankMode === 'endurance-flank') && supportCol !== steelAnchor
        ? 'normal'
        : 'steel';
    const supportHp = supportKind === 'steel'
      ? rule.steelBaseHp + Math.floor(loopOffset * rule.steelStep)
      : rule.normalBaseHp + Math.floor(loopOffset * rule.normalStep);
    run.blocks.push(createBlock(run, supportKind, supportCol, 1, supportHp));
  }

  spawnBossWavePickup(run);
}

function calculateBossHp(run: RunState, width: number, height: number) {
  const bossCycle = getBossCycle(run.loop);
  const sizeFactor = (width * height) / 4;
  return calculateBossHpFromRule(getBossWaveRule(bossCycle), run.loop, sizeFactor);
}

function rollHp(run: RunState, kind: BlockKind) {
  const tier = Math.max(1, run.loop);
  const base = Math.max(1, Math.floor(tier * 0.9));
  const variance = randomInt(run, 0, Math.max(1, Math.ceil(tier * 0.35)));
  switch (kind) {
    case 'triangle':
      return base + variance;
    case 'steel':
      return base + 2 + variance;
    case 'cactus':
      return base + 1 + variance;
    case 'bomb':
      return base + 1 + variance;
    case 'ball':
      return 1;
    case 'normal':
    default:
      return base + variance;
  }
}

function initializeBoard(run: RunState) {
  createStandardRow(run);
  spawnGuaranteedPickup(run);
  return run;
}

function normalizeLaunchVector(run: RunState) {
  const dx = run.aim.x - run.launcherX;
  const dy = run.aim.y - LAUNCHER_Y;
  if (dy >= -0.12) {
    return null;
  }

  const vector = normalize(dx, dy);
  if (!vector) {
    return null;
  }

  return {
    x: clamp(vector.x, -0.96, 0.96),
    y: Math.min(-0.18, vector.y),
  };
}

function stabilizeAimPoint(state: RunState, x: number, y: number) {
  const clampedX = clamp(x, 0, BOARD_COLS);
  const dy = y - LAUNCHER_Y;
  if (dy <= -AIM_SNAP_HEIGHT) {
    return { x: clampedX, y };
  }

  const safeY = LAUNCHER_Y - AIM_SNAP_HEIGHT;
  const horizontalDepth = clamp(Math.abs(dy) / AIM_SNAP_HEIGHT, 0.18, 1);
  const targetX = clamp(
    state.launcherX + ((clampedX - state.launcherX) * horizontalDepth),
    0,
    BOARD_COLS,
  );

  if (state.aim.active && state.aim.y <= safeY) {
    return {
      x: clamp((state.aim.x * (1 - AIM_NEAR_BLEND)) + (targetX * AIM_NEAR_BLEND), 0, BOARD_COLS),
      y: safeY,
    };
  }

  return { x: targetX, y: safeY };
}

function setBallLaunch(ball: BallState, x: number, y: number, vx: number, vy: number) {
  ball.active = true;
  ball.x = x;
  ball.y = y;
  ball.prevX = x;
  ball.prevY = y;
  ball.vx = vx;
  ball.vy = vy;
}

function clearBall(ball: BallState, x: number) {
  ball.active = false;
  ball.x = x;
  ball.y = LAUNCHER_Y;
  ball.prevX = x;
  ball.prevY = LAUNCHER_Y;
  ball.vx = 0;
  ball.vy = 0;
}

function damageBlock(run: RunState, block: BlockState, damage: number) {
  if (!block.alive) {
    return;
  }

  const applied = block.kind === 'steel' ? Math.max(1, damage - 1) : damage;
  block.hp -= applied;
  run.combo += 1;
  run.bestCombo = Math.max(run.bestCombo, run.combo);
  run.skillCharge = clamp(run.skillCharge + skillChargeGain(run), 0, SKILL_CHARGE_MAX);
  run.skillReady = run.skillCharge >= SKILL_CHARGE_MAX;
  run.lastTurnHits += 1;

  if (block.kind === 'cactus') {
    const drift = (randomFromRun(run) - 0.5) * 1.4;
    run.launcherDrift = clamp(run.launcherDrift + drift, -1.2, 1.2);
  }

  if (block.hp > 0) {
    return;
  }

  block.alive = false;
  run.stats.blocksBroken += 1;
  run.score += block.maxHp * 10;

  if (block.kind === 'ball') {
    run.ballsOwned += 1 + pickupBonus(run);
    ensureBallPool(run, Math.max(40, run.ballsOwned + 8));
    run.notice = `공 보급을 회수했어요. 다음 턴부터 ${run.ballsOwned}개 발사합니다.`;
    run.noticeTone = 'success';
    return;
  }

  if (block.kind === 'bomb') {
    run.stats.bombsTriggered += 1;
    explodeBomb(run, block.col, block.row);
  }
}

function damageBoss(run: RunState, damage: number) {
  if (!run.boss || !run.boss.alive) {
    return;
  }

  run.boss.hp -= damage;
  run.combo += 1;
  run.bestCombo = Math.max(run.bestCombo, run.combo);
  run.skillCharge = clamp(run.skillCharge + skillChargeGain(run), 0, SKILL_CHARGE_MAX);
  run.skillReady = run.skillCharge >= SKILL_CHARGE_MAX;
  run.lastTurnHits += 1;

  if (run.boss.hp > 0) {
    return;
  }

  run.boss.alive = false;
  run.score += run.boss.maxHp * 18;
  run.stats.bossesDefeated += 1;
  run.bossPendingOffer = true;
  run.notice = `${getBossById(run.boss.bossId).name}을 돌파했어요. 증강 선택이 열립니다.`;
  run.noticeTone = 'success';
}

function explodeBomb(run: RunState, originCol: number, originRow: number) {
  const radius = bombRadius(run);
  for (const block of run.blocks) {
    if (!block.alive || block.kind === 'ball') {
      continue;
    }

    if (Math.abs(block.col - originCol) <= radius && Math.abs(block.row - originRow) <= radius) {
      block.hp -= 2;
      if (block.hp <= 0) {
        block.alive = false;
        run.stats.blocksBroken += 1;
        run.score += block.maxHp * 8;
      }
    }
  }

  if (run.boss && run.boss.alive) {
    const bossCenterX = run.boss.col + (run.boss.width / 2);
    const bossCenterY = run.boss.row + (run.boss.height / 2);
    if (Math.abs(bossCenterX - (originCol + 0.5)) <= radius + 0.75
      && Math.abs(bossCenterY - (originRow + 0.5)) <= radius + 0.75) {
      damageBoss(run, 2 + (run.crewId === 'doho' ? 1 : 0));
    }
  }
}

function axisNormal(ball: BallState, rect: Rect) {
  const fromLeft = Math.abs(ball.x - rect.x);
  const fromRight = Math.abs((rect.x + rect.width) - ball.x);
  const fromTop = Math.abs(ball.y - rect.y);
  const fromBottom = Math.abs((rect.y + rect.height) - ball.y);
  const min = Math.min(fromLeft, fromRight, fromTop, fromBottom);

  if (min === fromLeft) {
    return { x: -1, y: 0 };
  }

  if (min === fromRight) {
    return { x: 1, y: 0 };
  }

  if (min === fromTop) {
    return { x: 0, y: -1 };
  }

  return { x: 0, y: 1 };
}

function triangleNormal(ball: BallState, block: BlockState) {
  if (!block.orientation) {
    return null;
  }

  const localX = ball.x - block.col;
  const localY = ball.y - block.row;
  let distance = 999;
  let normal: Point | null = null;

  switch (block.orientation) {
    case 'tl':
      distance = Math.abs((localX + localY) - 1);
      normal = normalize(1, 1);
      break;
    case 'tr':
      distance = Math.abs(((1 - localX) + localY) - 1);
      normal = normalize(-1, 1);
      break;
    case 'bl':
      distance = Math.abs((localX + (1 - localY)) - 1);
      normal = normalize(1, -1);
      break;
    case 'br':
      distance = Math.abs(((1 - localX) + (1 - localY)) - 1);
      normal = normalize(-1, -1);
      break;
  }

  if (!normal || distance > 0.18) {
    return null;
  }

  return normal;
}

function collideRect(ball: BallState, rect: Rect) {
  const nearestX = clamp(ball.x, rect.x, rect.x + rect.width);
  const nearestY = clamp(ball.y, rect.y, rect.y + rect.height);
  const dx = ball.x - nearestX;
  const dy = ball.y - nearestY;

  if ((dx * dx) + (dy * dy) > BALL_RADIUS * BALL_RADIUS) {
    return null;
  }

  return axisNormal(ball, rect);
}

function collideBlock(ball: BallState, block: BlockState) {
  if (!block.alive) {
    return null;
  }

  const rect = getBlockRect(block);
  const axis = collideRect(ball, rect);
  if (!axis) {
    return null;
  }

  return triangleNormal(ball, block) ?? axis;
}

function collideBoss(ball: BallState, boss: BossState | null) {
  if (!boss || !boss.alive) {
    return null;
  }

  return collideRect(ball, getBossRect(boss));
}

function finishVolley(state: RunState) {
  const run = cloneRun(state);
  const landingX = clamp(average(run.lastReturnXs) + run.launcherDrift, ballLaunchPadding(), BOARD_COLS - ballLaunchPadding());
  run.launcherX = landingX;
  run.aim = {
    active: false,
    pointerId: null,
    x: landingX,
    y: LAUNCHER_Y - 1,
  };
  run.launchQueue = 0;
  run.launchCooldownMs = 0;
  run.launchDirectionX = 0;
  run.launchDirectionY = 0;
  run.lastReturnXs = [];
  run.combo = 0;
  run.launcherDrift = 0;
  run.launchBuffTurns = Math.max(0, run.launchBuffTurns - 1);
  run.skillGlowTurns = 0;

  for (const ball of run.balls) {
    clearBall(ball, landingX);
  }

  if (run.bossPendingOffer) {
    run.pendingOffer = rollAugmentOffer(run);
    run.bossPendingOffer = false;
    run.phase = run.pendingOffer.length > 0 ? 'augment' : 'aim';
    return run;
  }

  return advanceBoard(run);
}

type AugmentOfferContext = {
  nextBossCycle: number;
  distanceToBoss: number;
  dangerRow: number;
  bombsSeen: boolean;
  lowBallCount: boolean;
  wantsPreview: boolean;
  needsGuard: boolean;
};

function getAugmentOfferContext(run: RunState): AugmentOfferContext {
  const activeThreats = run.blocks.filter((block) => block.alive && block.kind !== 'ball');
  const dangerRow = activeThreats.reduce((maxRow, block) => Math.max(maxRow, block.row), 0);
  const nextBoss = getBossWavePreview(run.loop, Boolean(run.boss?.alive));

  return {
    nextBossCycle: nextBoss.guide.cycle,
    distanceToBoss: nextBoss.distance,
    dangerRow,
    bombsSeen: run.discovery.blocks.includes('bomb')
      || run.stats.bombsTriggered > 0
      || activeThreats.some((block) => block.kind === 'bomb'),
    lowBallCount: run.ballsOwned <= (run.loop >= 15 ? 6 : 4),
    wantsPreview: previewBounceCount(run) <= 2 && run.loop <= 15,
    needsGuard: run.guardCharges === 0 && (run.loop >= 10 || dangerRow >= BOARD_ROWS - 3),
  };
}

function getAugmentAnchor(run: RunState, eligible: AugmentId[], context: AugmentOfferContext) {
  if (context.needsGuard && eligible.includes('safety_net')) {
    return 'safety_net';
  }

  if (context.lowBallCount && eligible.includes('plus_ball')) {
    return 'plus_ball';
  }

  if ((run.crewId === 'nari' || run.crewId === 'tae')
    && pickupBonus(run) <= 1
    && eligible.includes('pickup_echo')) {
    return 'pickup_echo';
  }

  if (context.nextBossCycle >= 2
    && (run.augmentStacks.boss_crack ?? 0) === 0
    && eligible.includes('boss_crack')) {
    return 'boss_crack';
  }

  if ((run.crewId === 'doho' || context.bombsSeen)
    && (run.augmentStacks.bomb_echo ?? 0) === 0
    && eligible.includes('bomb_echo')) {
    return 'bomb_echo';
  }

  if (context.wantsPreview && eligible.includes('preview_plus')) {
    return 'preview_plus';
  }

  if (run.crewId !== 'ria'
    && (run.augmentStacks.combo_charge ?? 0) === 0
    && eligible.includes('combo_charge')) {
    return 'combo_charge';
  }

  return null;
}

function augmentOfferWeight(
  run: RunState,
  augment: typeof AUGMENTS[number],
  context: AugmentOfferContext,
  offeredTones: Set<typeof augment.tone>,
) {
  let weight = 1;
  const stacks = run.augmentStacks[augment.id] ?? 0;
  weight *= Math.max(0.42, 1 - (stacks * 0.22));

  switch (augment.id) {
    case 'plus_ball':
      weight += context.lowBallCount ? 2.2 : 0.5;
      weight += run.loop >= 15 ? 0.3 : 0;
      weight -= Math.max(0, run.ballsOwned - 7) * 0.12;
      break;
    case 'pickup_echo':
      weight += run.crewId === 'nari' ? 1.9 : 0;
      weight += run.crewId === 'tae' ? 1.2 : 0;
      weight += run.ballsOwned >= 4 ? 0.45 : 0;
      break;
    case 'bomb_echo':
      weight += context.bombsSeen ? 1.8 : -0.35;
      weight += run.crewId === 'doho' ? 1.35 : 0;
      break;
    case 'boss_crack':
      weight += context.nextBossCycle * 0.45;
      weight += context.nextBossCycle >= 2 ? 1.15 : 0;
      weight += context.distanceToBoss <= 2 ? 0.6 : 0;
      break;
    case 'combo_charge':
      weight += run.crewId === 'doho' ? 1.15 : 0;
      weight += run.crewId === 'tae' ? 0.95 : 0;
      weight += run.crewId === 'nari' ? 0.7 : 0;
      weight += run.crewId === 'yuna' ? 0.65 : 0;
      weight += run.skillReady ? -0.35 : 0.35;
      break;
    case 'preview_plus':
      weight += context.wantsPreview ? 1.9 : 0.25;
      weight += run.crewId === 'ria' ? -0.4 : 0.2;
      weight += run.loop >= 15 ? -0.3 : 0;
      break;
    case 'safety_net':
      weight += context.needsGuard ? 2.4 : 0.25;
      weight += context.dangerRow >= BOARD_ROWS - 2 ? 0.8 : 0;
      weight -= run.guardCharges * 0.55;
      break;
  }

  if (offeredTones.size > 0) {
    const existingTone = [...offeredTones][0];
    const hasSingleTone = offeredTones.size === 1;
    if (!offeredTones.has(augment.tone)) {
      weight *= hasSingleTone ? 1.75 : 1.3;
    } else if (hasSingleTone && augment.tone === existingTone) {
      weight *= 0.72;
    }
  }

  return Math.max(0.08, weight);
}

function pickWeightedAugmentIndex(
  run: RunState,
  pool: Array<typeof AUGMENTS[number]>,
  context: AugmentOfferContext,
  offeredTones: Set<typeof AUGMENTS[number]['tone']>,
) {
  const weights = pool.map((augment) => augmentOfferWeight(run, augment, context, offeredTones));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = randomFromRun(run) * total;

  for (let index = 0; index < pool.length; index += 1) {
    cursor -= weights[index];
    if (cursor <= 0) {
      return index;
    }
  }

  return pool.length - 1;
}

function rollAugmentOffer(run: RunState) {
  const pool = AUGMENTS.filter((augment) => (run.augmentStacks[augment.id] ?? 0) < augment.maxStacks);
  const offer: AugmentId[] = [];
  const offeredTones = new Set<typeof AUGMENTS[number]['tone']>();
  const context = getAugmentOfferContext(run);
  const anchor = getAugmentAnchor(run, pool.map((augment) => augment.id), context);

  if (anchor) {
    const anchorIndex = pool.findIndex((augment) => augment.id === anchor);
    if (anchorIndex >= 0) {
      const [picked] = pool.splice(anchorIndex, 1);
      offer.push(picked.id);
      offeredTones.add(picked.tone);
    }
  }

  while (pool.length > 0 && offer.length < 3) {
    const index = pickWeightedAugmentIndex(run, pool, context, offeredTones);
    const [picked] = pool.splice(index, 1);
    offer.push(picked.id);
    offeredTones.add(picked.tone);
  }

  return offer;
}

function clearOverflow(run: RunState) {
  run.blocks = run.blocks.filter((block) => block.alive && block.row <= BOARD_ROWS - 1);
  if (run.boss && run.boss.alive) {
    run.boss.row = Math.max(0, BOARD_ROWS - run.boss.height);
  }
}

function advanceBoard(state: RunState) {
  const run = cloneRun(state);
  run.turn += 1;
  run.phase = 'aim';
  run.lastTurnHits = 0;

  if (run.freezeTurns > 0) {
    run.freezeTurns -= 1;
    run.notice = '정지장이 작동해 이번 턴에는 보드가 내려오지 않았어요.';
    run.noticeTone = 'success';
    return run;
  }

  run.loop += 1;

  for (const block of run.blocks) {
    if (block.alive) {
      block.row += 1;
    }
  }

  if (run.boss && run.boss.alive) {
    run.boss.row += 1;
  }

  const hasOverflow = run.blocks.some((block) => block.alive && block.row >= BOARD_ROWS)
    || (run.boss && run.boss.alive && (run.boss.row + run.boss.height - 1) >= BOARD_ROWS);

  if (hasOverflow) {
    if (run.guardCharges > 0) {
      run.guardCharges -= 1;
      clearOverflow(run);
      run.notice = '하단 안전망이 한 번 붕괴를 막아냈어요.';
      run.noticeTone = 'warning';
    } else {
      run.phase = 'gameover';
      run.notice = '하단 방어선이 무너졌어요. 이번 런의 기록을 정리해 주세요.';
      run.noticeTone = 'warning';
      return run;
    }
  }

  run.blocks = run.blocks.filter((block) => block.alive);
  if (run.boss && !run.boss.alive) {
    run.boss = null;
  }

  if (run.loop % 5 === 0) {
    createBossWave(run);
    run.notice = `${run.loop}루프 보스 웨이브가 시작됐어요. 상단 대상을 먼저 확인하세요.`;
    run.noticeTone = 'warning';
  } else {
    createStandardRow(run);
    spawnGuaranteedPickup(run);
    run.notice = `${run.loop}루프가 열렸어요. 가장 위험한 열부터 비우세요.`;
    run.noticeTone = 'info';
  }

  return run;
}

function damageWeakestBlocks(run: RunState, count: number, damage: number) {
  const targets = run.blocks
    .filter((block) => block.alive && block.kind !== 'ball')
    .sort((left, right) => left.hp - right.hp)
    .slice(0, count);

  for (const target of targets) {
    damageBlock(run, target, damage);
  }
}

function launchBall(run: RunState) {
  const ball = run.balls.find((candidate) => !candidate.active);
  if (!ball) {
    ensureBallPool(run, run.balls.length + 8);
    return launchBall(run);
  }

  setBallLaunch(
    ball,
    run.launcherX,
    LAUNCHER_Y,
    run.launchDirectionX * BALL_SPEED,
    run.launchDirectionY * BALL_SPEED,
  );
}

function stepBall(run: RunState, ball: BallState, dtSec: number) {
  ball.prevX = ball.x;
  ball.prevY = ball.y;
  ball.x += ball.vx * dtSec;
  ball.y += ball.vy * dtSec;

  if (ball.x <= BALL_RADIUS) {
    ball.x = BALL_RADIUS;
    ball.vx = Math.abs(ball.vx);
  } else if (ball.x >= BOARD_COLS - BALL_RADIUS) {
    ball.x = BOARD_COLS - BALL_RADIUS;
    ball.vx = -Math.abs(ball.vx);
  }

  if (ball.y <= BALL_RADIUS) {
    ball.y = BALL_RADIUS;
    ball.vy = Math.abs(ball.vy);
  }

  if (ball.y >= BOARD_FLOOR_Y) {
    ball.active = false;
    run.lastReturnXs.push(ball.x);
    clearBall(ball, run.launcherX);
    return;
  }

  for (const block of run.blocks) {
    const normal = collideBlock(ball, block);
    if (!normal) {
      continue;
    }

    const nextVelocity = reflect(ball.vx, ball.vy, normal.x, normal.y);
    ball.vx = nextVelocity.vx;
    ball.vy = nextVelocity.vy;
    ball.x += normal.x * 0.04;
    ball.y += normal.y * 0.04;
    damageBlock(run, block, damageForHit(run, false));
    return;
  }

  const bossNormal = collideBoss(ball, run.boss);
  if (bossNormal) {
    const nextVelocity = reflect(ball.vx, ball.vy, bossNormal.x, bossNormal.y);
    ball.vx = nextVelocity.vx;
    ball.vy = nextVelocity.vy;
    ball.x += bossNormal.x * 0.04;
    ball.y += bossNormal.y * 0.04;
    damageBoss(run, damageForHit(run, true));
  }
}

export function createNewRun(crewId: CrewId, options: CreateRunOptions = {}): RunState {
  const crew = getCrewById(crewId);
  const seed = (options.seed ?? (Date.now() >>> 0)) >>> 0;
  const run: RunState = {
    version: SAVE_VERSION,
    runId: `run-${seed}`,
    crewId,
    phase: 'aim',
    initialSeed: seed,
    seed,
    idSeed: 1,
    turn: 1,
    loop: 1,
    score: 0,
    ballsOwned: 1 + crew.startBalls,
    launcherX: BOARD_COLS / 2,
    aim: {
      active: false,
      pointerId: null,
      x: BOARD_COLS / 2,
      y: LAUNCHER_Y - 1,
    },
    launchQueue: 0,
    launchCooldownMs: 0,
    launchDirectionX: 0,
    launchDirectionY: 0,
    balls: [],
    blocks: [],
    boss: null,
    bossPendingOffer: false,
    ballPickupValue: 1 + pickupBonus({
      version: SAVE_VERSION,
      runId: '',
      crewId,
      phase: 'aim',
      initialSeed: seed,
      seed,
      idSeed: 0,
      turn: 0,
      loop: 0,
      score: 0,
      ballsOwned: 0,
      launcherX: 0,
      aim: { active: false, pointerId: null, x: 0, y: 0 },
      launchQueue: 0,
      launchCooldownMs: 0,
      launchDirectionX: 0,
      launchDirectionY: 0,
      balls: [],
      blocks: [],
      boss: null,
      bossPendingOffer: false,
      ballPickupValue: 1,
      launcherDrift: 0,
      freezeTurns: 0,
      guardCharges: 0,
      skillCharge: 0,
      skillReady: false,
      launchBuffTurns: 0,
      skillGlowTurns: 0,
      pendingOffer: [],
      augments: [],
      augmentStacks: {},
      combo: 0,
      bestCombo: 0,
      lastReturnXs: [],
      notice: '',
      noticeTone: 'info',
      lastTurnHits: 0,
      stats: {
        blocksBroken: 0,
        bossesDefeated: 0,
        bombsTriggered: 0,
      },
      discovery: {
        crews: [crewId],
        blocks: [],
        augments: [],
        bosses: [],
      },
    }),
    launcherDrift: 0,
    freezeTurns: 0,
    guardCharges: crewId === 'yuna' ? 1 : 0,
    skillCharge: 0,
    skillReady: false,
    launchBuffTurns: 0,
    skillGlowTurns: 0,
    pendingOffer: [],
    augments: [],
    augmentStacks: {},
    combo: 0,
    bestCombo: 0,
    lastReturnXs: [],
    notice: `${crew.name}와 런을 시작했어요. 아래에서 위로 드래그해 첫 샷을 발사하세요.`,
    noticeTone: 'info',
    lastTurnHits: 0,
    stats: {
      blocksBroken: 0,
      bossesDefeated: 0,
      bombsTriggered: 0,
    },
    discovery: {
      crews: [crewId],
      blocks: [],
      augments: [],
      bosses: [],
    },
  };

  ensureBallPool(run, Math.max(40, run.ballsOwned + 8));
  initializeBoard(run);
  for (const ball of run.balls) {
    clearBall(ball, run.launcherX);
  }
  return run;
}

export function beginAim(state: RunState, pointerId: number, x: number, y: number) {
  if (state.phase !== 'aim') {
    return state;
  }

  return {
    ...state,
    aim: {
      active: true,
      pointerId,
      x,
      y,
    },
  };
}

export function moveAim(state: RunState, pointerId: number, x: number, y: number) {
  if (state.phase !== 'aim' || state.aim.pointerId !== pointerId) {
    return state;
  }

  const nextAim = stabilizeAimPoint(state, x, y);

  return {
    ...state,
    aim: {
      active: true,
      pointerId,
      x: nextAim.x,
      y: nextAim.y,
    },
  };
}

export function cancelAim(state: RunState, pointerId: number) {
  if (state.aim.pointerId !== pointerId) {
    return state;
  }

  return {
    ...state,
    aim: {
      active: false,
      pointerId: null,
      x: state.launcherX,
      y: LAUNCHER_Y - 1,
    },
  };
}

export function releaseAim(state: RunState) {
  if (state.phase !== 'aim') {
    return state;
  }

  const run = cloneRun(state);
  const direction = normalizeLaunchVector(run);
  if (!direction) {
    run.notice = '조준선이 너무 낮아요. 보드 방향으로 더 끌어올려 주세요.';
    run.noticeTone = 'warning';
    run.aim.active = false;
    run.aim.pointerId = null;
    return run;
  }

  run.phase = 'launch';
  run.launchQueue = run.ballsOwned;
  run.launchCooldownMs = 0;
  run.launchDirectionX = direction.x;
  run.launchDirectionY = direction.y;
  run.aim.active = false;
  run.aim.pointerId = null;
  run.notice = `${run.ballsOwned}개의 공을 연사합니다. 가장 위험한 열을 먼저 비우세요.`;
  run.noticeTone = 'info';
  return run;
}

export function useCrewSkill(state: RunState) {
  if (state.phase !== 'aim' || !state.skillReady) {
    return state;
  }

  const run = cloneRun(state);
  run.skillCharge = 0;
  run.skillReady = false;
  run.skillGlowTurns = 1;

  switch (run.crewId) {
    case 'ria':
      run.launchBuffTurns = Math.max(run.launchBuffTurns, 1);
      run.notice = '리아가 다음 발사를 정밀 탄으로 바꿨어요. 이번 턴 피해가 증가합니다.';
      run.noticeTone = 'success';
      break;
    case 'tae':
      run.ballsOwned += 2;
      ensureBallPool(run, Math.max(40, run.ballsOwned + 8));
      spawnSupportPickup(run);
      run.notice = '태오가 긴급 보급을 호출했어요. 공 +2와 보급 공이 지급됩니다.';
      run.noticeTone = 'success';
      break;
    case 'yuna':
      run.freezeTurns += 1;
      run.notice = '유나의 정지장이 준비됐어요. 다음 하강 턴을 한 번 막습니다.';
      run.noticeTone = 'success';
      break;
    case 'doho':
      damageWeakestBlocks(run, 4, 3);
      if (run.boss && run.boss.alive) {
        damageBoss(run, 3);
      }
      run.notice = '도호가 취약한 블록을 먼저 폭격했어요.';
      run.noticeTone = 'success';
      break;
    case 'nari':
      run.guardCharges += 1;
      run.ballsOwned += 1;
      ensureBallPool(run, Math.max(40, run.ballsOwned + 8));
      run.notice = '나리가 안전망과 공 보급을 동시에 확보했어요.';
      run.noticeTone = 'success';
      break;
  }

  return run;
}

export function chooseAugment(state: RunState, augmentId: AugmentId) {
  if (state.phase !== 'augment' || !state.pendingOffer.includes(augmentId)) {
    return state;
  }

  const run = cloneRun(state);
  const nextStack = (run.augmentStacks[augmentId] ?? 0) + 1;
  run.augmentStacks[augmentId] = nextStack;
  run.augments = run.augments.includes(augmentId) ? run.augments : [...run.augments, augmentId];
  run.discovery.augments = addDiscoveryToRun(run.discovery.augments, augmentId);
  run.pendingOffer = [];
  run.phase = 'aim';

  switch (augmentId) {
    case 'plus_ball':
      run.ballsOwned += 1;
      ensureBallPool(run, Math.max(40, run.ballsOwned + 8));
      break;
    case 'pickup_echo':
      run.ballPickupValue += 1;
      break;
    case 'safety_net':
      run.guardCharges += 1;
      break;
    default:
      break;
  }

  run.notice = `${getAugmentById(augmentId).name} 적용 완료. 다음 샷으로 새 세팅을 시험해 보세요.`;
  run.noticeTone = 'success';
  return run;
}

export function stepRun(state: RunState, dtMs: number) {
  if (state.phase !== 'launch') {
    return state;
  }

  const run = cloneRun(state);
  run.launchCooldownMs -= dtMs;
  while (run.launchQueue > 0 && run.launchCooldownMs <= 0) {
    launchBall(run);
    run.launchQueue -= 1;
    run.launchCooldownMs += LAUNCH_INTERVAL_MS;
  }

  const steps = Math.max(1, Math.ceil(dtMs / 8));
  const stepDt = (dtMs / steps) / 1000;
  for (let index = 0; index < steps; index += 1) {
    for (const ball of run.balls) {
      if (!ball.active) {
        continue;
      }

      stepBall(run, ball, stepDt);
    }
  }

  const hasActiveBall = run.balls.some((ball) => ball.active);
  if (!hasActiveBall && run.launchQueue === 0) {
    return finishVolley(run);
  }

  return run;
}

export function createRunSummary(run: RunState) {
  const crew = getCrewById(run.crewId);
  const bossLabel = run.stats.bossesDefeated > 0 ? `보스 ${run.stats.bossesDefeated}회 돌파` : '보스 돌파 없음';
  return `${crew.name}로 ${run.loop}루프, 점수 ${run.score}, 최고 콤보 ${run.bestCombo}. ${bossLabel}.`;
}

export function getLaunchDirection(state: RunState) {
  return normalizeLaunchVector(state);
}

export function getTrajectoryPreview(state: RunState) {
  if (state.phase !== 'aim' || !state.aim.active) {
    return [] as Point[];
  }

  const direction = normalizeLaunchVector(state);
  if (!direction) {
    return [] as Point[];
  }

  let x = state.launcherX;
  let y = LAUNCHER_Y;
  let vx = direction.x * 0.45;
  let vy = direction.y * 0.45;
  let bounces = 0;
  const maxBounces = previewBounceCount(state);
  const points: Point[] = [{ x, y }];

  const traceBall = {
    id: -1,
    active: true,
    x,
    y,
    prevX: x,
    prevY: y,
    vx,
    vy,
  } satisfies BallState;

  for (let step = 0; step < 900; step += 1) {
    traceBall.prevX = traceBall.x;
    traceBall.prevY = traceBall.y;
    traceBall.x += traceBall.vx * 0.12;
    traceBall.y += traceBall.vy * 0.12;

    let bounced = false;
    if (traceBall.x <= BALL_RADIUS || traceBall.x >= BOARD_COLS - BALL_RADIUS) {
      traceBall.vx *= -1;
      bounced = true;
    }

    if (traceBall.y <= BALL_RADIUS) {
      traceBall.vy *= -1;
      bounced = true;
    }

    for (const block of state.blocks) {
      const normal = collideBlock(traceBall, block);
      if (normal) {
        const nextVelocity = reflect(traceBall.vx, traceBall.vy, normal.x, normal.y);
        traceBall.vx = nextVelocity.vx;
        traceBall.vy = nextVelocity.vy;
        bounced = true;
        break;
      }
    }

    const bossNormal = collideBoss(traceBall, state.boss);
    if (bossNormal) {
      const nextVelocity = reflect(traceBall.vx, traceBall.vy, bossNormal.x, bossNormal.y);
      traceBall.vx = nextVelocity.vx;
      traceBall.vy = nextVelocity.vy;
      bounced = true;
    }

    if (step % 6 === 0 || bounced) {
      points.push({ x: traceBall.x, y: traceBall.y });
    }

    if (bounced) {
      bounces += 1;
      if (bounces >= maxBounces) {
        break;
      }
    }

    if (traceBall.y >= BOARD_ROWS - 0.25) {
      break;
    }
  }

  return points;
}

export function getBlockLabels(state: RunState) {
  const counts = new Map<BlockKind, number>();
  for (const block of state.blocks) {
    if (!block.alive) {
      continue;
    }

    counts.set(block.kind, (counts.get(block.kind) ?? 0) + 1);
  }

  return BLOCK_CATALOG
    .map((item) => ({ ...item, count: counts.get(item.kind) ?? 0 }))
    .filter((item) => item.count > 0);
}
