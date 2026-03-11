import {
  SAMPLE_EVENTS,
  DECISION_PRESETS,
  CLASS_LABELS_KO,
  LINEAGE_LABELS_KO,
  BACKGROUND_LABELS_KO
} from "../config/runtimeData.js";

const MATURE_CATEGORIES = new Set(["relationship", "corruption", "social", "market", "legacy"]);
const SENSUAL_LINEAGES = new Set(["succubus", "infernal"]);

export function maybeDispatchDecisionEvent(state, contentPack) {
  if (state.activeDecisionEvent) return null;
  const tick = Number(state?.time?.tick || 0);
  if (tick < 1) return null;

  const t2Pool = contentPack?.eventsT2?.length ? contentPack.eventsT2 : SAMPLE_EVENTS.t2;
  const t3Pool = contentPack?.eventsT3?.length ? contentPack.eventsT3 : SAMPLE_EVENTS.t3;
  if (!t2Pool.length && !t3Pool.length) return null;

  const lastOpenedTick = getLastOpenedTick(state);
  const sinceLastChoice = lastOpenedTick > 0 ? tick - lastOpenedTick : tick;
  // 텍스트 RPG 모드: 로그(틱)마다 선택지를 반드시 연다.
  const shouldOpenChoice = sinceLastChoice >= 1;
  if (!shouldOpenChoice) return null;

  const openedCount = Number((state?.history?.events || []).filter((e) => e?.stage === "opened").length || 0);
  // T3는 간헐적으로만 발생시켜 흐름을 끊지 않도록 유지한다.
  const forceT3 = state.world.act >= 2 && openedCount > 0 && openedCount % 10 === 0;

  const tier = forceT3 ? "T3" : "T2";
  const selected = tier === "T3"
    ? selectEventForState(t3Pool, state, true) || selectEventForState(t2Pool, state, true)
    : selectEventForState(t2Pool, state, true) || selectEventForState(t3Pool, state, true);

  if (!selected) return null;
  return normalizeEvent(structuredClone(selected), state);
}

export function resolveTimedChoice(state, event) {
  const preset = DECISION_PRESETS[state.automation.decisionPresetId] || DECISION_PRESETS["신중형"];
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

function pickTierByMood(state) {
  const fatigue = Number(state?.resources?.fatigue || 0);
  const taint = Number(state?.resources?.taint || 0);
  const act = Number(state?.world?.act || 1);
  const chaos = (fatigue >= 58 ? 1 : 0) + (taint >= 40 ? 1 : 0) + (act >= 2 ? 1 : 0);
  if (chaos >= 2 && Math.random() < 0.48) return "T3";
  return "T2";
}

function selectEventForState(pool, state, preferMature = false) {
  if (!Array.isArray(pool) || !pool.length) return null;

  const inspected = pool
    .map((event) => inspectEvent(event, state))
    .filter((x) => x.triggerOk);

  if (!inspected.length) return structuredClone(pool[Math.floor(Math.random() * pool.length)]);

  const strict = inspected.filter((x) => x.classOk && x.backgroundOk && x.statOk);
  const medium = inspected.filter((x) => x.classOk || x.backgroundOk || x.statOk);
  const relaxed = strict.length ? strict : (medium.length ? medium : inspected);

  const weighted = relaxed.map((x) => {
    let weight = 1 + x.score;
    if (preferMature && MATURE_CATEGORIES.has(String(x.event.category || ""))) weight += 2.4;
    return { event: x.event, weight };
  });

  return weightedPick(weighted);
}

function inspectEvent(event, state) {
  const classId = state?.character?.classId;
  const backgroundId = state?.character?.backgroundId;
  const topStats = strongestAbilities(state);
  const classAffinity = Array.isArray(event?.classAffinity) ? event.classAffinity : [];
  const backgroundAffinity = Array.isArray(event?.backgroundAffinity) ? event.backgroundAffinity : [];
  const statAffinity = Array.isArray(event?.statAffinity) ? event.statAffinity : [];

  const classOk = !classAffinity.length || classAffinity.includes(classId);
  const backgroundOk = !backgroundAffinity.length || backgroundAffinity.includes(backgroundId);
  const statOk = !statAffinity.length || statAffinity.some((s) => topStats.includes(s));
  const triggerOk = passesTrigger(event, state);

  let score = 0;
  if (classOk) score += 2;
  if (backgroundOk) score += 2;
  if (statOk) score += 2;
  if (MATURE_CATEGORIES.has(String(event?.category || ""))) score += 1;
  if (Array.isArray(event?.chronicleTags) && event.chronicleTags.length) score += 0.6;

  return { event, classOk, backgroundOk, statOk, triggerOk, score };
}

function strongestAbilities(state) {
  const entries = Object.entries(state?.character?.abilities || {});
  return entries
    .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))
    .slice(0, 3)
    .map(([k]) => k);
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

  normalized.choices = diversifyChoices(normalized, state);
  normalized.text = expandEventText(normalized, state);
  return normalized;
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
      label: "감정선을 건드려 주도권을 확보한다",
      effects: [{ kind: "renown", value: 1 }, { kind: "relation", value: { desire: 2, tension: 1 } }, { kind: "taint", value: 1 }]
    };
  }
  if (category === "corruption") {
    return {
      id: `bonus-${idx}`,
      label: "달콤한 유혹의 대가를 계산하고 수락한다",
      effects: [{ kind: "gain_gold", value: 16 }, { kind: "taint", value: 3 }, { kind: "relation", value: { desire: 1, fear: 1 } }]
    };
  }
  if (category === "market" || category === "social") {
    return {
      id: `bonus-${idx}`,
      label: "밀실 협상으로 조건을 뒤집는다",
      effects: [{ kind: "gain_gold", value: 12 }, { kind: "relation", value: { trust: 1, tension: 1 } }]
    };
  }
  if (category === "faction") {
    return {
      id: `bonus-${idx}`,
      label: "양측 모두에게 빚을 남겨 다음 밤을 준비한다",
      effects: [{ kind: "faction", value: { guild: 1, temple: 1 } }, { kind: "infamy", value: 1 }]
    };
  }

  const desire = Number(state?.relationships?.npcRelations?.core?.desire || 0);
  if (desire >= 22) {
    return {
      id: `bonus-${idx}`,
      label: "긴장감을 유지한 채 절충안을 만든다",
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
      label: "매혹적인 언변으로 분위기를 장악한다",
      effects: [{ kind: "renown", value: 2 }, { kind: "relation", value: { desire: 2, trust: 1 } }, { kind: "taint", value: 1 }]
    };
  }

  if (SENSUAL_LINEAGES.has(c.lineageId) && ["corruption", "relic", "relationship"].includes(category)) {
    return {
      id: `trait-lineage-${idx}`,
      label: "혈통의 본능을 열어 은밀한 조건을 받아들인다",
      effects: [{ kind: "gain_gold", value: 14 }, { kind: "relation", value: { desire: 2, fear: 1 } }, { kind: "chronicle_tag", value: "lineage-desire-route" }]
    };
  }

  if (["smuggler-runner", "orphan-cutpurse"].includes(c.backgroundId) && ["market", "faction", "social"].includes(category)) {
    return {
      id: `trait-bg-${idx}`,
      label: "뒷골목 인맥으로 거래를 우회한다",
      effects: [{ kind: "gain_gold", value: 18 }, { kind: "faction", value: { underbelly: 2, nobility: -1 } }]
    };
  }

  if ((wis >= 14 || ["cleric", "druid"].includes(c.classId)) && ["corruption", "relic", "faith"].includes(category)) {
    return {
      id: `trait-wis-${idx}`,
      label: "정화 의식으로 대가를 줄인다",
      effects: [{ kind: "taint", value: -2 }, { kind: "renown", value: 1 }, { kind: "blessing", value: 1 }]
    };
  }

  return null;
}

