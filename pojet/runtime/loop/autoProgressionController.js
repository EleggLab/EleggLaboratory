import { resolveCombat } from "../resolvers/combatResolver.js";
import { resolveExploration } from "../../src/resolvers/explorationResolver.js";
import { resolveSocial } from "../../src/resolvers/socialResolver.js";
import { applyResolutionEffects, applyEventChoiceEffects, maybeLevelUp } from "../resolvers/rewardResolver.js";
import { maybeDispatchDecisionEvent, resolveTimedChoice, shouldForcePause } from "../../src/events/eventDispatcher.js";
import { LOCATIONS_BY_ACT } from "../../src/config/runtimeData.js";
import { createNarrativeEngine } from "../../src/narrative/narrativeEngine.js";

export function createAutoProgressionController(store, contentPack) {
  let timer = null;
  let t2Timer = null;
  const narrative = createNarrativeEngine(contentPack);

  function start() {
    if (timer) return;
    timer = setInterval(step, 900);
  }

  function stop() {
    clearInterval(timer);
    timer = null;
    clearInterval(t2Timer);
    t2Timer = null;
  }

  function step() {
    const state = store.getState();
    if (state.run.status !== "running") return;
    if (state.activeDecisionEvent) return;

    store.dispatch({ type: "TIME_TICK" });

    const current = store.getState();
    const phase = pickPhase(current);

    if (phase === "exploration") applyPhaseResolution(store, resolveExploration(current), contentPack, narrative);
    if (phase === "combat") applyPhaseResolution(store, resolveCombat(current), contentPack, narrative);
    if (phase === "social") applyPhaseResolution(store, resolveSocial(current), contentPack, narrative);
    if (phase === "rest") {
      const lowHp = current.character.hp <= Math.floor(current.character.maxHp * 0.25);
      const hp = Math.min(current.character.maxHp, current.character.hp + rand(lowHp ? 6 : 4, lowHp ? 10 : 7));
      const prevFatigue = current.resources.fatigue;
      const nextFatigue = Math.max(0, prevFatigue - (lowHp ? 8 : 5));
      store.dispatch({ type: "APPLY_PATCH", payload: { patch: { character: { hp }, resources: { fatigue: nextFatigue } } } });
      const restLog = narrative.makePhaseLog({
        state: current,
        nextState: store.getState(),
        phase: "rest",
        resolution: { summary: "자동 휴식으로 호흡을 가다듬었다." },
        source: "auto-loop"
      });
      store.dispatch({ type: "LOG", payload: { log: restLog } });
    }

    const afterPhase = store.getState();
    if (afterPhase.world.actProgress >= 100) {
      const nextAct = Math.min(5, afterPhase.world.act + 1);
      const pool = (contentPack?.locationPools || []).find((x) => x.act === nextAct)?.locations || LOCATIONS_BY_ACT[nextAct];
      store.dispatch({ type: "APPLY_PATCH", payload: { patch: { world: { act: nextAct, actProgress: 0, locationId: pick(pool) } } } });
      const actLog = narrative.makeGenericLog({
        state: store.getState(),
        kind: "act-transition",
        source: "auto-loop",
        text: `[막 전환] 막 ${nextAct}로 진입했다.`,
        refs: [`act:${nextAct}`]
      });
      store.dispatch({ type: "LOG", payload: { log: actLog, meta: { tier: "T2" } } });
    }

    const possibleEvent = maybeDispatchDecisionEvent(store.getState(), contentPack);
    if (possibleEvent) {
      store.dispatch({ type: "SET_ACTIVE_EVENT", payload: { event: { ...possibleEvent, openedAt: Date.now() } } });
      store.dispatch({ type: "HISTORY_EVENT", payload: { entry: { eventId: possibleEvent.id || possibleEvent.eventId, tier: possibleEvent.tier, category: possibleEvent.category, openedAt: new Date().toISOString() } } });
      const eventLog = narrative.makeEventOpenLog({ state: store.getState(), event: possibleEvent });
      store.dispatch({ type: "LOG", payload: { log: eventLog, meta: { tier: possibleEvent.tier } } });

      if (shouldForcePause(possibleEvent)) {
        store.dispatch({ type: "RUN_PAUSE" });
      } else if (possibleEvent.tier === "T2" && store.getState().automation.t2Policy !== "ask") {
        clearTimeout(t2Timer);
        t2Timer = setTimeout(() => {
          const live = store.getState();
          if (!live.activeDecisionEvent || (live.activeDecisionEvent.id !== possibleEvent.id && live.activeDecisionEvent.eventId !== possibleEvent.eventId)) return;
          const autoChoice = resolveTimedChoice(live, live.activeDecisionEvent);
          applyDecisionChoice(store, autoChoice, true, contentPack);
        }, (possibleEvent.timeoutSec || 10) * 1000);
      }
    }

    const ended = store.getState().character.hp <= 0;
    if (ended) {
      const endLog = narrative.makeGenericLog({
        state: store.getState(),
        kind: "run-end",
        source: "auto-loop",
        text: "[종결] 캐릭터가 쓰러졌다. 연대기에 기록된다.",
        refs: ["ending:battle_death"]
      });
      store.dispatch({ type: "LOG", payload: { log: endLog, meta: { tier: "T3" } } });
      store.dispatch({ type: "RUN_END", payload: { cause: "battle_death" } });
      stop();
    }
  }

  return { start, stop, step };
}

