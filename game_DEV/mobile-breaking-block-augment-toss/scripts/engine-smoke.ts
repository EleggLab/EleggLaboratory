import {
  beginAim,
  BOARD_COLS,
  BOARD_ROWS,
  LAUNCHER_Y,
  createNewRun,
  getBossWavePreview,
  getBossWaveGuide,
  moveAim,
  releaseAim,
  stepRun,
  useCrewSkill,
} from '../src/game/engine';
import { getAugmentById } from '../src/game/content';
import { createInitialSave, finishRun, getRunRewardBreakdown, rehydratePersistentSave } from '../src/game/save';
import type { AugmentId, BlockState, CrewId, RunState } from '../src/game/types';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function liveBlocks(run: RunState) {
  return run.blocks.filter((block) => block.alive);
}

function livePickups(run: RunState) {
  return liveBlocks(run).filter((block) => block.kind === 'ball');
}

function liveThreatBlocks(run: RunState) {
  return liveBlocks(run).filter((block) => block.kind !== 'ball');
}

function boardSignature(run: RunState) {
  return liveBlocks(run)
    .map((block) => `${block.kind}:${block.col}:${block.row}:${block.hp}:${block.orientation ?? 'na'}`)
    .sort()
    .join('|');
}

function assertHpCurve(block: BlockState, label: string) {
  switch (block.kind) {
    case 'normal':
    case 'triangle':
      assert(block.hp >= 1 && block.hp <= 2, `${label}: ${block.kind} hp out of range (${block.hp})`);
      break;
    case 'steel':
      assert(block.hp >= 3 && block.hp <= 4, `${label}: steel hp out of range (${block.hp})`);
      break;
    case 'cactus':
    case 'bomb':
      assert(block.hp >= 2 && block.hp <= 3, `${label}: ${block.kind} hp out of range (${block.hp})`);
      break;
    case 'ball':
      assert(block.hp === 1, `${label}: pickup hp must be 1`);
      break;
  }
}

function assertStableAimState(run: RunState, label: string) {
  assert(run.phase === 'aim', `${label}: expected aim phase, got ${run.phase}`);
  assert(Number.isFinite(run.launcherX), `${label}: launcherX must stay finite`);
  assert(run.launcherX >= 0 && run.launcherX <= BOARD_COLS, `${label}: launcherX left board bounds`);
  assert(run.blocks.every((block) => block.row <= BOARD_ROWS - 1), `${label}: board overflow leaked into aim state`);
}

function assertGuaranteedPickup(run: RunState, label: string) {
  assert(livePickups(run).length >= 1, `${label}: expected at least one live pickup on the board`);
}

function assertAimStability(seed: number) {
  const freshRun = createNewRun('ria', { seed });
  const deepAim = moveAim(
    beginAim(freshRun, 99, freshRun.launcherX + 2.4, LAUNCHER_Y - 3.2),
    99,
    freshRun.launcherX + 2.4,
    LAUNCHER_Y - 3.2,
  );
  const wobbleTargetX = freshRun.launcherX + 2.9;
  const wobbleAim = moveAim(deepAim, 99, wobbleTargetX, LAUNCHER_Y - 0.04);

  assert(wobbleAim.phase === 'aim', `seed ${seed}: aim wobble should stay in aim phase`);
  assert(wobbleAim.aim.y <= LAUNCHER_Y - 0.9, `seed ${seed}: shallow wobble should snap to a safe vertical arc`);
  assert(
    Math.abs(wobbleAim.aim.x - freshRun.launcherX) < Math.abs(wobbleTargetX - freshRun.launcherX),
    `seed ${seed}: shallow wobble should damp horizontal aim drift`,
  );

  const released = releaseAim(wobbleAim);
  assert(released.phase === 'launch', `seed ${seed}: stabilized wobble aim should still launch`);
}

