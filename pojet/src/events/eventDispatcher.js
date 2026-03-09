import { SAMPLE_EVENTS, DECISION_PRESETS } from "../config/runtimeData.js";

export function maybeDispatchDecisionEvent(state, contentPack) {
  if (state.activeDecisionEvent) return null;

  const tick = state.time.tick;
  const t2Pool = contentPack?.eventsT2?.length ? contentPack.eventsT2 : SAMPLE_EVENTS.t2;
  const t3Pool = contentPack?.eventsT3?.length ? contentPack.eventsT3 : SAMPLE_EVENTS.t3;
  const decisionCount = Number(state?.history?.events?.length || 0);

  if (tick === 4) return normalizeEvent(structuredClone(t2Pool[0 % t2Pool.length]));
  if (tick === 7) return normalizeEvent(structuredClone(t2Pool[1 % t2Pool.length]));

  const interval = state.world.act >= 2 ? 2 : 3; // 2~3개 로그마다 선택지
  const shouldOpenChoice = tick >= 8 && tick % interval === 0;
  if (!shouldOpenChoice) return null;

  const forceT3 = (decisionCount > 0 && decisionCount % 4 === 0) || (state.world.act >= 2 && tick % 6 === 0);
  if (forceT3) return normalizeEvent(structuredClone(t3Pool[Math.floor(Math.random() * t3Pool.length)]));

  if (Math.random() < 0.78) return normalizeEvent(structuredClone(t2Pool[Math.floor(Math.random() * t2Pool.length)]));
  if (state.world.act >= 2) return normalizeEvent(structuredClone(t3Pool[Math.floor(Math.random() * t3Pool.length)]));
  return normalizeEvent(structuredClone(t2Pool[Math.floor(Math.random() * t2Pool.length)]));
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

function normalizeEvent(event) {
  if (!event) return null;
  return {
    ...event,
    eventId: event.eventId || event.id,
    title: event.title || event.logSummary || event.id,
    text: event.text || event.narrativeText || "",
    timeoutSec: event.timeoutSec ?? (event.tier === "T2" ? 12 : 0),
    mustPause: event.mustPause ?? event.tier === "T3"
  };
}