function expandEventText(event, state) {
  const base = String(event?.text || event?.narrativeText || "").trim();
  const category = String(event?.category || "social");
  const cls = CLASS_LABELS_KO[state?.character?.classId] || state?.character?.classId || "무명 클래스";
  const lineage = LINEAGE_LABELS_KO[state?.character?.lineageId] || state?.character?.lineageId || "무명 혈통";
  const background = BACKGROUND_LABELS_KO[state?.character?.backgroundId] || state?.character?.backgroundId || "무명 배경";
  const strong = strongestAbilities(state).join("/");

  const categoryTone = {
    relationship: "상대와의 거리는 가까워질수록 달콤해지지만, 그만큼 약점도 함께 드러난다.",
    corruption: "금지된 힘은 즉각적인 쾌감을 약속하지만, 다음 장면에서 더 큰 청구서를 남긴다.",
    social: "호의와 욕망이 뒤섞인 협상은 겉보기보다 깊은 감정 부채를 만든다.",
    market: "밀실 거래는 자원을 늘리는 대신, 신뢰의 온도를 미세하게 깎아낸다.",
    relic: "유물의 반응은 유혹처럼 다가오지만, 선택 하나로 정체성 축이 비틀릴 수 있다.",
    faction: "세력의 손을 잡는 순간, 다른 손에서 미묘한 복수의 기류가 일어난다.",
    faith: "신념을 지키면 마음은 단단해지지만, 단기 보상은 상대에게 넘어갈 수 있다.",
    legacy: "이번 판단은 당장의 이득보다 다음 생의 출발점을 바꿔 놓는다."
  }[category] || "이번 판단은 관계, 자원, 평판 중 최소 하나를 강하게 흔든다.";

  const profileLine = `${lineage} ${cls} (${background})의 강점은 ${strong}이며, 현재 선택지는 그 강점을 정면으로 시험한다.`;
  const riskLine = event?.tier === "T3"
    ? "이 분기는 되돌리기 어렵다. 선택 후 후속 사건이 강제로 연결될 가능성이 높다."
    : "짧게 머뭇거리면 자동 처리 규칙이 개입해 의도와 다른 결과가 날 수 있다.";

  return [base, categoryTone, profileLine, riskLine].filter(Boolean).join("\n\n");
}

function weightedPick(items) {
  if (!items.length) return null;
  const total = items.reduce((acc, x) => acc + Math.max(0.01, Number(x.weight || 1)), 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= Math.max(0.01, Number(item.weight || 1));
    if (roll <= 0) return item.event;
  }
  return items[items.length - 1].event;
}

function rotate(arr, n) {
  if (!arr.length) return arr;
  const k = ((n % arr.length) + arr.length) % arr.length;
  return arr.slice(k).concat(arr.slice(0, k));
}
