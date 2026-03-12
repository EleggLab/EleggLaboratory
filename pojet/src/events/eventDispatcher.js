import {
  SAMPLE_EVENTS,
  DECISION_PRESETS,
  CLASS_LABELS_KO,
  LINEAGE_LABELS_KO,
  BACKGROUND_LABELS_KO
} from "../config/runtimeData.js";
import { computeMaturityTier, maturityWeightBoost } from "../narrative/maturityTier.js";

const MATURE_CATEGORIES = new Set(["relationship", "corruption", "social", "market", "legacy"]);
const SENSUAL_LINEAGES = new Set(["succubus", "infernal"]);
const GENERIC_CHOICE_LABELS = new Set([
  "강행한다",
  "신중히 처리한다",
  "물러선다",
  "Push forward",
  "Negotiate terms",
  "Step back",
  "맹세를 따른다",
  "대가를 감수한다",
  "봉인하고 떠난다",
  "Commit to power",
  "Break and reset",
  "Balance and contain"
]);

const REGION_LABELS_KO = {
  "ashen-frontier": "검은비 변경",
  "gray-harbor": "회색 항구",
  "stella-hill": "성좌 언덕",
  "glass-lower": "유리탑 하층",
  "ashgate-ruins": "재문 폐허"
};

const CATEGORY_LABELS_KO = {
  social: "사회",
  relationship: "관계",
  faction: "세력",
  relic: "유물",
  market: "시장",
  faith: "신앙",
  corruption: "오염",
  travel: "여정",
  legacy: "계승"
};

const REPEAT_WINDOW_BY_TIER = { T2: 12, T3: 6 };
const MAX_CATEGORY_STREAK = 2;
const DERIVED_T1_PREFIX = "derived-t1";

const STORYLINE_CATEGORY_AFFINITY = {
  "battleworn-veteran": { faction: 1.2, corruption: 1.1, legacy: 1.0, relationship: 0.6 },
  "academy-prodigy": { social: 1.2, relationship: 1.1, relic: 0.8, faction: 0.5 },
  "mountain-adept": { relic: 1.3, faith: 1.0, travel: 0.8, corruption: 0.5 },
  "brothel-fixer": { relationship: 1.4, social: 1.2, market: 1.1, corruption: 0.8 },
  "thief-crew": { market: 1.3, travel: 1.1, social: 0.8, faction: 0.6 }
};

const CLASS_CATEGORY_AFFINITY = {
  bard: { relationship: 1.1, social: 1.0, market: 0.5 },
  fighter: { faction: 1.0, travel: 0.6, corruption: 0.4 },
  ranger: { travel: 1.0, relic: 0.6, social: 0.4 },
  warlock: { corruption: 1.1, relationship: 0.8, relic: 0.7 },
  monk: { social: 0.8, relationship: 0.6, faith: 0.5 },
  wizard: { relic: 1.0, faith: 0.7, corruption: 0.5 },
  rogue: { market: 1.1, social: 0.8, travel: 0.7 },
  sorcerer: { market: 0.9, relationship: 0.8, faction: 0.4 },
  cleric: { faith: 1.2, relic: 0.7, corruption: 0.3 },
  druid: { travel: 0.9, faith: 0.6, relic: 0.5 },
  paladin: { faith: 1.0, faction: 0.7, corruption: 0.2 },
  barbarian: { travel: 0.8, faction: 0.7, corruption: 0.4 }
};

const BACKGROUND_CATEGORY_AFFINITY = {
  "orphan-cutpurse": { market: 1.0, social: 0.8, travel: 0.6 },
  "border-conscript": { faction: 1.0, corruption: 0.7, legacy: 0.5 },
  "fallen-bastard": { legacy: 1.1, faction: 0.9, relationship: 0.7 },
  "tower-dropout": { relic: 1.1, faith: 0.7, corruption: 0.5 },
  "funeral-aide": { relationship: 1.3, market: 0.8, social: 0.8 },
  "caravan-guard": { travel: 1.0, social: 0.6, faction: 0.5 },
  "forest-watch": { travel: 0.9, relic: 0.8, faith: 0.5 },
  "smuggler-runner": { market: 1.2, travel: 0.9, faction: 0.5 },
  "relic-digger": { legacy: 1.0, relic: 1.0, corruption: 0.6 },
  "crusade-runner": { faith: 0.9, faction: 0.8, legacy: 0.6 }
};

const LINEAGE_CATEGORY_AFFINITY = {
  human: { social: 0.6, faction: 0.5, relationship: 0.5 },
  longkin: { relic: 0.9, relationship: 0.7, faith: 0.6 },
  succubus: { relationship: 1.4, corruption: 1.1, market: 0.8 },
  infernal: { corruption: 1.3, relic: 0.8, faction: 0.6 },
  draconic: { faction: 0.9, legacy: 0.8, corruption: 0.5 },
  "mixed-grace": { relationship: 0.8, travel: 0.8, social: 0.7 },
  "mixed-fury": { corruption: 1.0, travel: 0.7, faction: 0.6 },
  smallkin: { social: 0.7, market: 0.7, travel: 0.6 },
  smallfoot: { corruption: 1.0, relationship: 0.8, relic: 0.6 },
  stonefolk: { relic: 0.8, faction: 0.6, legacy: 0.6 }
};