function applyPhaseResolution(store, resolution, contentPack, narrative) {
  const prev = store.getState();
  const patch = applyResolutionEffects(prev, resolution);
  store.dispatch({ type: "APPLY_PATCH", payload: { patch } });

  const phaseLog = narrative.makePhaseLog({
    state: prev,
    nextState: store.getState(),
    phase: resolution.type,
    resolution,
    source: "auto-loop"
  });
  store.dispatch({ type: "LOG", payload: { log: phaseLog } });

  let next = store.getState();

  const hp = Number(next?.character?.hp || 0);
  const maxHp = Number(next?.character?.maxHp || 1);
  const hpRatio = maxHp > 0 ? hp / maxHp : 1;
  if (hpRatio <= 0.22 && next?.resources?.consumables?.potion > 0 && next?.automation?.autoPotion) {
    const healed = Math.min(maxHp, hp + rand(8, 14));
    const leftPotion = Math.max(0, Number(next.resources.consumables.potion || 0) - 1);
    store.dispatch({ type: "APPLY_PATCH", payload: { patch: { character: { hp: healed }, resources: { consumables: { ...next.resources.consumables, potion: leftPotion } } } } });
    const emergencyLog = narrative.makeGenericLog({
      state: store.getState(),
      kind: "emergency-heal",
      source: "auto-survival",
      text: "치명상 직전, 자동으로 물약을 사용해 숨을 붙들었다.",
      refs: ["survival:potion"]
    });
    store.dispatch({ type: "LOG", payload: { log: emergencyLog } });
    next = store.getState();
  }

  const beforeCore = prev.relationships.npcRelations.core || {};
  const afterCore = next.relationships.npcRelations.core || {};
  if (JSON.stringify(beforeCore) !== JSON.stringify(afterCore)) {
    store.dispatch({ type: "RELATION_CHANGE", payload: { entry: { at: new Date().toISOString(), before: beforeCore, after: afterCore, source: resolution.type } } });
  }

  const prevCompleted = (prev.world.quests || []).filter((q) => q.state === "completed").map((q) => q.id);
  const nextCompleted = (next.world.quests || []).filter((q) => q.state === "completed");
  nextCompleted.forEach((q) => {
    if (!prevCompleted.includes(q.id)) {
      store.dispatch({ type: "QUEST_COMPLETE", payload: { entry: { id: q.id, title: q.name, at: new Date().toISOString() } } });
    }
  });

  const lvl = maybeLevelUp(next);
  if (lvl) {
    store.dispatch({ type: "APPLY_PATCH", payload: { patch: lvl } });
    const lvlLog = narrative.makeGenericLog({
      state: store.getState(),
      kind: "level-up",
      source: "progression",
      text: `[성장] 레벨 ${store.getState().character.level} 달성.`,
      refs: ["level-up"]
    });
    store.dispatch({ type: "LOG", payload: { log: lvlLog } });
  }
}

export function applyDecisionChoice(store, choice, auto = false, contentPack = null) {
  const state = store.getState();
  const event = state.activeDecisionEvent;
  if (!event || !choice) return;

  const narrative = createNarrativeEngine(contentPack);
  const before = state.relationships.npcRelations.core || {};
  const patch = applyEventChoiceEffects(state, choice, event.defaultEffects || []);
  store.dispatch({ type: "APPLY_PATCH", payload: { patch } });

  const choiceLog = narrative.makeDecisionLog({
    state,
    nextState: store.getState(),
    event,
    choice,
    auto
  });
  store.dispatch({ type: "LOG", payload: { log: choiceLog, meta: { tier: event.tier } } });
  store.dispatch({ type: "HISTORY_EVENT", payload: { entry: { eventId: event.id || event.eventId, choiceId: choice.id, auto, tier: event.tier, category: event.category, resolvedAt: new Date().toISOString() } } });
  store.dispatch({ type: "CLEAR_ACTIVE_EVENT" });

  const after = store.getState().relationships.npcRelations.core || {};
  if (JSON.stringify(before) !== JSON.stringify(after)) {
    store.dispatch({ type: "RELATION_CHANGE", payload: { entry: { at: new Date().toISOString(), before, after, source: event.id || event.eventId } } });
  }

  if (event.tier === "T3" && store.getState().run.status === "paused") {
    store.dispatch({ type: "RUN_RESUME" });
  }
}

export function evaluateRunEndType(state) {
  if (!state?.character) return null;
  if (state.character.hp <= 0) return "battle_death";
  if (state.resources.taint >= 85) return "corruption_fall";
  if ((state.character.tags || []).includes("forbidden-power")) return "forbidden_fusion";
  if (state.world.act >= 5 && state.resources.renown >= 30) return "faction_ascension";
  if (state.world.act >= 4 && state.time.tick >= 65) return "glorious_retirement";
  if (state.time.tick >= 80) return "vanished_legend";
  return null;
}

function pickPhase(state) {
  const hp = Number(state?.character?.hp || 1);
  const maxHp = Number(state?.character?.maxHp || 1);
  const fatigue = Number(state?.resources?.fatigue || 0);
  const hpRatio = maxHp > 0 ? hp / maxHp : 1;

  if (hpRatio <= 0.3 || fatigue >= 65) {
    return Math.random() < 0.65 ? "rest" : (Math.random() < 0.5 ? "social" : "exploration");
  }
  if (hpRatio <= 0.5) {
    return pick(["rest", "exploration", "social", "combat"]);
  }
  return pick(["exploration", "combat", "social", "rest"]);
}

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[rand(0, arr.length - 1)]; }





