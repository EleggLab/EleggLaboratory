import { buildUpgradePool, ENEMIES, getLessonById, getStageById, SPELLS } from './content';
import { computeMetaBonuses } from './save';
import type {
  BattleEvent,
  BattleOutcome,
  BattleState,
  EnemyInstance,
  PersistentSave,
  ProjectileInstance,
  UpgradeChoice,
} from './types';

const ARENA_WIDTH = 390;
const PLAYER_X = ARENA_WIDTH / 2;
const PLAYER_Y = 594;
const BARRIER_Y = 626;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function copyState(state: BattleState): BattleState {
  return JSON.parse(JSON.stringify(state)) as BattleState;
}

function createEnemy(enemyId: string, id: number): EnemyInstance {
  const archetype = ENEMIES[enemyId];
  const laneBias = (id % 5) * 44;
  const randomOffset = Math.random() * 26;
  return {
    id: `enemy-${id}`,
    archetypeId: enemyId,
    hitFlashMs: 0,
    hp: archetype.hp,
    maxHp: archetype.hp,
    radius: archetype.radius,
    x: 78 + laneBias + randomOffset,
    y: -archetype.radius - (id % 3) * 16,
  };
}

function calcNextLevelXp(level: number): number {
  return 38 + level * 14;
}

function getSpellLevel(state: BattleState, spellId: string): number {
  return state.spellLevels[spellId] ?? 0;
}

function getPassiveLevel(state: BattleState, passiveId: string): number {
  return state.passiveLevels[passiveId] ?? 0;
}

function hasRelic(state: BattleState, relicId: string): boolean {
  return state.knownRelicIds.includes(relicId);
}

function deriveStats(state: BattleState, save: PersistentSave) {
  const lesson = getLessonById(state.lessonId);
  const meta = computeMetaBonuses(save);
  const quickLevel = getPassiveLevel(state, 'quick_incantation');
  const hotLessonLevel = getPassiveLevel(state, 'hot_lesson');
  const reinforcedLevel = getPassiveLevel(state, 'reinforced_glyph');
  const wideArcsLevel = getPassiveLevel(state, 'wide_arcs');
  const heatedBookActive = hasRelic(state, 'heated_textbook') && state.elapsedMs < 30000;
  const headmasterSeal = hasRelic(state, 'headmaster_seal') ? 0.2 : 0;

  return {
    barrierMax: 100 + meta.barrierBonusFlat + reinforcedLevel * 14,
    castSpeedBonus: meta.castSpeedBonus + lesson.castSpeedBonus + quickLevel * 0.08 + (heatedBookActive ? 0.18 : 0),
    damageBonus: hotLessonLevel * 0.14,
    radiusBonus: wideArcsLevel * 10,
    rewardNotesRate: meta.bonusNotesRate + lesson.noteBonus,
    rewardInkFlat: meta.bonusInkFlat,
    bossDamageBonus: headmasterSeal,
  };
}

function syncBarrierMax(state: BattleState, nextBarrierMax: number) {
  if (nextBarrierMax === state.barrierMaxHp) {
    return;
  }

  const delta = nextBarrierMax - state.barrierMaxHp;
  state.barrierMaxHp = nextBarrierMax;
  state.barrierHp = clamp(state.barrierHp + Math.max(delta, 0), 0, state.barrierMaxHp);
}

function addEvent(state: BattleState, event: BattleEvent) {
  state.lastStepEvents.push(event);
  state.eventLog.push(event);
  if (state.eventLog.length > 24) {
    state.eventLog.shift();
  }
}

function rewardEnemyKill(state: BattleState, enemyId: string) {
  const archetype = ENEMIES[enemyId];
  state.xp += archetype.rewardXp;
  state.notesCollected += archetype.rewardNotes;
  state.inkCollected += archetype.rewardInk;
  state.totalKills += 1;
  addEvent(state, { type: 'enemy-defeated' });
}

function damageEnemy(state: BattleState, enemy: EnemyInstance, amount: number) {
  enemy.hp -= amount;
  enemy.hitFlashMs = 120;
  addEvent(state, { type: 'enemy-hit' });
  if (enemy.hp <= 0) {
    rewardEnemyKill(state, enemy.archetypeId);
  }
}

function cleanupEnemies(state: BattleState) {
  state.enemies = state.enemies.filter((enemy) => enemy.hp > 0);
}