export function maybeDispatchDecisionEvent(state, contentPack) {
  if (state?.activeDecisionEvent) return null;

  const tick = Number(state?.time?.tick || 0);
  if (tick < 1) return null;

  const t2BasePool = contentPack?.eventsT2?.length ? contentPack.eventsT2 : SAMPLE_EVENTS.t2;
  const t2Pool = withDerivedT1Events(t2BasePool, contentPack?.eventsT1 || []);
  const t3Pool = contentPack?.eventsT3?.length ? contentPack.eventsT3 : SAMPLE_EVENTS.t3;
  if (!t2Pool.length && !t3Pool.length) return null;

  // 1로그 1선택: 마지막 이벤트 오픈 이후 1틱이 지나면 다시 선택지를 연다.
  const lastOpenedTick = getLastOpenedTick(state);
  const sinceLastOpen = lastOpenedTick > 0 ? tick - lastOpenedTick : tick;
  if (sinceLastOpen < 1) return null;

  // T3는 가끔만 열어 큰 분기의 무게를 유지한다.
  const openedCount = Number((state?.history?.events || []).filter((e) => e?.stage === "opened").length || 0);
  const openedMature = Number((state?.history?.events || []).filter((e) => e?.stage === "opened" && MATURE_CATEGORIES.has(String(e?.category || ""))).length || 0);
  const act = Number(state?.world?.act || 1);
  const forceT3 = act >= 2 && openedCount > 0 && openedCount % 10 === 0;
  const maturity = computeMaturityTier({ state, phase: "event" });
  const preferMature = forceT3 || maturity.level >= 3;

  // First-player perception fix:
  // If early game has no mature-category event yet, force one from T2 to establish adult identity quickly.
  const needsIdentitySignal = openedCount < 3 && openedMature === 0;
  if (needsIdentitySignal) {
    const earlyMaturePool = t2Pool.filter((event) => MATURE_CATEGORIES.has(String(event?.category || "")));
    const forcedPick = selectEventForState(earlyMaturePool, state, maturity, true);
    if (forcedPick?.event) {
      return normalizeEvent({
        ...structuredClone(forcedPick.event),
        forcedIdentitySignal: true,
        selectionDebug: { ...(forcedPick.selectionDebug || {}), source: "forced-identity" }
      }, state);
    }
  }

  const tier = forceT3 ? "T3" : "T2";
  const selectedPick = tier === "T3"
    ? selectEventForState(t3Pool, state, maturity, preferMature) || selectEventForState(t2Pool, state, maturity, preferMature)
    : selectEventForState(t2Pool, state, maturity, preferMature) || selectEventForState(t3Pool, state, maturity, preferMature);

  if (!selectedPick?.event) return null;
  return normalizeEvent({
    ...structuredClone(selectedPick.event),
    selectionDebug: selectedPick.selectionDebug || null
  }, state);
}

export function resolveTimedChoice(state, event) {
  const presetId = state?.automation?.decisionPresetId || "신중형";
  const preset = DECISION_PRESETS[presetId] || DECISION_PRESETS["신중형"];
  const mode = preset.t2DefaultChoice;

  if (!event?.choices?.length) return null;

  const hp = Number(state?.character?.hp || 0);
  const maxHp = Number(state?.character?.maxHp || 1);
  const hpRatio = maxHp > 0 ? hp / maxHp : 1;
  if (hpRatio <= 0.25) {
    const safe = event.choices.find((c) => c.id === "c3" || c.id === "withdraw" || c.id === "seal" || c.id === "decline" || c.id === "reject");
    return safe || event.choices[event.choices.length - 1];
  }

  if (mode === "safest") return event.choices[event.choices.length - 1];
  if (mode === "bold") return event.choices[0];
  if (mode === "profit") {
    const rich = event.choices.find((c) => c.effects?.some((fx) => fx.kind === "gain_gold" && fx.value > 0));
    return rich || event.choices[0];
  }
  if (mode === "mercy") return event.choices.find((c) => c.id === "seal" || c.id === "reject" || c.id === "decline") || event.choices[event.choices.length - 1];
  if (mode === "dominance") return event.choices[0];
  if (mode === "bond") return event.choices.find((c) => c.effects?.some((fx) => fx.kind === "relation")) || event.choices[0];
  if (mode === "oath") return event.choices.find((c) => c.id === "temple" || c.id === "seal" || c.id === "oath") || event.choices[0];

  return event.choices[0];
}

export function shouldForcePause(event) {
  return Boolean(event?.tier === "T3" || event?.mustPause);
}

function getLastOpenedTick(state) {
  const events = Array.isArray(state?.history?.events) ? state.history.events : [];
  let latest = 0;
  for (const entry of events) {
    if (typeof entry?.tick === "number" && entry.tick > latest) latest = entry.tick;
  }
  return latest;
}

function selectEventForState(pool, state, maturity, preferMature = false) {
  if (!Array.isArray(pool) || !pool.length) return null;

  const inspected = pool
    .map((event) => inspectEvent(event, state, maturity))
    .filter((x) => x.triggerOk);

  if (!inspected.length) {
    return {
      event: structuredClone(pool[Math.floor(Math.random() * pool.length)]),
      selectionDebug: {
        source: "fallback-random",
        candidateCount: pool.length,
        reason: "trigger 조건을 만족한 후보가 없어 풀에서 임의 선택"
      }
    };
  }

  // Prefer non-repeating candidates; if exhausted, relax back to full inspected list.
  const nonRepeating = inspected.filter((x) => !x.repeatHardBlock);
  const candidatePool = nonRepeating.length ? nonRepeating : inspected;

  const profileHeavy = candidatePool.filter((x) => x.profileHitCount >= 2 && x.profileCoreMatch);
  const profileMedium = candidatePool.filter((x) => x.profileHitCount >= 1 || x.profileCoreMatch);
  const backgroundPreferred = candidatePool.filter((x) => x.backgroundOk);
  const storylinePreferred = candidatePool.filter((x) => x.storylineOk);
  const openedCount = Number((state?.history?.events || []).filter((e) => e?.stage === "opened").length || 0);
  const enforceProfileEarly = openedCount <= 10;
  const enforceBackgroundEarly = openedCount <= 12 && backgroundPreferred.length >= 2;
  const enforceStorylineEarly = openedCount <= 12 && storylinePreferred.length >= 2;
  const relaxed = profileHeavy.length
    ? profileHeavy
    : (profileMedium.length ? profileMedium : candidatePool);
  const finalPool = enforceBackgroundEarly
    ? backgroundPreferred
    : (enforceStorylineEarly
      ? storylinePreferred
      : ((enforceProfileEarly && profileMedium.length >= 3) ? profileMedium : relaxed));

  const weighted = finalPool.map((x) => {
    let weight = 1 + x.score;
    if (preferMature && MATURE_CATEGORIES.has(String(x.event.category || ""))) weight += 2.4;
    const level = Number(maturity?.level || 1);
    weight *= maturityWeightBoost(level, x.event.category);
    if (x.recencyPenalty > 0) weight = Math.max(0.15, weight - x.recencyPenalty);
    return { event: x.event, weight, inspect: x };
  });

  const picked = weightedPick(weighted);
  if (picked?.event) {
    return {
      event: picked.event,
      selectionDebug: buildSelectionDebug(
        picked.inspect,
        state,
        preferMature,
        "weighted",
        {
          weight: Number(picked.weight || 0),
          candidateCount: weighted.length,
          strictCount: profileHeavy.length,
          mediumCount: profileMedium.length,
          relaxedCount: finalPool.length,
          profileEarlyLock: enforceProfileEarly,
          backgroundEarlyLock: enforceBackgroundEarly,
          storylineEarlyLock: enforceStorylineEarly
        }
      )
    };
  }

  const fallbackEvent = pickLeastRecentlySeen(finalPool, state);
  if (!fallbackEvent) return null;
  const fallbackRow = finalPool.find((row) => eventKey(row?.event) === eventKey(fallbackEvent));
  return {
    event: fallbackEvent,
    selectionDebug: buildSelectionDebug(
      fallbackRow,
      state,
      preferMature,
      "least-recent",
      {
        candidateCount: finalPool.length,
        strictCount: profileHeavy.length,
        mediumCount: profileMedium.length,
        relaxedCount: finalPool.length,
        profileEarlyLock: enforceProfileEarly,
        backgroundEarlyLock: enforceBackgroundEarly,
        storylineEarlyLock: enforceStorylineEarly
      }
    )
  };
}

