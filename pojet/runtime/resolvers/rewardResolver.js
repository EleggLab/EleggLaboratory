import { createQuest } from "../../src/core/state-machine.js";

export function applyResolutionEffects(state, resolution) {
  const patch = {
    character: {},
    resources: {},
    world: {},
    relationships: { npcRelations: { core: {} } },
    factions: { reputation: {} }
  };

  const c = state.character;
  const e = resolution.effects || {};

  if (typeof e.hpDelta === "number") patch.character.hp = clamp(c.hp + e.hpDelta, 0, c.maxHp);
  if (typeof e.xpDelta === "number") patch.character.xp = c.xp + e.xpDelta;
  if (typeof e.goldDelta === "number") patch.resources.gold = Math.max(0, state.resources.gold + e.goldDelta);
  if (typeof e.suppliesDelta === "number") patch.resources.supplies = Math.max(0, state.resources.supplies + e.suppliesDelta);
  if (typeof e.fatigueDelta === "number") patch.resources.fatigue = clamp(state.resources.fatigue + e.fatigueDelta, 0, 100);
  if (typeof e.taintDelta === "number") patch.resources.taint = clamp(state.resources.taint + e.taintDelta, 0, 100);
  if (typeof e.renownDelta === "number") patch.resources.renown = Math.max(-100, state.resources.renown + e.renownDelta);
  if (typeof e.infamyDelta === "number") patch.resources.infamy = Math.max(0, state.resources.infamy + e.infamyDelta);

  if (typeof e.actProgressDelta === "number") patch.world.actProgress = clamp(state.world.actProgress + e.actProgressDelta, 0, 140);

  if (typeof e.questProgressDelta === "number") {
    const quests = structuredClone(state.world.quests);
    if (!quests.length) quests.push(createQuest());
    quests[0].progress += e.questProgressDelta;
    if (quests[0].progress >= 100) {
      quests[0].progress = 100;
      quests[0].state = "completed";
      quests.unshift(createQuest());
    }
    patch.world.quests = quests.slice(0, 3);
  }

  if (e.relationDelta) {
    Object.entries(e.relationDelta).forEach(([k, v]) => {
      const cur = state.relationships.npcRelations.core[k] || 0;
      patch.relationships.npcRelations.core[k] = clamp(cur + v, 0, 100);
    });
  }

  if (e.factionDelta) {
    Object.entries(e.factionDelta).forEach(([k, v]) => {
      const cur = state.factions.reputation[k] || 0;
      patch.factions.reputation[k] = clamp(cur + v, -100, 100);
    });
  }

  if (e.gearDrop && state.automation.autoEquip) {
    patch.character.gear = [e.gearDrop, ...state.character.gear].slice(0, 6);
  }

  return patch;
}

export function applyEventChoiceEffects(state, choice, defaultEventEffects = []) {
  const patch = { character: {}, resources: {}, relationships: { npcRelations: { core: {} } }, factions: { reputation: {} }, chronicle: {} };
  const effects = [...defaultEventEffects, ...(choice.effects || [])];

  effects.forEach((fx) => {
    switch (fx.kind) {
      case "gain_gold":
        patch.resources.gold = Math.max(0, (patch.resources.gold ?? state.resources.gold) + fx.value);
        break;
      case "renown":
        patch.resources.renown = (patch.resources.renown ?? state.resources.renown) + fx.value;
        break;
      case "infamy":
        patch.resources.infamy = (patch.resources.infamy ?? state.resources.infamy) + fx.value;
        break;
      case "taint":
        patch.resources.taint = clamp((patch.resources.taint ?? state.resources.taint) + fx.value, 0, 100);
        break;
      case "faction":
        Object.entries(fx.value).forEach(([k, v]) => {
          const cur = patch.factions.reputation[k] ?? state.factions.reputation[k] ?? 0;
          patch.factions.reputation[k] = clamp(cur + v, -100, 100);
        });
        break;
      case "relation":
        Object.entries(fx.value).forEach(([k, v]) => {
          const cur = patch.relationships.npcRelations.core[k] ?? state.relationships.npcRelations.core[k] ?? 0;
          patch.relationships.npcRelations.core[k] = clamp(cur + v, 0, 100);
        });
        break;
      case "chronicle_tag": {
        const tags = new Set(state.character.tags || []);
        tags.add(fx.value);
        patch.character.tags = [...tags];
        break;
      }
      case "blessing": {
        const tags = new Set(state.character.tags || []);
        tags.add("blessed");
        patch.character.tags = [...tags];
        break;
      }
      default:
        break;
    }
  });

  return patch;
}