function assertDeterministicSeed(seed: number) {
  const a = createNewRun('ria', { seed });
  const b = createNewRun('ria', { seed });

  assert(a.initialSeed === seed, `deterministic seed ${seed} should be preserved on the run`);
  assert(b.initialSeed === seed, `deterministic seed ${seed} should be preserved on the duplicate run`);
  assert(boardSignature(a) === boardSignature(b), `seed ${seed} should recreate the same opening board`);
  assert(a.runId === b.runId, `seed ${seed} should recreate the same run id for reproducible debugging`);
}

function fireAutoTurn(state: RunState) {
  const aimTargetX = Math.min(BOARD_COLS - 0.4, state.launcherX + 2.1);
  const aimed = beginAim(state, 1, aimTargetX, LAUNCHER_Y - 4.8);
  const released = releaseAim(aimed);
  assert(released.phase === 'launch', 'valid auto-aim should enter launch phase');

  let run = released;
  let frames = 0;
  while (run.phase === 'launch' && frames < 4000) {
    run = stepRun(run, 16);
    frames += 1;
  }

  assert(frames < 4000, 'launch phase did not resolve within expected frame budget');
  assert(run.phase === 'aim' || run.phase === 'augment' || run.phase === 'gameover', `unexpected phase after volley: ${run.phase}`);
  return run;
}

function stageAugmentOffer(state: RunState) {
  const staged: RunState = {
    ...state,
    phase: 'launch',
    bossPendingOffer: true,
    pendingOffer: [],
    launchQueue: 0,
    launchCooldownMs: 0,
    launchDirectionX: 0,
    launchDirectionY: 0,
    lastReturnXs: [state.launcherX],
    balls: state.balls.map((ball) => ({
      ...ball,
      active: false,
      x: state.launcherX,
      y: LAUNCHER_Y,
      prevX: state.launcherX,
      prevY: LAUNCHER_Y,
      vx: 0,
      vy: 0,
    })),
  };

  const next = stepRun(staged, 16);
  assert(next.phase === 'augment', `augment offer staging should land in augment phase, got ${next.phase}`);
  assert(next.pendingOffer.length === 3, `augment offer staging should surface exactly three options, got ${next.pendingOffer.length}`);
  return next.pendingOffer;
}

function assertOfferHasToneVariety(offer: AugmentId[], label: string) {
  const tones = new Set(offer.map((augmentId) => getAugmentById(augmentId).tone));
  assert(tones.size >= 2, `${label}: augment offer should preserve at least two tones for a real choice`);
}