function inspectEvent(event, state, maturity) {
  const classId = state?.character?.classId;
  const backgroundId = state?.character?.backgroundId;
  const lineageId = state?.character?.lineageId;
  const storylineId = state?.character?.storylineId;
  const topStats = strongestAbilities(state);
  const classAffinity = Array.isArray(event?.classAffinity) ? event.classAffinity : [];
  const backgroundAffinity = Array.isArray(event?.backgroundAffinity) ? event.backgroundAffinity : [];
  const lineageAffinity = Array.isArray(event?.lineageAffinity) ? event.lineageAffinity : [];
  const storylineAffinity = Array.isArray(event?.storylineAffinity) ? event.storylineAffinity : [];
  const statAffinity = Array.isArray(event?.statAffinity) ? event.statAffinity : [];
  const category = String(event?.category || "");

  const classCategoryBoost = affinityWeight(CLASS_CATEGORY_AFFINITY, classId, category);
  const backgroundCategoryBoost = affinityWeight(BACKGROUND_CATEGORY_AFFINITY, backgroundId, category);
  const lineageCategoryBoost = affinityWeight(LINEAGE_CATEGORY_AFFINITY, lineageId, category);
  const storylineCategoryBoost = affinityWeight(STORYLINE_CATEGORY_AFFINITY, storylineId, category);

  const classExplicitMatch = !classAffinity.length || classAffinity.includes(classId);
  const backgroundExplicitMatch = !backgroundAffinity.length || backgroundAffinity.includes(backgroundId);
  const classOk = classExplicitMatch || classCategoryBoost >= 0.8;
  const backgroundOk = backgroundExplicitMatch || backgroundCategoryBoost >= 0.6;
  const lineageOk = lineageAffinity.length
    ? lineageAffinity.includes(lineageId)
    : lineageCategoryBoost >= 0.75;
  const storylineOk = storylineAffinity.length
    ? storylineAffinity.includes(storylineId)
    : storylineCategoryBoost >= 0.8;
  const statOk = !statAffinity.length || statAffinity.some((s) => topStats.includes(s));
  const oneShotBlocked = Boolean(event?.oneShot && countEventSeen(state, eventKey(event)) > 0);
  const triggerOk = passesTrigger(event, state) && passesCooldown(event, state) && !oneShotBlocked;
  const repeatSignals = computeRepeatSignals(event, state);
  const recencyPenalty = computeRecencyPenalty(event, state) + repeatSignals.penalty;

  let score = 0;
  if (classOk) score += 2.4;
  if (backgroundOk) score += 2.8;
  if (lineageOk) score += 2.1;
  if (storylineOk) score += 2.6;
  if (statOk) score += 1.5;
  score += classCategoryBoost * 1.2;
  score += backgroundCategoryBoost * 1.3;
  score += lineageCategoryBoost * 1.15;
  score += storylineCategoryBoost * 1.5;
  if (MATURE_CATEGORIES.has(String(event?.category || ""))) score += 1;
  if ((maturity?.level || 1) >= 4 && MATURE_CATEGORIES.has(String(event?.category || ""))) score += 1.25;
  if ((maturity?.level || 1) <= 2 && !MATURE_CATEGORIES.has(String(event?.category || ""))) score += 0.65;
  if (Array.isArray(event?.chronicleTags) && event.chronicleTags.length) score += 0.6;

  const profileCoreMatch = hasCoreProfileHit({ classOk, backgroundOk, lineageOk, storylineOk });
  const totalProfileHits = profileHitCount({ classOk, backgroundOk, lineageOk, storylineOk, statOk });

  return {
    event,
    classOk,
    backgroundOk,
    lineageOk,
    storylineOk,
    statOk,
    profileCoreMatch,
    profileHitCount: totalProfileHits,
    profileSignals: {
      classCategoryBoost,
      backgroundCategoryBoost,
      lineageCategoryBoost,
      storylineCategoryBoost
    },
    triggerOk,
    score,
    recencyPenalty,
    repeatHardBlock: repeatSignals.hardBlock
  };
}

function buildSelectionDebug(row, state, preferMature, source, extras = {}) {
  const r = row || {};
  const id = eventKey(r.event);
  return {
    source,
    preferMature: Boolean(preferMature),
    classMatch: Boolean(r.classOk),
    backgroundMatch: Boolean(r.backgroundOk),
    lineageMatch: Boolean(r.lineageOk),
    storylineMatch: Boolean(r.storylineOk),
    statMatch: Boolean(r.statOk),
    strictMatch: Boolean(r.profileHitCount >= 2 && r.profileCoreMatch),
    profileCoreMatch: Boolean(r.profileCoreMatch),
    profileHitCount: Number(r.profileHitCount || 0),
    recencyPenalty: Number((r.recencyPenalty || 0).toFixed(2)),
    repeatHardBlock: Boolean(r.repeatHardBlock),
    baseScore: Number((r.score || 0).toFixed(2)),
    profileSignals: {
      classCategoryBoost: Number((r?.profileSignals?.classCategoryBoost || 0).toFixed(2)),
      backgroundCategoryBoost: Number((r?.profileSignals?.backgroundCategoryBoost || 0).toFixed(2)),
      lineageCategoryBoost: Number((r?.profileSignals?.lineageCategoryBoost || 0).toFixed(2)),
      storylineCategoryBoost: Number((r?.profileSignals?.storylineCategoryBoost || 0).toFixed(2))
    },
    seenCount: countEventSeen(state, id),
    weight: Number((extras.weight || 0).toFixed(3)),
    candidateCount: Number(extras.candidateCount || 0),
    strictCount: Number(extras.strictCount || 0),
    mediumCount: Number(extras.mediumCount || 0),
    relaxedCount: Number(extras.relaxedCount || 0),
    profileEarlyLock: Boolean(extras.profileEarlyLock),
    backgroundEarlyLock: Boolean(extras.backgroundEarlyLock),
    storylineEarlyLock: Boolean(extras.storylineEarlyLock)
  };
}