export function buildDeferredChoiceOutcome(state, event, choice, defaultEventEffects = []) {
  const effects = [...defaultEventEffects, ...(choice?.effects || [])];
  if (!effects.length) return null;

  const currentResources = state?.resources || {};
  const currentRelations = state?.relationships?.npcRelations?.core || {};
  const currentFactions = state?.factions?.reputation || {};

  const resources = {
    fatigue: Number(currentResources.fatigue || 0),
    taint: Number(currentResources.taint || 0),
    renown: Number(currentResources.renown || 0),
    infamy: Number(currentResources.infamy || 0),
    supplies: Number(currentResources.supplies || 0),
    gold: Number(currentResources.gold || 0)
  };
  const relations = {
    trust: Number(currentRelations.trust || 0),
    intimacy: Number(currentRelations.intimacy || 0),
    tension: Number(currentRelations.tension || 0),
    desire: Number(currentRelations.desire || 0),
    respect: Number(currentRelations.respect || 0),
    fear: Number(currentRelations.fear || 0)
  };
  const factions = { ...currentFactions };

  let changed = false;
  let summary = "선택의 여파가 뒤늦게 반영되었다.";

  effects.forEach((fx) => {
    switch (fx.kind) {
      case "gain_gold":
        if (Number(fx.value || 0) > 0) {
          resources.fatigue = clamp(resources.fatigue + 1, 0, 100);
          resources.infamy = Math.max(0, resources.infamy + 1);
          changed = true;
          summary = "짧은 이득 뒤에 피로와 소문이 따라붙었다.";
        }
        break;
      case "taint":
        if (Number(fx.value || 0) > 0) {
          resources.taint = clamp(resources.taint + 1, 0, 100);
          relations.desire = clamp(relations.desire + 1, 0, 100);
          changed = true;
          summary = "금단의 선택이 오래 남아 관계 온도를 밀어 올렸다.";
        }
        break;
      case "renown":
        if (Number(fx.value || 0) > 0) {
          relations.tension = clamp(relations.tension + 1, 0, 100);
          changed = true;
          summary = "평판 상승의 반작용으로 긴장이 높아졌다.";
        }
        break;
      case "relation":
        if (fx.value?.desire > 0 || fx.value?.tension > 0) {
          relations.trust = clamp(relations.trust - 1, 0, 100);
          changed = true;
          summary = "관계 밀도가 올라가며 신뢰 균형이 흔들렸다.";
        } else if (fx.value?.trust > 0) {
          relations.tension = clamp(relations.tension - 1, 0, 100);
          changed = true;
          summary = "신뢰가 쌓이며 긴장이 일부 완화되었다.";
        }
        break;
      case "faction":
        if (fx.value && typeof fx.value === "object") {
          Object.entries(fx.value).forEach(([key, value]) => {
            if (!Number.isFinite(Number(value)) || Number(value) === 0) return;
            const cur = Number(factions[key] || 0);
            factions[key] = clamp(cur + Math.sign(Number(value)), -100, 100);
            changed = true;
            summary = "세력 반응이 지연되어 평판선이 다시 조정되었다.";
          });
        }
        break;
      default:
        break;
    }
  });

  if (!changed && String(event?.tier || "") === "T3") {
    resources.renown = Math.max(-100, resources.renown + 1);
    changed = true;
    summary = "대형 결단의 파장이 늦게 명성으로 환산되었다.";
  }

  if (!changed) return null;

  const tick = Number(state?.time?.tick || 0);
  const baseDelay = String(event?.tier || "") === "T3" ? 3 : 2;
  const choiceSalt = String(choice?.id || "").length % 2;
  const dueTick = tick + baseDelay + choiceSalt;

  const patch = {
    resources: {
      fatigue: resources.fatigue,
      taint: resources.taint,
      renown: resources.renown,
      infamy: resources.infamy,
      supplies: resources.supplies,
      gold: resources.gold
    },
    relationships: { npcRelations: { core: relations } },
    factions: { reputation: factions }
  };

  return {
    id: `defer-${tick}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    dueTick,
    sourceEventId: event?.eventId || event?.id || "unknown-event",
    sourceChoiceId: choice?.id || "unknown-choice",
    summary,
    patch
  };
}

export function maybeLevelUp(state) {
  const need = state.character.level * 100;
  if (state.character.xp < need) return null;
  const newLevel = state.character.level + 1;
  const hpGain = rand(4, 8);
  const newMaxHp = state.character.maxHp + hpGain;
  return {
    character: {
      level: newLevel,
      xp: state.character.xp - need,
      proficiencyBonus: 2 + Math.floor((newLevel - 1) / 4),
      maxHp: newMaxHp,
      hp: Math.min(newMaxHp, state.character.hp + hpGain)
    },
    resources: { renown: state.resources.renown + 2 }
  };
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