function assertOpeningScenario(seed: number) {
  const freshRun = createNewRun('ria', { seed });
  const initialBlocks = liveBlocks(freshRun);

  assertStableAimState(freshRun, `fresh run seed ${seed}`);
  assert(initialBlocks.length >= 2, `fresh run seed ${seed} should start with a playable top row plus pickup`);
  assert(initialBlocks.every((block) => block.row === 0), `fresh run seed ${seed} should only occupy the first row`);
  assertGuaranteedPickup(freshRun, `fresh run seed ${seed}`);
  initialBlocks.forEach((block) => assertHpCurve(block, `fresh run seed ${seed}`));

  const shallowAim = releaseAim(beginAim(freshRun, 11, freshRun.launcherX, LAUNCHER_Y - 0.02));
  assert(shallowAim.phase === 'aim', `seed ${seed}: shallow aim should not start a launch`);
  assert(shallowAim.noticeTone === 'warning', `seed ${seed}: shallow aim should warn the player`);

  let run = freshRun;
  for (let turn = 1; turn <= 4; turn += 1) {
    assertStableAimState(run, `seed ${seed} pre-turn ${turn}`);
    assertGuaranteedPickup(run, `seed ${seed} pre-turn ${turn}`);
    const next = fireAutoTurn(run);
    assert(next.phase === 'aim', `seed ${seed} turn ${turn} should return to aim before the boss wave`);
    assert(next.loop === turn + 1, `seed ${seed} turn ${turn} should advance to loop ${turn + 1}, got ${next.loop}`);
    run = next;
  }

  assert(run.loop === 5, `seed ${seed}: expected loop 5 after four turns, got ${run.loop}`);
  assertStableAimState(run, `seed ${seed} boss approach`);
  assert(run.boss && run.boss.alive, `seed ${seed}: loop 5 should spawn a live boss wave`);
  assert(run.noticeTone === 'warning', `seed ${seed}: boss wave should surface a warning tone`);
  assert(run.boss.maxHp >= 8 && run.boss.maxHp <= 12, `seed ${seed}: first boss hp should stay onboarding-friendly, got ${run.boss.maxHp}`);

  const generatedBossSupports = liveThreatBlocks(run).filter(
    (block) => block.row === 1
      && (block.col === 0 || block.col === BOARD_COLS - 1)
      && block.kind === 'normal'
      && block.maxHp === 4,
  );
  const edgeSteelPressure = liveThreatBlocks(run).filter(
    (block) => block.row === 1
      && (block.col === 0 || block.col === BOARD_COLS - 1)
      && block.kind === 'steel',
  );

  assert(generatedBossSupports.length <= 1, `seed ${seed}: first boss should generate at most one onboarding support, got ${generatedBossSupports.length}`);
  assert(edgeSteelPressure.length === 0, `seed ${seed}: first boss should not open with steel edge pressure`);
}

function assertMidgameBossScenario(seed: number) {
  let run = createNewRun('ria', { seed });
  for (let turn = 1; turn <= 9; turn += 1) {
    run = fireAutoTurn(run);
  }

  assert(run.loop === 10, `seed ${seed}: expected loop 10 after nine turns, got ${run.loop}`);
  assertStableAimState(run, `seed ${seed} midgame boss`);
  assert(run.boss && run.boss.alive, `seed ${seed}: loop 10 should spawn the second boss wave`);
  assert(run.boss.maxHp >= 19 && run.boss.maxHp <= 21, `seed ${seed}: second boss hp should stay in the midgame target band, got ${run.boss.maxHp}`);

  const edgeSteelPressure = liveThreatBlocks(run).filter(
    (block) => block.row === 1
      && (block.col === 0 || block.col === BOARD_COLS - 1)
      && block.kind === 'steel',
  );
  assert(edgeSteelPressure.length <= 1, `seed ${seed}: second boss should not open with double steel edge pressure`);
  assert(livePickups(run).some((block) => block.row <= 1), `seed ${seed}: second boss wave should keep a reachable pickup near the top`);
}

function assertLateGameBossScenario(seed: number) {
  const freshRun = createNewRun('ria', { seed });
  const stagedRun: RunState = {
    ...freshRun,
    phase: 'launch',
    loop: 14,
    turn: 14,
    blocks: [],
    boss: null,
    bossPendingOffer: false,
    pendingOffer: [],
    launchQueue: 0,
    launchCooldownMs: 0,
    launchDirectionX: 0,
    launchDirectionY: 0,
    lastReturnXs: [freshRun.launcherX],
    balls: freshRun.balls.map((ball) => ({
      ...ball,
      active: false,
      x: freshRun.launcherX,
      y: LAUNCHER_Y,
      prevX: freshRun.launcherX,
      prevY: LAUNCHER_Y,
      vx: 0,
      vy: 0,
    })),
  };

  const run = stepRun(stagedRun, 16);
  assert(run.loop === 15, `seed ${seed}: expected loop 15 on the late-game boss path, got ${run.loop}`);
  assertStableAimState(run, `seed ${seed} late-game boss`);
  assert(run.boss && run.boss.alive, `seed ${seed}: loop 15 should spawn the third boss wave`);
  assert(run.boss.maxHp >= 28 && run.boss.maxHp <= 30, `seed ${seed}: third boss hp should stay in the late-game target band, got ${run.boss.maxHp}`);

  const edgeSteelPressure = liveThreatBlocks(run).filter(
    (block) => block.row === 1
      && (block.col === 0 || block.col === BOARD_COLS - 1)
      && block.kind === 'steel',
  );
  const edgeNormalSupports = liveThreatBlocks(run).filter(
    (block) => block.row === 1
      && (block.col === 0 || block.col === BOARD_COLS - 1)
      && block.kind === 'normal',
  );

  assert(edgeSteelPressure.length <= 1, `seed ${seed}: third boss should not open with double steel walls`);
  assert(edgeNormalSupports.length >= 1, `seed ${seed}: third boss should keep one readable non-steel flank`);
  assert(livePickups(run).some((block) => block.row <= 1), `seed ${seed}: third boss wave should keep a reachable pickup near the top`);
}