function strongestAbilities(state) {
  const entries = Object.entries(state?.character?.abilities || {});
  return entries
    .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))
    .slice(0, 3)
    .map(([k]) => k);
}

function affinityWeight(map, key, category) {
  if (!key || !category) return 0;
  const byKey = map?.[String(key)] || null;
  if (!byKey) return 0;
  return Number(byKey[String(category)] || 0);
}

function hasCoreProfileHit(row) {
  return Boolean(row?.classOk || row?.backgroundOk || row?.lineageOk || row?.storylineOk);
}

function profileHitCount(row) {
  return Number(Boolean(row?.classOk))
    + Number(Boolean(row?.backgroundOk))
    + Number(Boolean(row?.lineageOk))
    + Number(Boolean(row?.storylineOk))
    + Number(Boolean(row?.statOk));
}

function passesTrigger(event, state) {
  const trig = event?.triggerConditions || {};
  const act = Number(state?.world?.act || 1);
  const lvl = Number(state?.character?.level || 1);

  if (act < Number(trig?.actMin || 1)) return false;
  if (Number.isFinite(Number(trig?.actMax)) && act > Number(trig.actMax)) return false;
  if (lvl < Number(trig?.minLevel || 1)) return false;
  if (Number.isFinite(Number(trig?.maxLevel)) && lvl > Number(trig.maxLevel)) return false;

  const tags = new Set([...(state?.character?.tags || []), ...(state?.chronicle?.legacyFlags || [])]);
  const requires = Array.isArray(trig?.requires) ? trig.requires : [];
  const excludes = Array.isArray(trig?.excludes) ? trig.excludes : [];
  if (requires.some((k) => !tags.has(k))) return false;
  if (excludes.some((k) => tags.has(k))) return false;
  return true;
}

function eventKey(event) {
  return String(event?.eventId || event?.id || "");
}

function openedHistory(state) {
  const events = Array.isArray(state?.history?.events) ? state.history.events : [];
  return events.filter((e) => e?.stage === "opened" && e?.eventId);
}

function lastOpenedTickFor(state, id) {
  if (!id) return -1;
  const events = openedHistory(state);
  for (const e of events) {
    if (String(e.eventId) === String(id) && Number.isFinite(Number(e.tick))) return Number(e.tick);
  }
  return -1;
}

function passesCooldown(event, state) {
  const id = eventKey(event);
  if (!id) return true;
  const lastTick = lastOpenedTickFor(state, id);
  if (lastTick < 0) return true;
  const now = Number(state?.time?.tick || 0);
  const cooldown = Number(event?.cooldown || (event?.tier === "T3" ? 14 : 6));
  return now - lastTick >= cooldown;
}

function computeRecencyPenalty(event, state) {
  const id = eventKey(event);
  const category = String(event?.category || "");
  const tier = String(event?.tier || "");
  if (!id) return 0;
  const recent = openedHistory(state).slice(0, 8);
  if (!recent.length) return 0;

  let penalty = 0;
  const top = recent[0];
  if (String(top?.eventId || "") === id) penalty += 2.8;
  const freq = recent.filter((e) => String(e.eventId) === id).length;
  if (freq >= 2) penalty += 1.6;
  if (freq >= 3) penalty += 1.2;

  const sameCategory = recent.filter((e) => String(e.category || "") === category).length;
  if (category && sameCategory >= 3) penalty += 1.1;
  if (category && sameCategory >= 5) penalty += 1.0;

  const sameTier = recent.filter((e) => String(e.tier || "") === tier).length;
  if (tier === "T3" && sameTier >= 2) penalty += 1.3;

  return penalty;
}

function countEventSeen(state, id) {
  if (!id) return 0;
  return openedHistory(state).filter((e) => String(e.eventId || "") === String(id)).length;
}

function recentCategoryStreak(state, category) {
  if (!category) return 0;
  const recent = openedHistory(state).slice(0, 8);
  let streak = 0;
  for (const row of recent) {
    if (String(row?.category || "") !== String(category)) break;
    streak += 1;
  }
  return streak;
}

function computeRepeatSignals(event, state) {
  const id = eventKey(event);
  const tier = String(event?.tier || "T2");
  const category = String(event?.category || "");
  const window = REPEAT_WINDOW_BY_TIER[tier] || REPEAT_WINDOW_BY_TIER.T2;
  const recent = openedHistory(state).slice(0, Math.max(8, window + 2));

  let hardBlock = false;
  let penalty = 0;

  if (id) {
    const withinWindow = recent.slice(0, window).some((row) => String(row?.eventId || "") === id);
    if (withinWindow) hardBlock = true;
    const seenCount = recent.filter((row) => String(row?.eventId || "") === id).length;
    if (seenCount >= 1) penalty += 1.8;
    if (seenCount >= 2) penalty += 1.4;
    if (seenCount >= 3) penalty += 1.1;
  }

  const categoryStreak = recentCategoryStreak(state, category);
  if (categoryStreak >= MAX_CATEGORY_STREAK) hardBlock = true;
  if (categoryStreak > 0) penalty += categoryStreak * 0.8;

  return { hardBlock, penalty };
}

function pickLeastRecentlySeen(inspectedRows, state) {
  if (!Array.isArray(inspectedRows) || !inspectedRows.length) return null;
  const ranked = inspectedRows
    .map((row) => {
      const id = eventKey(row?.event);
      const seen = countEventSeen(state, id);
      const lastTick = lastOpenedTickFor(state, id);
      return { row, seen, lastTick };
    })
    .sort((a, b) => {
      if (a.seen !== b.seen) return a.seen - b.seen;
      return a.lastTick - b.lastTick;
    });
  return ranked[0]?.row?.event || null;
}

function withDerivedT1Events(t2BasePool, eventsT1) {
  const base = Array.isArray(t2BasePool) ? t2BasePool : [];
  const t1 = Array.isArray(eventsT1) ? eventsT1 : [];
  if (!t1.length) return base;

  const merged = new Map();
  base.forEach((evt) => {
    const id = String(evt?.id || evt?.eventId || "");
    if (id) merged.set(id, evt);
  });

  t1.forEach((evt, idx) => {
    const derived = deriveT2FromT1(evt, idx);
    if (!derived) return;
    if (!merged.has(derived.id)) merged.set(derived.id, derived);
  });

  return [...merged.values()];
}

