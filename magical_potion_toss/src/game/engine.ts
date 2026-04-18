import {
  BASE_LIQUID_LABELS,
  createIngredient,
  GRADE_MULTIPLIERS,
  getMaterialById,
  getMaterialForm,
  getOrderById,
  getUpgradeById,
  MATERIALS,
  ORDERS,
  RUN_UPGRADES,
  TAG_LABELS,
  WORKBENCHES,
} from './content';
import type {
  BaseLiquidId,
  CauldronPreview,
  ConditionRule,
  DayState,
  GradeId,
  MaterialFamilyId,
  PreparedIngredient,
  PersistentSave,
  RunOutcome,
  RunState,
  ScoreBundle,
  TagId,
  UpgradeEffectCode,
  WorkbenchId,
} from './types';

const FINAL_DAY = 7;

const RENT_BY_DAY: Partial<Record<number, number>> = {
  3: 24,
  6: 36,
};

export function getUpcomingRentInfo(day: number) {
  if (RENT_BY_DAY[day]) {
    return {
      amount: RENT_BY_DAY[day] as number,
      day,
      isDueToday: true,
    };
  }

  const nextDay = Object.keys(RENT_BY_DAY)
    .map((value) => Number(value))
    .sort((left, right) => left - right)
    .find((candidate) => candidate > day);

  if (!nextDay) {
    return null;
  }

  return {
    amount: RENT_BY_DAY[nextDay] as number,
    day: nextDay,
    isDueToday: false,
  };
}

function emptyScore(): ScoreBundle {
  return {
    recovery: 0,
    calm: 0,
    vigor: 0,
    detox: 0,
    purity: 0,
    sideEffect: 0,
  };
}

function cloneRun<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function addScore(target: ScoreBundle, delta?: Partial<ScoreBundle>) {
  if (!delta) {
    return;
  }

  target.recovery += delta.recovery ?? 0;
  target.calm += delta.calm ?? 0;
  target.vigor += delta.vigor ?? 0;
  target.detox += delta.detox ?? 0;
  target.purity += delta.purity ?? 0;
  target.sideEffect += delta.sideEffect ?? 0;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(2).replace(/\.?0+$/, '');
}