function assertEndgameBossScenario(seed: number) {
  const freshRun = createNewRun('ria', { seed });
  const stagedRun: RunState = {
    ...freshRun,
    phase: 'launch',
    loop: 19,
    turn: 19,
    blocks: [],
    boss: null,
    bossPendingOffer: false,
    pendingOffer: [],
    launchQueue: 0,
    launchCooldownMs: 0,
    launchDirectionX: 0,
    launchDirectionY: 0,
    lastReturnXs: [freshRun.launcherX],
    balls: freshRun.balls.map((ball) => ({
      ...ball,
      active: false,
      x: freshRun.launcherX,
      y: LAUNCHER_Y,
      prevX: freshRun.launcherX,
      prevY: LAUNCHER_Y,
      vx: 0,
      vy: 0,
    })),
  };

  const run = stepRun(stagedRun, 16);
  assert(run.loop === 20, `seed ${seed}: expected loop 20 on the endgame boss path, got ${run.loop}`);
  assertStableAimState(run, `seed ${seed} endgame boss`);
  assert(run.boss && run.boss.alive, `seed ${seed}: loop 20 should spawn the fourth boss wave`);
  assert(run.boss.maxHp >= 28 && run.boss.maxHp <= 30, `seed ${seed}: fourth boss hp should stay in the endgame target band, got ${run.boss.maxHp}`);

  const edgeSteelPressure = liveThreatBlocks(run).filter(
    (block) => block.row === 1
      && (block.col === 0 || block.col === BOARD_COLS - 1)
      && block.kind === 'steel',
  );
  const edgeNormalSupports = liveThreatBlocks(run).filter(
    (block) => block.row === 1
      && (block.col === 0 || block.col === BOARD_COLS - 1)
      && block.kind === 'normal',
  );

  assert(edgeSteelPressure.length <= 1, `seed ${seed}: fourth boss should not open with double steel walls`);
  assert(edgeNormalSupports.length >= 1, `seed ${seed}: fourth boss should keep one readable non-steel flank`);
  assert(livePickups(run).some((block) => block.row <= 1), `seed ${seed}: fourth boss wave should keep a reachable pickup near the top`);
}