function deriveT2FromT1(event, idx = 0) {
  if (!event || typeof event !== "object") return null;
  const sourceId = String(event.id || `t1-${idx + 1}`);
  const id = `${DERIVED_T1_PREFIX}-${sourceId}`;
  const category = String(event.category || "social");
  const choices = deriveChoicesFromCategory(category);

  return {
    id,
    tier: "T2",
    category,
    regionTags: Array.isArray(event.regionTags) ? [...event.regionTags] : [],
    classAffinity: Array.isArray(event.classAffinity) ? [...event.classAffinity] : [],
    statAffinity: Array.isArray(event.statAffinity) ? [...event.statAffinity] : [],
    backgroundAffinity: Array.isArray(event.backgroundAffinity) ? [...event.backgroundAffinity] : [],
    triggerConditions: event.triggerConditions || { actMin: 1, minLevel: 1, requires: [], excludes: [] },
    narrativeText: String(event.narrativeText || event.logSummary || "잠복한 기류가 선택의 순간으로 번졌다."),
    logSummary: String(event.logSummary || `파생 사건 #${idx + 1}`),
    defaultResolution: "preset",
    outcomes: Array.isArray(event.outcomes) ? structuredClone(event.outcomes) : [],
    cooldown: Math.max(8, Number(event.cooldown || 4) + 4),
    oneShot: false,
    chronicleTags: [...new Set([...(event.chronicleTags || []), "derived-t1", "t2-choice"])],
    portraitStateEffects: Array.isArray(event.portraitStateEffects) ? [...event.portraitStateEffects] : [],
    followUpEventIds: Array.isArray(event.followUpEventIds) ? [...event.followUpEventIds] : [],
    choices
  };
}

function deriveChoicesFromCategory(category) {
  const rel = { kind: "relation", value: { tension: 1, trust: 1 } };
  const relSoft = { kind: "relation", value: { trust: 2, tension: -1 } };
  const relDark = { kind: "relation", value: { desire: 2, fear: 1 } };

  if (category === "corruption" || category === "relic") {
    return [
      { id: "c1", label: "강행한다", effects: [{ kind: "gain_gold", value: 12 }, { kind: "taint", value: 3 }, relDark] },
      { id: "c2", label: "신중히 처리한다", effects: [{ kind: "gain_xp", value: 12 }, { kind: "renown", value: 1 }, rel] },
      { id: "c3", label: "물러선다", effects: [{ kind: "gain_xp", value: 9 }, { kind: "fatigue", value: 1 }, relSoft] }
    ];
  }
  if (category === "faction" || category === "market") {
    return [
      { id: "c1", label: "강행한다", effects: [{ kind: "gain_gold", value: 14 }, rel, { kind: "renown", value: -1 }] },
      { id: "c2", label: "신중히 처리한다", effects: [{ kind: "gain_xp", value: 10 }, { kind: "renown", value: 2 }, relSoft] },
      { id: "c3", label: "물러선다", effects: [{ kind: "gain_xp", value: 8 }, { kind: "fatigue", value: 1 }, { kind: "renown", value: 1 }] }
    ];
  }
  return [
    { id: "c1", label: "강행한다", effects: [{ kind: "gain_gold", value: 10 }, { kind: "gain_xp", value: 8 }, relDark] },
    { id: "c2", label: "신중히 처리한다", effects: [{ kind: "gain_xp", value: 10 }, { kind: "renown", value: 2 }, rel] },
    { id: "c3", label: "물러선다", effects: [{ kind: "gain_xp", value: 9 }, { kind: "fatigue", value: 1 }, relSoft] }
  ];
}

function normalizeEvent(event, state) {
  if (!event) return null;
  const normalized = {
    ...event,
    eventId: event.eventId || event.id,
    title: event.title || event.logSummary || event.id,
    text: event.text || event.narrativeText || "",
    timeoutSec: event.timeoutSec ?? (event.tier === "T2" ? 10 : 0),
    mustPause: event.mustPause ?? event.tier === "T3"
  };

  normalized.title = expandEventTitle(normalized);
  normalized.identitySignal = MATURE_CATEGORIES.has(String(normalized?.category || "")) ? "adult" : "neutral";
  normalized.toneHint = toneHint(normalized);
  normalized.choices = diversifyChoices(normalized, state).map((choice, idx) => ({
    ...choice,
    label: localizeChoiceLabel(choice, normalized, idx, state)
  }));
  normalized.text = expandEventText(normalized, state);
  return normalized;
}

function toneHint(event) {
  const category = String(event?.category || "");
  if (event?.forcedIdentitySignal) return "초반 몰입 훅";
  if (!MATURE_CATEGORIES.has(category)) return "서사/전술 분기";
  if (category === "relationship") return "유혹/관계 밀도 상승";
  if (category === "corruption") return "금기/타락 압력 상승";
  if (category === "market") return "거래와 욕망의 교환";
  if (category === "social") return "관계와 평판의 긴장";
  if (category === "legacy") return "쾌락/권력 루트 각인";
  return "성인 다크판타지 분기";
}

function diversifyChoices(event, state) {
  const base = Array.isArray(event?.choices) ? structuredClone(event.choices) : [];
  if (!base.length) return base;

  const add = buildBonusChoice(event, base.length, state);
  if (add) base.push(add);

  const trait = buildTraitChoice(event, base.length, state);
  if (trait) base.push(trait);

  const seed = String(event.eventId || event.id || event.title || "").length + Number(event?.timeoutSec || 0);
  const rotated = rotate(base, seed % base.length);
  return rotated.slice(0, Math.min(5, rotated.length));
}

function buildBonusChoice(event, idx, state) {
  const category = String(event?.category || "");

  if (category === "relationship") {
    return {
      id: `bonus-${idx}`,
      label: "시선과 침묵으로 협상 우위를 만든다",
      effects: [{ kind: "renown", value: 1 }, { kind: "relation", value: { desire: 2, tension: 1 } }, { kind: "taint", value: 1 }]
    };
  }

  if (category === "corruption") {
    return {
      id: `bonus-${idx}`,
      label: "대가를 계산한 뒤 금지안을 받아들인다",
      effects: [{ kind: "gain_gold", value: 16 }, { kind: "taint", value: 3 }, { kind: "relation", value: { desire: 1, fear: 1 } }]
    };
  }

  if (category === "market" || category === "social") {
    return {
      id: `bonus-${idx}`,
      label: "조건을 재정렬해 안전장치를 건다",
      effects: [{ kind: "gain_gold", value: 12 }, { kind: "relation", value: { trust: 1, tension: 1 } }]
    };
  }

  if (category === "faction") {
    return {
      id: `bonus-${idx}`,
      label: "양측 모두에 빚을 남겨 다음 판을 연다",
      effects: [{ kind: "faction", value: { guild: 1, temple: 1 } }, { kind: "infamy", value: 1 }]
    };
  }

  const desire = Number(state?.relationships?.npcRelations?.core?.desire || 0);
  if (desire >= 22) {
    return {
      id: `bonus-${idx}`,
      label: "긴장선을 낮추고 신뢰를 회복한다",
      effects: [{ kind: "renown", value: 1 }, { kind: "relation", value: { desire: 1, trust: 1 } }]
    };
  }

  return null;
}