function formatStatLabel(key: keyof ScoreBundle) {
  switch (key) {
    case 'recovery':
      return '회복';
    case 'calm':
      return '진정';
    case 'vigor':
      return '활력';
    case 'detox':
      return '해독';
    case 'purity':
      return '순도';
    case 'sideEffect':
      return '부작용';
    default:
      return key;
  }
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function hasUpgrade(run: RunState, effectCode: UpgradeEffectCode) {
  return run.chosenUpgradeIds.some((upgradeId) => getUpgradeById(upgradeId).effectCode === effectCode);
}

function getUpgradeValue(run: RunState, effectCode: UpgradeEffectCode) {
  const upgrade = run.chosenUpgradeIds
    .map((upgradeId) => getUpgradeById(upgradeId))
    .find((candidate) => candidate.effectCode === effectCode);
  return upgrade?.value ?? 0;
}

function getOfferCount(run: RunState) {
  return 8 + getUpgradeValue(run, 'MATERIAL_OFFER_PLUS');
}

function getWeightMultiplier(run: RunState, family: MaterialFamilyId) {
  switch (family) {
    case 'herb':
      return getUpgradeValue(run, 'TAG_WEIGHT_HERB') || 1;
    case 'flower':
      return getUpgradeValue(run, 'TAG_WEIGHT_FLOWER') || 1;
    case 'mineral':
      return getUpgradeValue(run, 'TAG_WEIGHT_MINERAL') || 1;
    case 'catalyst':
      return getUpgradeValue(run, 'TAG_WEIGHT_CATALYST') || 1;
    case 'risk':
    default:
      return 1;
  }
}

function pickDistinctWeightedMaterialIds(count: number, run: RunState) {
  const pool = MATERIALS.map((material) => ({
    id: material.id,
    weight: material.weight * getWeightMultiplier(run, material.family),
  }));
  const chosen: string[] = [];

  while (pool.length > 0 && chosen.length < count) {
    const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
    let cursor = Math.random() * totalWeight;
    let pickedIndex = 0;
    for (let index = 0; index < pool.length; index += 1) {
      cursor -= pool[index].weight;
      if (cursor <= 0) {
        pickedIndex = index;
        break;
      }
    }

    chosen.push(pool[pickedIndex].id);
    pool.splice(pickedIndex, 1);
  }

  return chosen;
}

function pickOrderChoices(day: number) {
  if (day >= FINAL_DAY) {
    return ['order_guild_audit'];
  }

  const exact = shuffle(ORDERS.filter((order) => order.appearanceDay === day && order.appearanceDay < FINAL_DAY));
  const prior = shuffle(
    ORDERS.filter(
      (order) => order.appearanceDay < day && order.appearanceDay >= Math.max(1, day - 2),
    ),
  );
  const mixed = [...exact, ...prior];
  const unique = mixed.filter(
    (order, index) => mixed.findIndex((candidate) => candidate.id === order.id) === index,
  );

  return unique.slice(0, 2).map((order) => order.id);
}

function pickWorkbench(day: number): WorkbenchId | null {
  if (day % 2 !== 0 || day >= FINAL_DAY) {
    return null;
  }

  const workbenches: WorkbenchId[] = ['mortar', 'drying_rack', 'distiller', 'purifier'];
  return workbenches[Math.floor(Math.random() * workbenches.length)];
}

function mergeUnique(items: string[], additions: string[]) {
  return [...new Set([...items, ...additions])];
}

function canProcessIngredientWithWorkbench(ingredient: PreparedIngredient, workbenchId: WorkbenchId) {
  const material = getMaterialById(ingredient.materialId);
  return material.processed?.workbenchId === workbenchId;
}

function buildDayState(run: RunState): DayState {
  const materialOfferIds = pickDistinctWeightedMaterialIds(getOfferCount(run), run);
  const materialOffers = materialOfferIds.map((materialId) => createIngredient(materialId, 'offer'));
  return {
    phase: 'choose-order',
    orderChoices: pickOrderChoices(run.day),
    selectedOrderId: null,
    materialOffers,
    bag: [],
    workbenchId: pickWorkbench(run.day),
    processedIngredientId: null,
    brewSlots: [],
    useExtraSlot: false,
    preview: null,
    resultCopy: [],
    upgradeChoices: [],
  };
}

function updateDiscovery(run: RunState, dayState: DayState) {
  run.discoveredOrderIds = mergeUnique(run.discoveredOrderIds, dayState.orderChoices);
  run.discoveredMaterialIds = mergeUnique(
    run.discoveredMaterialIds,
    dayState.materialOffers.map((ingredient) => ingredient.materialId),
  );
}

function createSummary(outcome: RunOutcome, preview: CauldronPreview, day: number, gold: number) {
  switch (outcome) {
    case 'audit-cleared':
      return `길드 감사 주문을 ${preview.grade} 등급으로 통과했어요. ${day}일 런을 깔끔하게 마감했고 금고에는 ${gold}골드가 남았습니다.`;
    case 'audit-partial':
      return `감사 주문은 마쳤지만 등급이 ${preview.grade}에 머물렀어요. 런은 완주했지만 더 정교한 순서 설계가 필요합니다.`;
    case 'rent-failed':
      return `임대료 ${preview.rentDue}골드를 감당하지 못해 ${day}일차에 런이 끝났어요. 다음엔 보상 컷라인과 임대료 타이밍을 더 일찍 준비해야 합니다.`;
    case 'abandoned':
    default:
      return '런을 중도 정리했어요. 다음 시도에서는 첫 재료와 마지막 정제 타이밍을 더 날카롭게 가져가 보세요.';
  }
}

function meetsCondition(
  condition: ConditionRule | undefined,
  slotIndex: number,
  baseLiquid: BaseLiquidId,
  tags: Set<TagId>,
) {
  if (!condition || condition.type === 'always') {
    return true;
  }

  switch (condition.type) {
    case 'base':
      return condition.anyOf.includes(baseLiquid);
    case 'slot':
      return condition.anyOf.includes(slotIndex);
    case 'tag':
      return condition.anyOf.some((tag) => tags.has(tag));
    case 'base-or-tag':
      return condition.bases.includes(baseLiquid) || condition.tags.some((tag) => tags.has(tag));
    default:
      return false;
  }
}

function getDominantPositiveKey(scoreBundle: ScoreBundle): keyof ScoreBundle | null {
  const candidates: Array<keyof ScoreBundle> = ['recovery', 'calm', 'vigor', 'detox', 'purity'];
  let winner: keyof ScoreBundle | null = null;
  let bestValue = 0;

  for (const key of candidates) {
    const value = scoreBundle[key];
    if (value > bestValue) {
      bestValue = value;
      winner = key;
    }
  }

  return winner;
}

function buildPreview(run: RunState, brewSlots: string[], useExtraSlot: boolean): CauldronPreview | null {
  const orderId = run.activeDay.selectedOrderId;
  if (!orderId) {
    return null;
  }

  const order = getOrderById(orderId);
  const requiredSlotCount = useExtraSlot ? 5 : 4;
  if (brewSlots.length !== requiredSlotCount) {
    return null;
  }

  const ingredients = brewSlots
    .map((instanceId) => run.activeDay.bag.find((ingredient) => ingredient.instanceId === instanceId))
    .filter((ingredient): ingredient is PreparedIngredient => Boolean(ingredient));

  if (ingredients.length !== requiredSlotCount) {
    return null;
  }

  const total = emptyScore();
  const tags = new Set<TagId>();
  const logs: string[] = [];
  const usedSet = new Set(brewSlots);
  const carryoverCandidates = run.activeDay.bag
    .filter((ingredient) => !usedSet.has(ingredient.instanceId))
    .map((ingredient) => ingredient.instanceId);
  let baseLiquid: BaseLiquidId = 'water';
  let previousContribution = emptyScore();

  ingredients.forEach((ingredient, index) => {
    const material = getMaterialById(ingredient.materialId);
    const form = getMaterialForm(ingredient);
    const slotIndex = index + 1;
    const contribution = cloneRun(form.passive);
    const preTags = new Set(tags);
    const beforeBase = baseLiquid;

    logs.push(`${slotIndex}슬롯 ${ingredient.name} 투입`);

    for (const effect of form.effects) {
      if (!meetsCondition(effect.when, slotIndex, baseLiquid, preTags)) {
        continue;
      }

      if (effect.amplifyPreviousPositive) {
        const multiplier = effect.amplifyPreviousPositive - 1;
        contribution.recovery += Math.max(0, previousContribution.recovery) * multiplier;
        contribution.calm += Math.max(0, previousContribution.calm) * multiplier;
        contribution.vigor += Math.max(0, previousContribution.vigor) * multiplier;
        contribution.detox += Math.max(0, previousContribution.detox) * multiplier;
        contribution.purity += Math.max(0, previousContribution.purity) * multiplier;
      }

      addScore(contribution, effect.score);

      if (effect.baseLiquidChange) {
        if (baseLiquid !== effect.baseLiquidChange) {
          baseLiquid = effect.baseLiquidChange;
          logs.push(`- ${effect.description}`);
          if (
            effect.baseLiquidChange === 'refined'
            && beforeBase !== 'refined'
            && hasUpgrade(run, 'REFINED_TRIGGER_PURITY_PLUS')
          ) {
            contribution.purity += getUpgradeValue(run, 'REFINED_TRIGGER_PURITY_PLUS');
            logs.push('- 정제 코일이 반응해 순도가 추가로 상승했습니다.');
          }
        }
      } else {
        logs.push(`- ${effect.description}`);
      }

      if (effect.addTag) {
        tags.add(effect.addTag);
      }
    }

    if (slotIndex === 1 && hasUpgrade(run, 'FIRST_ING_PURITY_PLUS')) {
      contribution.purity += getUpgradeValue(run, 'FIRST_ING_PURITY_PLUS');
      logs.push('- 잔열 제어로 첫 재료 순도가 상승했습니다.');
    }

    if (slotIndex === ingredients.length && hasUpgrade(run, 'LAST_ING_SIDEFX_MINUS')) {
      contribution.sideEffect -= getUpgradeValue(run, 'LAST_ING_SIDEFX_MINUS');
      logs.push('- 은테두리 항아리가 마지막 재료 부작용을 깎았습니다.');
    }

    if (slotIndex === 1 && material.family === 'herb' && hasUpgrade(run, 'FIRST_HERB_RECOVERY_PLUS')) {
      contribution.recovery += getUpgradeValue(run, 'FIRST_HERB_RECOVERY_PLUS');
      logs.push('- 약초 기억층이 첫 약초 회복을 높였습니다.');
    }

    if (slotIndex === 1 && material.family === 'flower' && hasUpgrade(run, 'FIRST_FLOWER_CALM_PLUS')) {
      contribution.calm += getUpgradeValue(run, 'FIRST_FLOWER_CALM_PLUS');
      logs.push('- 화관 증폭층이 첫 꽃 재료 진정을 높였습니다.');
    }

    if (ingredient.formKey === 'processed') {
      if (hasUpgrade(run, 'WORKBENCH_PERFECT_BONUS')) {
        const dominant = getDominantPositiveKey(contribution);
        if (dominant) {
          contribution[dominant] += getUpgradeValue(run, 'WORKBENCH_PERFECT_BONUS');
          logs.push(`- 정밀 망치가 손질형 ${ingredient.name}의 ${formatStatLabel(dominant)} 수치를 끌어올렸습니다.`);
        }
      }

      if (hasUpgrade(run, 'PROCESSED_SIDEFX_MINUS')) {
        contribution.sideEffect -= getUpgradeValue(run, 'PROCESSED_SIDEFX_MINUS');
        logs.push('- 정화 세면대가 손질형 재료 부작용을 줄였습니다.');
      }

      if (hasUpgrade(run, 'PROCESSED_PURITY_PLUS')) {
        contribution.purity += getUpgradeValue(run, 'PROCESSED_PURITY_PLUS');
        logs.push('- 교정 지그가 손질형 재료 순도를 높였습니다.');
      }
    }

    addScore(total, contribution);

    if (ingredient.defaultTag) {
      tags.add(ingredient.defaultTag);
    }

    previousContribution = contribution;
  });

  const missingReasons: Array<{ gap: number; text: string }> = [];
  if (order.requiredBase && order.requiredBase !== baseLiquid) {
    missingReasons.push({
      gap: 2,
      text: `기반액이 ${BASE_LIQUID_LABELS[order.requiredBase]}이어야 합니다.`,
    });
  }

  for (const tag of order.requiredTags) {
    if (!tags.has(tag)) {
      missingReasons.push({
        gap: 2,
        text: `${TAG_LABELS[tag]} 태그가 필요합니다.`,
      });
    }
  }

  for (const [key, value] of Object.entries(order.requiredStats)) {
    const statKey = key as keyof Pick<ScoreBundle, 'calm' | 'detox' | 'recovery' | 'vigor'>;
    const current = total[statKey];
    if (current < value) {
      missingReasons.push({
        gap: value - current,
        text: `${formatStatLabel(statKey)} 수치가 ${formatNumber(value)} 이상 필요합니다.`,
      });
    }
  }

  if (total.purity < order.minPurity) {
    missingReasons.push({
      gap: order.minPurity - total.purity,
      text: `순도가 ${formatNumber(order.minPurity)} 이상 필요합니다.`,
    });
  }

  if (total.sideEffect > order.maxSideEffect) {
    missingReasons.push({
      gap: total.sideEffect - order.maxSideEffect,
      text: `부작용이 ${formatNumber(order.maxSideEffect)} 이하여야 합니다.`,
    });
  }

  const hardRequirementsMet = missingReasons.length === 0;
  const bonusSatisfied = order.bonusTag ? tags.has(order.bonusTag) : false;

  let grade: GradeId = 'F';
  if (hardRequirementsMet) {
    grade = bonusSatisfied ? 'S' : 'A';
  } else if (missingReasons.length <= 2 && missingReasons.every((reason) => reason.gap <= 1)) {
    grade = 'B';
  } else if (missingReasons.length <= 3) {
    grade = 'C';
  }

  const rewardGold = Math.floor(order.baseReward * GRADE_MULTIPLIERS[grade])
    + (hardRequirementsMet && bonusSatisfied ? order.bonusReward : 0);

  return {
    orderId,
    baseLiquid,
    score: total,
    tags: [...tags],
    logs,
    missingReasons: missingReasons.map((reason) => reason.text),
    hardRequirementsMet,
    bonusSatisfied,
    grade,
    rewardGold,
    rentDue: RENT_BY_DAY[run.day] ?? 0,
    carryoverCandidates,
  };
}

function buildUpgradeChoices(run: RunState) {
  const pool = RUN_UPGRADES.filter(
    (upgrade) => upgrade.availableDay <= run.day && !run.chosenUpgradeIds.includes(upgrade.id),
  );
  return shuffle(pool).slice(0, 3).map((upgrade) => upgrade.id);
}

function createResultCopy(preview: CauldronPreview, goldAfterReward: number, goldAfterRent: number) {
  const order = getOrderById(preview.orderId);
  const copy = [
    `${order.name} 판정: ${preview.grade} / 보상 ${preview.rewardGold}골드`,
    `기반액 ${BASE_LIQUID_LABELS[preview.baseLiquid]} / 태그 ${preview.tags.map((tag) => TAG_LABELS[tag]).join(', ') || '없음'}`,
    `회복 ${formatNumber(preview.score.recovery)} · 진정 ${formatNumber(preview.score.calm)} · 활력 ${formatNumber(preview.score.vigor)} · 해독 ${formatNumber(preview.score.detox)}`,
    `순도 ${formatNumber(preview.score.purity)} / 부작용 ${formatNumber(preview.score.sideEffect)}`,
  ];

  if (!preview.hardRequirementsMet && preview.missingReasons.length > 0) {
    copy.push(`미달 조건: ${preview.missingReasons.join(' / ')}`);
  }

  copy.push(`조제 후 금고 ${goldAfterReward}골드`);

  if (preview.rentDue > 0) {
    copy.push(`오늘 임대료 ${preview.rentDue}골드 정산 후 ${goldAfterRent}골드`);
  }

  return copy;
}

function finalizeOutcome(run: RunState, preview: CauldronPreview, goldAfterRent: number) {
  if (goldAfterRent < 0) {
    return {
      outcome: 'rent-failed' as const,
      summary: createSummary('rent-failed', preview, run.day, goldAfterRent),
    };
  }

  if (run.day >= FINAL_DAY) {
    const outcome: RunOutcome = preview.grade === 'S' || preview.grade === 'A'
      ? 'audit-cleared'
      : 'audit-partial';
    return {
      outcome,
      summary: createSummary(outcome, preview, run.day, goldAfterRent),
    };
  }

  return {
    outcome: null,
    summary: '',
  };
}

export function createNewRun(save: PersistentSave): RunState {
  const run: RunState = {
    id: `run-${Date.now().toString(36)}`,
    day: 1,
    gold: 12,
    chosenUpgradeIds: [],
    discoveredMaterialIds: [...save.discoveredMaterialIds],
    discoveredOrderIds: [...save.discoveredOrderIds],
    extraSlotUsedDays: [],
    preservedIngredient: null,
    outcome: null,
    summaryNote: '',
    startedAt: Date.now(),
    activeDay: {
      phase: 'choose-order',
      orderChoices: [],
      selectedOrderId: null,
      materialOffers: [],
      bag: [],
      workbenchId: null,
      processedIngredientId: null,
      brewSlots: [],
      useExtraSlot: false,
      preview: null,
      resultCopy: [],
      upgradeChoices: [],
    },
  };
  run.activeDay = buildDayState(run);
  updateDiscovery(run, run.activeDay);
  return run;
}

export function abandonRun(run: RunState) {
  const next = cloneRun(run);
  next.outcome = 'abandoned';
  next.finishedAt = Date.now();
  next.summaryNote = createSummary(
    'abandoned',
    next.activeDay.preview ?? {
      orderId: next.activeDay.selectedOrderId ?? 'order_guild_audit',
      baseLiquid: 'water',
      bonusSatisfied: false,
      carryoverCandidates: [],
      grade: 'F',
      hardRequirementsMet: false,
      logs: [],
      missingReasons: [],
      rentDue: 0,
      rewardGold: 0,
      score: emptyScore(),
      tags: [],
    },
    next.day,
    next.gold,
  );
  next.activeDay.phase = 'finished';
  return next;
}

export function chooseOrder(run: RunState, orderId: string) {
  const next = cloneRun(run);
  next.activeDay.selectedOrderId = orderId;
  next.activeDay.phase = 'choose-bag';
  next.discoveredOrderIds = mergeUnique(next.discoveredOrderIds, [orderId]);
  return next;
}

export function setBagSelection(run: RunState, selectedOfferIds: string[]) {
  const next = cloneRun(run);
  const targetCount = next.preservedIngredient ? 4 : 5;
  if (selectedOfferIds.length !== targetCount) {
    return next;
  }

  const selectedOffers = next.activeDay.materialOffers.filter((ingredient) => selectedOfferIds.includes(ingredient.instanceId));
  if (selectedOffers.length !== targetCount) {
    return next;
  }

  next.activeDay.bag = next.preservedIngredient
    ? [next.preservedIngredient, ...selectedOffers]
    : selectedOffers;
  const canUseWorkbench = next.activeDay.workbenchId
    ? next.activeDay.bag.some((ingredient) => canProcessIngredientWithWorkbench(ingredient, next.activeDay.workbenchId as WorkbenchId))
    : false;
  next.activeDay.phase = canUseWorkbench ? 'workbench' : 'brew';
  next.activeDay.preview = null;
  next.activeDay.brewSlots = [];
  next.activeDay.useExtraSlot = false;
  next.activeDay.processedIngredientId = null;
  next.discoveredMaterialIds = mergeUnique(
    next.discoveredMaterialIds,
    next.activeDay.bag.map((ingredient) => ingredient.materialId),
  );
  return next;
}

export function applyWorkbench(run: RunState, ingredientId: string | null) {
  const next = cloneRun(run);
  const workbenchId = next.activeDay.workbenchId;
  if (!workbenchId) {
    return next;
  }

  next.activeDay.processedIngredientId = ingredientId;
  if (!ingredientId) {
    next.activeDay.phase = 'brew';
    return next;
  }

  next.activeDay.bag = next.activeDay.bag.map((ingredient) => {
    if (ingredient.instanceId !== ingredientId) {
      return ingredient;
    }

    const material = getMaterialById(ingredient.materialId);
    if (!material.processed || material.processed.workbenchId !== workbenchId) {
      return ingredient;
    }

    return {
      ...ingredient,
      formKey: 'processed',
      name: material.processed.name,
    };
  });
  next.activeDay.phase = 'brew';
  return next;
}

export function canUseExtraSlot(run: RunState) {
  return hasUpgrade(run, 'ONCE_EXTRA_SLOT') && !run.extraSlotUsedDays.includes(run.day);
}

export function setBrewPlan(run: RunState, brewSlots: string[], useExtraSlot: boolean) {
  const next = cloneRun(run);
  next.activeDay.brewSlots = brewSlots;
  next.activeDay.useExtraSlot = useExtraSlot;
  next.activeDay.preview = buildPreview(next, brewSlots, useExtraSlot);
  return next;
}

export function brewDay(run: RunState) {
  const next = cloneRun(run);
  const preview = buildPreview(next, next.activeDay.brewSlots, next.activeDay.useExtraSlot);
  if (!preview) {
    return next;
  }

  const goldAfterReward = next.gold + preview.rewardGold;
  const goldAfterRent = goldAfterReward - preview.rentDue;
  next.gold = goldAfterRent;
  next.activeDay.preview = preview;
  next.activeDay.resultCopy = createResultCopy(preview, goldAfterReward, goldAfterRent);
  next.activeDay.upgradeChoices = goldAfterRent >= 0 && next.day < FINAL_DAY ? buildUpgradeChoices(next) : [];
  next.activeDay.phase = 'result';

  if (next.activeDay.useExtraSlot && canUseExtraSlot(next)) {
    next.extraSlotUsedDays.push(next.day);
  }

  const finalized = finalizeOutcome(next, preview, goldAfterRent);
  if (finalized.outcome) {
    next.outcome = finalized.outcome;
    next.summaryNote = finalized.summary;
    next.finishedAt = Date.now();
  }

  return next;
}

export function continueToNextDay(run: RunState, upgradeId: string | null, carryoverId: string | null) {
  const next = cloneRun(run);
  const preview = next.activeDay.preview;
  if (!preview) {
    return next;
  }

  if (next.outcome) {
    next.activeDay.phase = 'finished';
    return next;
  }

  if (upgradeId && next.activeDay.upgradeChoices.includes(upgradeId)) {
    next.chosenUpgradeIds.push(upgradeId);
  }

  if (carryoverId && preview.carryoverCandidates.includes(carryoverId) && hasUpgrade(next, 'SAVE_ONE_UNUSED')) {
    const preserved = next.activeDay.bag.find((ingredient) => ingredient.instanceId === carryoverId);
    next.preservedIngredient = preserved ? { ...preserved, source: 'carryover' } : null;
  } else {
    next.preservedIngredient = null;
  }

  next.day += 1;
  next.activeDay = buildDayState(next);
  next.summaryNote = '';
  updateDiscovery(next, next.activeDay);
  return next;
}

export function formatOrderRequirementSummary(orderId: string) {
  const order = getOrderById(orderId);
  const parts: string[] = [];

  if (order.requiredBase) {
    parts.push(`기반액 ${BASE_LIQUID_LABELS[order.requiredBase]}`);
  }

  for (const tag of order.requiredTags) {
    parts.push(`태그 ${TAG_LABELS[tag]}`);
  }

  for (const [key, value] of Object.entries(order.requiredStats)) {
    parts.push(`${formatStatLabel(key as keyof ScoreBundle)} ${value}+`);
  }

  parts.push(`순도 ${order.minPurity}+`);
  parts.push(`부작용 ${order.maxSideEffect} 이하`);

  return parts;
}

export function formatUpgradeSummary(upgradeId: string) {
  const upgrade = getUpgradeById(upgradeId);
  return `${upgrade.label}: ${upgrade.body}`;
}

export function getEligibleWorkbenchTargets(run: RunState) {
  const workbenchId = run.activeDay.workbenchId;
  if (!workbenchId) {
    return [];
  }

  return run.activeDay.bag.filter((ingredient) => {
    return canProcessIngredientWithWorkbench(ingredient, workbenchId);
  });
}

export function getPreviewVisibility(run: RunState) {
  return hasUpgrade(run, 'FULL_PREVIEW');
}

export function getCurrentWorkbenchLabel(run: RunState) {
  const workbenchId = run.activeDay.workbenchId;
  return workbenchId ? WORKBENCHES[workbenchId] : null;
}

export function getCarryoverEnabled(run: RunState) {
  return hasUpgrade(run, 'SAVE_ONE_UNUSED');
}