function assertCrewSkills() {
  const crews: Array<{ id: CrewId; seed: number }> = [
    { id: 'ria', seed: 0x1A1A1A1A },
    { id: 'tae', seed: 0x7AE20260 },
    { id: 'yuna', seed: 0xA0A72601 },
    { id: 'doho', seed: 0xD0A07260 },
    { id: 'nari', seed: 0xAAA17260 },
  ];

  for (const crew of crews) {
    const primed: RunState = {
      ...createNewRun(crew.id, { seed: crew.seed }),
      skillCharge: 100,
      skillReady: true,
    };
    const pickupCountBefore = livePickups(primed).length;
    const threatHpBefore = liveThreatBlocks(primed).reduce((sum, block) => sum + block.hp, 0);
    const next = useCrewSkill(primed);

    assert(next.noticeTone === 'success', `${crew.id}: skill use should emit success tone`);
    assert(next.phase === 'aim', `${crew.id}: skill use should keep the run in aim phase`);

    switch (crew.id) {
      case 'ria':
        assert(next.launchBuffTurns >= 1, 'ria: skill should arm a launch damage buff');
        break;
      case 'tae':
        assert(next.ballsOwned === primed.ballsOwned + 2, 'tae: skill should add two balls');
        assert(livePickups(next).length >= pickupCountBefore + 1, 'tae: skill should add an extra pickup');
        break;
      case 'yuna':
        assert(next.freezeTurns === primed.freezeTurns + 1, 'yuna: skill should add one freeze turn');
        break;
      case 'doho': {
        const threatHpAfter = liveThreatBlocks(next).reduce((sum, block) => sum + block.hp, 0);
        assert(threatHpAfter < threatHpBefore, 'doho: skill should reduce total threat HP on the board');
        break;
      }
      case 'nari':
        assert(next.guardCharges === primed.guardCharges + 1, 'nari: skill should add one guard charge');
        assert(next.ballsOwned === primed.ballsOwned + 1, 'nari: skill should add one ball');
        break;
    }
  }
}

function assertLegacySaveMigration() {
  const legacyRun = createNewRun('ria', { seed: 0x4AA4AA4A });
  const { initialSeed: _, ...legacyRunWithoutInitialSeed } = legacyRun;
  const migrated = rehydratePersistentSave({
    ...createInitialSave(),
    selectedCrewId: 'ria',
    unlockedCrewIds: ['ria'],
    lastRun: legacyRunWithoutInitialSeed as unknown as RunState,
  });

  assert(migrated.version === 2, 'legacy save should be migrated to version 2');
  assert(migrated.lastRun !== null, 'legacy save should keep a resumable run');
  assert(migrated.lastRun?.initialSeed === legacyRun.seed, 'legacy run should backfill initialSeed from current seed');
  assert(migrated.lastRun?.runId === legacyRun.runId, 'legacy run should keep its original run id');
  assert(boardSignature(migrated.lastRun!) === boardSignature(legacyRun), 'legacy run should preserve board contents through migration');
}

function assertBossWaveRoadmap() {
  const cycleOne = getBossWaveGuide(1);
  const cycleFour = getBossWaveGuide(4);
  const cycleFive = getBossWaveGuide(5);

  assert(cycleOne.loop === 5, 'boss roadmap cycle 1 should point to loop 5');
  assert(cycleOne.flankLabel === 'normal 지원 1개', 'boss roadmap cycle 1 should describe the onboarding flank');
  assert(cycleFour.loop === 20, 'boss roadmap cycle 4 should point to loop 20');
  assert(cycleFour.flankLabel === '장기전 flank split', 'boss roadmap cycle 4 should describe the readable endurance flank');
  assert(cycleFive.flankLabel === 'steel 압박 확장', 'boss roadmap cycle 5 should describe the scaled steel expansion');
}

function assertBossWavePreview() {
  const openingPreview = getBossWavePreview(1, false);
  const activeBossPreview = getBossWavePreview(5, true);
  const clearedBossPreview = getBossWavePreview(5, false);
  const endgamePreview = getBossWavePreview(19, false);

  assert(openingPreview.distance === 4, 'boss preview at loop 1 should point four loops ahead');
  assert(openingPreview.guide.loop === 5, 'boss preview at loop 1 should point to loop 5');
  assert(activeBossPreview.isCurrent, 'boss preview should mark an active boss wave as current');
  assert(activeBossPreview.guide.loop === 5, 'boss preview should keep the current boss loop when a boss is alive');
  assert(clearedBossPreview.distance === 5, 'boss preview after a cleared boss loop should point five loops ahead');
  assert(clearedBossPreview.guide.loop === 10, 'boss preview after loop 5 should point to loop 10');
  assert(endgamePreview.guide.loop === 20, 'boss preview at loop 19 should point to loop 20');
}