function buildTraitChoice(event, idx, state) {
  const c = state?.character || {};
  const category = String(event?.category || "");
  const cha = Number(c?.abilities?.CHA || 10);
  const wis = Number(c?.abilities?.WIS || 10);

  if (
    (cha >= 15 || ["bard", "sorcerer", "warlock"].includes(c.classId))
    && ["relationship", "social", "market"].includes(category)
  ) {
    return {
      id: `trait-cha-${idx}`,
      label: "카리스마로 분위기를 장악한다",
      effects: [{ kind: "renown", value: 2 }, { kind: "relation", value: { desire: 2, trust: 1 } }, { kind: "taint", value: 1 }]
    };
  }

  if (SENSUAL_LINEAGES.has(c.lineageId) && ["corruption", "relic", "relationship"].includes(category)) {
    return {
      id: `trait-lineage-${idx}`,
      label: "혈통의 본능을 따라 위험한 제안을 받는다",
      effects: [{ kind: "gain_gold", value: 14 }, { kind: "relation", value: { desire: 2, fear: 1 } }, { kind: "chronicle_tag", value: "lineage-desire-route" }]
    };
  }

  if (["smuggler-runner", "orphan-cutpurse"].includes(c.backgroundId) && ["market", "faction", "social"].includes(category)) {
    return {
      id: `trait-bg-${idx}`,
      label: "뒷골목 네트워크로 거래선을 우회한다",
      effects: [{ kind: "gain_gold", value: 18 }, { kind: "faction", value: { underbelly: 2, nobility: -1 } }]
    };
  }

  if ((wis >= 14 || ["cleric", "druid"].includes(c.classId)) && ["corruption", "relic", "faith"].includes(category)) {
    return {
      id: `trait-wis-${idx}`,
      label: "의식 절차로 오염 비용을 낮춘다",
      effects: [{ kind: "taint", value: -2 }, { kind: "renown", value: 1 }, { kind: "blessing", value: 1 }]
    };
  }

  return null;
}

function expandEventText(event, state) {
  const baseRaw = String(event?.text || event?.narrativeText || "").trim();
  const base = isGenericNarrative(baseRaw) ? buildNarrativeByCategory(event, state) : baseRaw;
  const category = String(event?.category || "social");
  const cls = CLASS_LABELS_KO[state?.character?.classId] || state?.character?.classId || "무명 클래스";
  const lineage = LINEAGE_LABELS_KO[state?.character?.lineageId] || state?.character?.lineageId || "무명 혈통";
  const background = BACKGROUND_LABELS_KO[state?.character?.backgroundId] || state?.character?.backgroundId || "무명 배경";
  const strong = strongestAbilities(state).join("/");
  const desire = Number(state?.relationships?.npcRelations?.core?.desire || 0);
  const tension = Number(state?.relationships?.npcRelations?.core?.tension || 0);
  const fear = Number(state?.relationships?.npcRelations?.core?.fear || 0);

  const categoryTone = {
    relationship: "시선과 침묵의 간격이 관계 축을 빠르게 흔든다.",
    corruption: "금단의 이득은 달콤하지만 오염의 이자는 느리게 쌓인다.",
    social: "짧은 대화도 소문과 욕망을 동시에 부른다.",
    market: "거래 성과와 평판 손실이 늘 같은 저울에 오른다.",
    relic: "유물은 힘을 주는 대신 장기 분기의 문턱을 높인다.",
    faction: "한 진영의 손을 잡는 순간 다른 진영의 문이 닫힌다.",
    faith: "원칙을 지키면 안전해지지만 기회 창이 좁아진다.",
    legacy: "이번 결단의 흔적은 다음 생의 출발점에 남는다."
  }[category] || "이번 결단은 관계, 자원, 평판 중 최소 하나를 크게 흔든다.";

  const relationTone = describeRelationPressure(desire, tension, fear);
  const profileLine = `${lineage} ${cls} (${background})는 강점 ${strong} 중심으로 이번 협상 방식의 결을 만든다.`;
  const riskLine = event?.tier === "T3"
    ? "대형 분기다. 되돌리기 어렵고 이후 사건의 우선순위가 재배치된다."
    : "중형 분기다. 미응답 시 자동 처리 규칙이 작동할 수 있다.";

  return [base, categoryTone, relationTone, profileLine, riskLine].filter(Boolean).join("\n\n");
}

function expandEventTitle(event) {
  const current = String(event?.title || "").trim();
  if (!isGenericTitle(current)) return current;
  const region = regionLabel(event?.regionTags?.[0]);
  const cat = CATEGORY_LABELS_KO[String(event?.category || "")] || "분기";
  return event?.tier === "T3" ? `${region} ${cat} 결단` : `${region} ${cat} 분기`;
}

function localizeChoiceLabel(choice, event, idx, state) {
  const category = String(event?.category || "social");
  const id = String(choice?.id || "");
  const current = String(choice?.label || "").trim();
  const eventSeed = eventHash(event?.eventId || event?.id || event?.title || "");
  const seen = countEventSeen(state, event?.eventId || event?.id);
  let candidate = "";
  if (!current || GENERIC_CHOICE_LABELS.has(current)) {
    const generated = generatedChoiceLabel(category, event?.tier, id, idx, eventSeed + seen);
    candidate = decorateChoiceLabel(generated, category, idx, eventSeed + seen);
  } else {
    candidate = decorateChoiceLabel(current, category, idx, eventSeed + seen);
  }
  return dedupeChoiceLabel(candidate, category, id, idx, state, eventSeed + seen);
}