function getNearestEnemy(state: BattleState) {
  let nearest: EnemyInstance | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const enemy of state.enemies) {
    const dx = enemy.x - PLAYER_X;
    const dy = enemy.y - PLAYER_Y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < nearestDistance) {
      nearest = enemy;
      nearestDistance = distance;
    }
  }

  return nearest;
}

function getSpellDamage(state: BattleState, spellId: string, save: PersistentSave, target?: EnemyInstance) {
  const spell = SPELLS[spellId];
  const stats = deriveStats(state, save);
  const spellLevel = getSpellLevel(state, spellId);
  const isBossTarget = target?.archetypeId === 'exam_warden';
  const bossDamageBonus = isBossTarget ? stats.bossDamageBonus : 0;
  return spell.baseDamage * (1 + (spellLevel - 1) * 0.3 + stats.damageBonus + bossDamageBonus);
}

function getSpellRadius(state: BattleState, spellId: string, save: PersistentSave) {
  const spell = SPELLS[spellId];
  const stats = deriveStats(state, save);
  const spellLevel = getSpellLevel(state, spellId);
  return spell.baseRadius + (spellLevel - 1) * 8 + stats.radiusBonus;
}

function getSpellCooldown(state: BattleState, spellId: string, save: PersistentSave) {
  const spell = SPELLS[spellId];
  const stats = deriveStats(state, save);
  return spell.baseCooldownMs / (1 + stats.castSpeedBonus);
}

function castSpell(state: BattleState, spellId: string, save: PersistentSave) {
  const spell = SPELLS[spellId];
  const nearest = getNearestEnemy(state);

  if (!nearest && spell.kind !== 'support') {
    return;
  }

  addEvent(state, { type: 'cast', spellId });

  if (spell.kind === 'projectile' && nearest) {
    const dx = nearest.x - PLAYER_X;
    const dy = nearest.y - PLAYER_Y;
    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
    const speed = spell.projectileSpeed ?? 260;
    const projectile: ProjectileInstance = {
      id: `projectile-${state.nextProjectileId++}`,
      spellId,
      damage: getSpellDamage(state, spellId, save, nearest),
      radius: getSpellRadius(state, spellId, save),
      ttlMs: 1600,
      x: PLAYER_X,
      y: PLAYER_Y,
      vx: (dx / distance) * speed,
      vy: (dy / distance) * speed,
    };
    state.projectiles.push(projectile);
    return;
  }

  if (spell.kind === 'pulse') {
    const radius = getSpellRadius(state, spellId, save);
    for (const enemy of state.enemies) {
      const dx = enemy.x - PLAYER_X;
      const dy = enemy.y - BARRIER_Y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= radius + enemy.radius) {
        damageEnemy(state, enemy, getSpellDamage(state, spellId, save, enemy));
      }
    }
    cleanupEnemies(state);
    return;
  }

  if (spell.kind === 'support') {
    const radius = getSpellRadius(state, spellId, save);
    const healAmount = (spell.supportHeal ?? 6) + getSpellLevel(state, spellId) * 2;
    state.barrierHp = clamp(state.barrierHp + healAmount, 0, state.barrierMaxHp);

    for (const enemy of state.enemies) {
      const dx = enemy.x - PLAYER_X;
      const dy = enemy.y - BARRIER_Y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= radius + enemy.radius) {
        damageEnemy(state, enemy, getSpellDamage(state, spellId, save, enemy));
      }
    }
    cleanupEnemies(state);
  }
}

function advanceWaveIfNeeded(state: BattleState) {
  const stage = getStageById(state.stageId);
  const currentWave = stage.waves[state.waveIndex];

  if (!currentWave) {
    return;
  }

  if (state.waveSpawnedCount >= currentWave.count && state.enemies.length === 0) {
    if (state.waveIndex === stage.waves.length - 1) {
      state.status = 'victory';
      addEvent(state, { type: 'victory' });
      return;
    }

    state.waveIndex += 1;
    state.waveSpawnedCount = 0;
    state.waveSpawnTimerMs = 0;
  }
}

function stepWaveSpawns(state: BattleState, dt: number) {
  const stage = getStageById(state.stageId);
  const currentWave = stage.waves[state.waveIndex];
  if (!currentWave) {
    return;
  }

  state.waveSpawnTimerMs += dt;
  while (
    state.waveSpawnedCount < currentWave.count
    && state.waveSpawnTimerMs >= currentWave.spawnIntervalMs
  ) {
    state.waveSpawnTimerMs -= currentWave.spawnIntervalMs;
    state.enemies.push(createEnemy(currentWave.enemyId, state.nextEnemyId++));
    state.waveSpawnedCount += 1;
  }
}