function assertAugmentOfferShaping() {
  const fragileLateRun: RunState = {
    ...createNewRun('ria', { seed: 0x51515151 }),
    loop: 15,
    turn: 15,
    guardCharges: 0,
    ballsOwned: 7,
  };
  const fragileOffer = stageAugmentOffer(fragileLateRun);
  assert(fragileOffer.includes('safety_net'), 'guardless late-game offer should include safety_net');
  assertOfferHasToneVariety(fragileOffer, 'guardless late-game offer');

  const bossPrepRun: RunState = {
    ...createNewRun('ria', { seed: 0x61616161 }),
    loop: 10,
    turn: 10,
    guardCharges: 1,
    ballsOwned: 7,
  };
  const bossPrepOffer = stageAugmentOffer(bossPrepRun);
  assert(bossPrepOffer.includes('boss_crack'), 'midgame boss-prep offer should include boss_crack');
  assertOfferHasToneVariety(bossPrepOffer, 'midgame boss-prep offer');

  const harvesterRun: RunState = {
    ...createNewRun('nari', { seed: 0x71717171 }),
    loop: 5,
    turn: 5,
    guardCharges: 1,
    ballsOwned: 5,
  };
  const harvesterOffer = stageAugmentOffer(harvesterRun);
  assert(harvesterOffer.includes('pickup_echo'), 'nari reward offer should include pickup_echo early');
  assertOfferHasToneVariety(harvesterOffer, 'nari reward offer');
}

function assertRunRewardBreakdown() {
  const baselineSave = createInitialSave();
  const discoveryRun: RunState = {
    ...createNewRun('ria', { seed: 0x81818181 }),
    loop: 5,
    turn: 5,
    score: 540,
    bestCombo: 9,
    discovery: {
      crews: ['ria'],
      blocks: ['normal', 'ball'],
      augments: ['boss_crack'],
      bosses: ['vault_keeper'],
    },
    stats: {
      blocksBroken: 12,
      bossesDefeated: 1,
      bombsTriggered: 0,
    },
  };

  const reward = getRunRewardBreakdown(baselineSave, discoveryRun);
  assert(reward.gems === 3, `discovery reward should grant 3 gems, got ${reward.gems}`);
  assert(reward.newAugments === 1, `discovery reward should detect one new augment, got ${reward.newAugments}`);
  assert(reward.newBosses === 1, `discovery reward should detect one new boss, got ${reward.newBosses}`);
  assert(reward.newLoopMilestone, 'discovery reward should flag a new boss-loop milestone');

  const finished = finishRun(baselineSave, discoveryRun, 'summary', reward.gems);
  assert(finished.gems === baselineSave.gems + 3, `finishRun should add reward gems, got ${finished.gems}`);

  const veteranSave = {
    ...finished,
    records: {
      ...finished.records,
      bestLoop: 10,
    },
  };
  const repeatReward = getRunRewardBreakdown(veteranSave, {
    ...discoveryRun,
    loop: 9,
    turn: 9,
  });
  assert(repeatReward.gems === 0, `repeat reward should not pay out again, got ${repeatReward.gems}`);
}

function main() {
  const seeds = [0x11A0B1E1, 0x22B0C2E2, 0x33C0D3E3];
  for (const seed of seeds) {
    assertDeterministicSeed(seed);
    assertOpeningScenario(seed);
    assertMidgameBossScenario(seed);
    assertLateGameBossScenario(seed);
    assertEndgameBossScenario(seed);
    assertAimStability(seed);
  }

  assertCrewSkills();
  assertLegacySaveMigration();
  assertBossWaveRoadmap();
  assertBossWavePreview();
  assertAugmentOfferShaping();
  assertRunRewardBreakdown();

  console.log(`ENGINE_SMOKE_OK seeds=${seeds.length} crews=5`);
}

main();