function dedupeChoiceLabel(label, category, id, idx, state, seed = 0) {
  const base = String(label || "선택").trim();
  if (!base) return "선택";
  const recent = recentResolvedChoiceLabels(state, 12);
  if (!recent.includes(base)) return base;

  const altPool = choiceVariationPool(category, id);
  for (let i = 0; i < altPool.length; i += 1) {
    const suffix = pickByIndex(altPool, seed + idx + i);
    const candidate = `${base} · ${suffix}`;
    if (!recent.includes(candidate)) return candidate;
  }

  return `${base} · 변주 ${((seed + idx) % 3) + 1}`;
}

function recentResolvedChoiceLabels(state, limit = 10) {
  const rows = Array.isArray(state?.history?.events) ? state.history.events : [];
  return rows
    .filter((x) => x?.stage === "resolved" && typeof x?.choiceLabel === "string")
    .slice(0, limit)
    .map((x) => String(x.choiceLabel).trim())
    .filter(Boolean);
}

function choiceVariationPool(category, id) {
  const byCategory = {
    relationship: ["밀도 조절", "감정선 유지", "주도권 실험", "경계선 흔들기"],
    social: ["여론 관리", "명분 확보", "정보 회수", "협상 압박"],
    corruption: ["대가 분산", "욕망 증폭", "부작용 감수", "오염 절충"],
    market: ["조건 재조정", "리스크 분할", "선금 확보", "판세 관망"],
    faction: ["세력 저울질", "표면 중립", "권한 선점", "연합 탐색"],
    relic: ["봉인 시험", "공명 억제", "위험 전환", "의식 보정"],
    faith: ["의식 엄수", "교리 우회", "서약 점검", "헌납 조정"],
    travel: ["경로 변경", "보급 우선", "추적 회피", "기점 확보"],
    legacy: ["기록 보존", "계승 가공", "흔적 은폐", "혈통 분기"]
  };
  const byId = {
    c1: ["강행 루트", "압박 루트"],
    c2: ["균형 루트", "절충 루트"],
    c3: ["후퇴 루트", "정비 루트"],
    withdraw: ["철수 루트", "보류 루트"]
  };
  return byCategory[String(category || "")] || byId[String(id || "")] || ["보조 루트", "우회 루트", "정면 루트"];
}

function generatedChoiceLabel(category, tier, id, idx, seed = 0) {
  const t3Map = {
    relationship: {
      oath: "관계를 맹세로 묶는다",
      break: "욕망의 대가를 감수한다",
      withdraw: "감정을 봉인하고 물러난다"
    },
    corruption: {
      oath: "금단의 힘에 서명한다",
      break: "파열을 감수하고 판을 뒤집는다",
      withdraw: "봉인선을 되살리고 떠난다"
    },
    faith: {
      oath: "교단 맹세를 선택한다",
      break: "금기를 깨고 대가를 짊어진다",
      withdraw: "의식을 중단하고 철수한다"
    },
    relic: {
      oath: "유물과 결속을 맺는다",
      break: "출력을 강제로 열어젖힌다",
      withdraw: "봉인한 채 이탈한다"
    },
    faction: {
      oath: "한 세력의 맹세를 받는다",
      break: "균형을 깨고 주도권을 잡는다",
      withdraw: "중립 선언 후 철수한다"
    },
    legacy: {
      oath: "계승의 맹약을 받아들인다",
      break: "혈통 규율을 끊어낸다",
      withdraw: "기록만 남기고 봉인한다"
    }
  };

  const t2Map = {
    relationship: ["유혹의 주도권을 잡는다", "감정선을 읽고 조율한다", "거리만 남기고 물러난다"],
    social: ["압박으로 판을 뒤집는다", "표정과 말간격을 읽어 타협한다", "기록만 남기고 빠져나온다"],
    corruption: ["금단 제안을 받아들인다", "오염을 통제하며 이득만 챙긴다", "대가를 피하고 손을 뗀다"],
    market: ["위험 프리미엄으로 밀어붙인다", "조건을 잘라 손실을 줄인다", "거래를 접고 시세를 관망한다"],
    faction: ["한 세력에 힘을 실어준다", "양측의 균형을 맞춘다", "공개 지지를 보류한다"],
    relic: ["유물 반응을 강제로 연다", "의식 절차를 지키며 접근한다", "봉인선을 복구하고 떠난다"],
    faith: ["금기를 넘어 의식을 실행한다", "교단 규율 안에서 타협한다", "기록만 남기고 물러난다"],
    travel: ["지름길 위험을 감수한다", "경유지 보급 후 전진한다", "야영 후 경로를 재설정한다"],
    legacy: ["대를 잇는 서약에 응한다", "증인과 기록을 먼저 확보한다", "서약을 보류하고 봉인한다"]
  };

  if (tier === "T3") {
    const group = t3Map[category] || t3Map.faction;
    return group[id] || pickByIndex(Object.values(group), idx + seed);
  }

  const group = t2Map[category] || t2Map.social;
  if (id === "c1") return pickByIndex([group[0], group[1], group[0]], seed + idx);
  if (id === "c2") return pickByIndex([group[1], group[2], group[1]], seed + idx);
  if (id === "c3" || id === "withdraw") return pickByIndex([group[2], group[1], group[2]], seed + idx);
  return pickByIndex(group, idx + seed);
}

function repeatVariationLine(event, state) {
  const category = String(event?.category || "social");
  const seen = countEventSeen(state, event?.eventId || event?.id);
  const poolByCategory = {
    relationship: [
      "이번에는 말의 온도보다 눈빛의 간격이 먼저 결론을 가른다.",
      "관계선의 균열이 작게 보이지만, 다음 선택에서 크게 벌어진다.",
      "친밀과 경계가 동시에 올라가며 타협의 폭이 좁아진다."
    ],
    social: [
      "소문은 한 방향으로 흐르지 않는다. 오늘의 결정이 내일의 증언을 만든다.",
      "체면을 지키면 속도가 늦고, 속도를 택하면 신뢰가 깎인다.",
      "말 한 줄이 거래 두 개를 살리고, 실수 한 번이 셋을 잃게 만든다."
    ],
    corruption: [
      "금단의 힘은 늘 즉시 보상하고, 늦게 청구한다.",
      "대가를 미루는 선택일수록 다음 국면의 압박이 커진다.",
      "오염이 낮아도 반복 노출은 선택 폭을 눈에 띄게 바꾼다."
    ],
    market: [
      "값은 숫자로 보이지만, 조건은 관계에서 결정된다.",
      "오늘의 이익이 내일의 접근권을 잠그기도 한다.",
      "협상 기록이 쌓일수록 상대의 기준도 빠르게 단단해진다."
    ],
    faction: [
      "세력은 도움을 기억하기보다 배신을 오래 기억한다.",
      "중립은 안전하지만, 오래 유지하면 누구의 보호도 받지 못한다.",
      "한 진영의 호의는 다른 진영의 경계로 바로 환산된다."
    ],
    relic: [
      "유물은 사용자보다 상황을 먼저 바꾼다.",
      "봉인과 사용 사이에는 항상 보이지 않는 세 번째 비용이 있다.",
      "공명 강도가 오를수록 평판과 안정성의 교환비가 악화된다."
    ],
    faith: [
      "신념을 증명하는 방식이 곧 세력 지형을 재배치한다.",
      "의식의 일관성이 높을수록 단기 이익을 포기하게 된다.",
      "서약을 지키면 길이 좁아지고, 어기면 책임이 무거워진다."
    ],
    travel: [
      "경로 선택은 거리보다 위험 노출 순서를 바꾼다.",
      "우회로는 안전을 주지만 기회를 늦춘다.",
      "직선 경로는 빠르지만, 회복 타이밍을 잃기 쉽다."
    ],
    legacy: [
      "기록은 현재를 요약하지 않고, 다음 분기의 비용을 정한다.",
      "유산 태그 하나가 서사의 우선순위를 재배열한다.",
      "계승은 보상과 제약을 동시에 남긴다."
    ]
  };
  const pool = poolByCategory[category] || poolByCategory.social;
  return pickByIndex(pool, seen + eventHash(event?.eventId || event?.id || ""));
}