function stepProjectiles(state: BattleState, dt: number) {
  for (const projectile of state.projectiles) {
    projectile.x += projectile.vx * (dt / 1000);
    projectile.y += projectile.vy * (dt / 1000);
    projectile.ttlMs -= dt;

    let hit = false;
    for (const enemy of state.enemies) {
      const dx = enemy.x - projectile.x;
      const dy = enemy.y - projectile.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= enemy.radius + Math.max(projectile.radius * 0.24, 8)) {
        hit = true;
        const splashRadius = projectile.radius;
        for (const candidate of state.enemies) {
          const splashDx = candidate.x - projectile.x;
          const splashDy = candidate.y - projectile.y;
          const splashDistance = Math.sqrt(splashDx * splashDx + splashDy * splashDy);
          if (splashDistance <= splashRadius + candidate.radius) {
            damageEnemy(state, candidate, projectile.damage);
          }
        }
        break;
      }
    }

    if (hit) {
      projectile.ttlMs = 0;
    }
  }

  state.projectiles = state.projectiles.filter((projectile) => projectile.ttlMs > 0);
  cleanupEnemies(state);
}

function stepEnemies(state: BattleState, dt: number) {
  state.barrierFlashMs = Math.max(0, state.barrierFlashMs - dt);

  for (const enemy of state.enemies) {
    enemy.hitFlashMs = Math.max(0, enemy.hitFlashMs - dt);
    const archetype = ENEMIES[enemy.archetypeId];
    enemy.y += archetype.speed * (dt / 1000);

    if (enemy.y >= BARRIER_Y - enemy.radius) {
      state.barrierHp = clamp(state.barrierHp - archetype.damage, 0, state.barrierMaxHp);
      state.barrierFlashMs = 160;
      enemy.hp = 0;
      addEvent(state, { type: 'barrier-hit' });
    }
  }

  cleanupEnemies(state);
}

function shuffle<T>(items: T[]): T[] {
  const copied = [...items];
  for (let index = copied.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copied[index], copied[swapIndex]] = [copied[swapIndex], copied[index]];
  }
  return copied;
}

function generateChoices(state: BattleState): UpgradeChoice[] {
  const pool = buildUpgradePool(
    state.knownSpellIds,
    state.spellLevels,
    state.passiveLevels,
    state.knownRelicIds,
  );
  return shuffle(pool).slice(0, 3);
}

export function createBattleState(stageId: string, lessonId: string, save: PersistentSave): BattleState {
  const lesson = getLessonById(lessonId);
  const meta = computeMetaBonuses(save);
  const startingBarrier = 100 + meta.barrierBonusFlat + (lesson.startingPassives.reinforced_glyph ?? 0) * 14;

  return {
    stageId,
    lessonId,
    schoolId: lesson.school,
    status: 'running',
    elapsedMs: 0,
    barrierHp: startingBarrier,
    barrierMaxHp: startingBarrier,
    barrierFlashMs: 0,
    waveIndex: 0,
    waveSpawnedCount: 0,
    waveSpawnTimerMs: 0,
    level: 1,
    choiceCount: 0,
    xp: 0,
    nextLevelXp: calcNextLevelXp(1),
    notesCollected: 0,
    inkCollected: 0,
    totalKills: 0,
    nextEnemyId: 1,
    nextProjectileId: 1,
    knownSpellIds: [...lesson.startingSpellIds],
    spellLevels: { ...lesson.startingSpellLevels },
    passiveLevels: { ...lesson.startingPassives },
    knownRelicIds: [],
    castTimers: {},
    enemies: [],
    projectiles: [],
    pendingChoices: [],
    eventLog: [],
    lastStepEvents: [],
  };
}

export function hydrateBattleState(snapshot: BattleState): BattleState {
  return copyState(snapshot);
}