function decorateChoiceLabel(base, category, idx, seed = 0) {
  const flavorByCategory = {
    relationship: ["밀실", "정면", "완급조절", "감정선"],
    social: ["협상", "여론", "무대 뒤", "체면"],
    corruption: ["유혹", "금단", "대가", "균열"],
    market: ["흥정", "거래", "조건", "시장판"],
    faction: ["정치", "세력", "균형", "압박"],
    relic: ["봉인", "공명", "각성", "정화"],
    faith: ["의식", "서약", "증언", "참회"],
    travel: ["우회", "강행군", "은밀 이동", "경로 조정"],
    legacy: ["유산", "문장", "서사", "가계"]
  };
  const pool = flavorByCategory[String(category || "")] || ["분기", "결정", "기류", "국면"];
  const flavor = pickByIndex(pool, seed + idx);
  if (!flavor) return base;
  if (String(base).includes(flavor)) return base;
  return `${base} · ${flavor}`;
}

function eventHash(value) {
  const s = String(value || "");
  let hash = 0;
  for (let i = 0; i < s.length; i += 1) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickByIndex(arr, idx) {
  if (!Array.isArray(arr) || !arr.length) return "선택한다";
  return arr[Math.abs(Number(idx || 0)) % arr.length];
}

function describeRelationPressure(desire, tension, fear) {
  if (desire >= 28 && tension >= 30) return "욕망과 경계가 동시에 올라, 같은 한마디도 전혀 다르게 들린다.";
  if (desire >= 24) return "말 사이의 침묵이 길어지며 은밀한 긴장이 표면으로 떠오른다.";
  if (fear >= 22) return "공기가 눌리듯 가라앉아 지배와 복종의 기색이 퍼진다.";
  if (tension >= 26) return "관계선이 날카롭게 당겨져 작은 실수도 큰 균열로 번질 수 있다.";
  return "";
}

function isGenericTitle(title) {
  const t = String(title || "").trim();
  if (!t) return true;
  return /사건\s*#\d+/.test(t)
    || /^evt-/i.test(t)
    || /decision with/i.test(t)
    || !/[\uac00-\ud7a3]/.test(t);
}

function isGenericNarrative(text) {
  const t = String(text || "").trim();
  if (!t) return true;
  return t.includes("문제가 불거졌다")
    || t.includes("자동 처리")
    || t.includes("결단의 순간이 찾아왔다")
    || /you can/i.test(t)
    || /choice shifts/i.test(t)
    || !/[\uac00-\ud7a3]/.test(t);
}

function regionLabel(regionTag) {
  const key = String(regionTag || "").trim();
  if (!key) return "경계지";
  if (REGION_LABELS_KO[key]) return REGION_LABELS_KO[key];
  return key.replace(/-/g, " ");
}

function buildNarrativeByCategory(event, state) {
  const category = String(event?.category || "social");
  const region = regionLabel(event?.regionTags?.[0]);
  const act = Number(state?.world?.act || 1);

  const openLine = {
    relationship: `${region}의 좁은 회랑에서 시선과 숨이 교차하며, 거래인지 감정인지 경계가 흐려진다.`,
    corruption: `${region}의 봉인 틈에서 새는 기운이 피부를 데우고 판단을 서서히 흔든다.`,
    social: `${region}의 사교석에서는 낮은 목소리 하나가 소문과 계약을 동시에 움직인다.`,
    market: `${region}의 야시장은 웃음 뒤에 숨은 조건서로 가득하고, 손익표는 늘 마지막에 공개된다.`,
    relic: `${region}의 유물실은 희미한 진동으로 응답하며, 만지는 순서조차 협상의 무기가 된다.`,
    faction: `${region}의 밀실 회동에서 각 세력 대표가 서로 다른 후원 조건을 밀어 넣는다.`,
    faith: `${region}의 제단 앞에서 기도와 금기가 충돌하고, 한 걸음의 방향이 평판을 가른다.`,
    travel: `${region}으로 향한 경로는 안개와 매복 흔적으로 갈라지고, 선택한 길이 다음 장면의 온도를 바꾼다.`,
    legacy: `${region}의 계승 기록실에 오래된 서약문이 펼쳐지고, 당신의 이름이 새 줄에 걸쳐 멈춘다.`
  }[category] || `${region}의 공기가 무겁게 내려앉고, 다음 결정을 재촉하는 신호가 켜졌다.`;

  const stakeLine = event?.tier === "T3"
    ? `지금의 결단은 Act ${act} 이후 루트 우선순위를 바꿀 만큼 무겁다.`
    : "지금 개입하면 이득과 관계를 함께 건드릴 수 있지만, 지연하면 주도권을 잃기 쉽다.";

  return `${openLine}\n\n${stakeLine}`;
}

function weightedPick(items) {
  if (!items.length) return null;
  const total = items.reduce((acc, x) => acc + Math.max(0.01, Number(x.weight || 1)), 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= Math.max(0.01, Number(item.weight || 1));
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

function rotate(arr, n) {
  if (!arr.length) return arr;
  const k = ((n % arr.length) + arr.length) % arr.length;
  return arr.slice(k).concat(arr.slice(0, k));
}