export function stepBattle(state: BattleState, save: PersistentSave, dt: number): BattleState {
  const next = copyState(state);
  next.lastStepEvents = [];

  if (next.status !== 'running') {
    return next;
  }

  next.elapsedMs += dt;
  const stats = deriveStats(next, save);
  syncBarrierMax(next, stats.barrierMax);
  stepWaveSpawns(next, dt);

  for (const spellId of next.knownSpellIds) {
    next.castTimers[spellId] = (next.castTimers[spellId] ?? 0) - dt;
    if ((next.castTimers[spellId] ?? 0) <= 0) {
      castSpell(next, spellId, save);
      next.castTimers[spellId] = getSpellCooldown(next, spellId, save);
    }
  }

  stepProjectiles(next, dt);
  stepEnemies(next, dt);

  if (next.barrierHp <= 0) {
    next.status = 'defeat';
    addEvent(next, { type: 'defeat' });
    return next;
  }

  while (next.xp >= next.nextLevelXp && next.status === 'running') {
    next.xp -= next.nextLevelXp;
    next.level += 1;
    next.nextLevelXp = calcNextLevelXp(next.level);
    next.choiceCount += 1;
    next.pendingChoices = generateChoices(next);
    if (next.pendingChoices.length > 0) {
      next.status = 'level-up';
      addEvent(next, { type: 'level-up' });
      return next;
    }
  }

  advanceWaveIfNeeded(next);
  return next;
}

export function applyUpgradeChoice(
  state: BattleState,
  choiceId: string,
  save: PersistentSave,
): BattleState {
  const next = copyState(state);
  const choice = next.pendingChoices.find((candidate) => candidate.id === choiceId);
  if (!choice) {
    return next;
  }

  switch (choice.kind) {
    case 'spell-unlock':
      if (!next.knownSpellIds.includes(choice.targetId)) {
        next.knownSpellIds.push(choice.targetId);
      }
      next.spellLevels[choice.targetId] = Math.max(1, next.spellLevels[choice.targetId] ?? 0);
      break;
    case 'spell-upgrade':
      next.spellLevels[choice.targetId] = (next.spellLevels[choice.targetId] ?? 1) + 1;
      break;
    case 'passive':
      next.passiveLevels[choice.targetId] = (next.passiveLevels[choice.targetId] ?? 0) + 1;
      break;
    case 'relic':
      if (!next.knownRelicIds.includes(choice.targetId)) {
        next.knownRelicIds.push(choice.targetId);
      }
      break;
  }

  next.pendingChoices = [];
  next.status = 'running';
  syncBarrierMax(next, deriveStats(next, save).barrierMax);
  return next;
}

export function createBattleSnapshot(state: BattleState) {
  return copyState(state);
}

export function buildBattleOutcome(state: BattleState, save: PersistentSave): BattleOutcome {
  const stage = getStageById(state.stageId);
  const stats = deriveStats(state, save);
  const notesBase = state.status === 'victory'
    ? state.notesCollected + stage.completionNotes
    : Math.floor(state.notesCollected * 0.65);
  const inkBase = state.status === 'victory'
    ? state.inkCollected + stage.completionInk + stats.rewardInkFlat
    : state.inkCollected;
  const notesRewardBase = Math.floor(notesBase * (1 + stats.rewardNotesRate));
  const elapsedSec = Math.max(1, Math.round(state.elapsedMs / 1000));
  const timeLimitSec = 180;
  const timeBonusNotes = state.status === 'victory' && elapsedSec <= timeLimitSec ? 12 : 0;
  const notesReward = notesRewardBase + timeBonusNotes;
  const masteryGain = state.status === 'victory' ? 2 : 1;

  return {
    stageId: state.stageId,
    status: state.status === 'victory' ? 'victory' : 'defeat',
    resultLabel: state.status === 'victory' ? '결계시험 통과' : '결계시험 실패',
    summary: state.status === 'victory'
      ? (elapsedSec <= timeLimitSec
          ? '3분 챌린지를 달성했어여! 보너스 노트를 획득했어여.'
          : '클리어 성공! 다음에는 3분 챌린지에도 도전해봐여.')
      : '결계가 무너졌지만 노트는 남았어여. 도서관에서 보강하고 다시 도전할 수 있어여.',
    notesReward,
    timeBonusNotes,
    timeLimitSec,
    elapsedSec,
    inkReward: inkBase,
    masteryGain,
    lastRunSnapshot: {
      kind: 'result',
      outcome: {
        savedAt: Date.now(),
        stageId: state.stageId,
        status: state.status === 'victory' ? 'victory' : 'defeat',
        notesReward,
        inkReward: inkBase,
      },
    },
  };
}
