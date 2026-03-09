function cloneCoreRelation(state) {
  return state?.relationships?.npcRelations?.core || {};
}

function relationDelta(before, after) {
  const keys = ["trust", "intimacy", "tension", "desire", "respect", "fear"];
  const changed = {};
  keys.forEach((key) => {
    const prev = Number(before?.[key] || 0);
    const next = Number(after?.[key] || 0);
    if (prev !== next) changed[key] = next - prev;
  });
  return changed;
}

function resourceDelta(before, after) {
  const keys = ["gold", "supplies", "fatigue", "taint", "renown", "infamy"];
  const changed = {};
  keys.forEach((key) => {
    const prev = Number(before?.resources?.[key] || 0);
    const next = Number(after?.resources?.[key] || 0);
    if (prev !== next) changed[key] = next - prev;
  });
  return changed;
}

function hpDelta(before, after) {
  const prev = Number(before?.character?.hp || 0);
  const next = Number(after?.character?.hp || 0);
  return next - prev;
}

export function buildContextPacket({
  state,
  nextState,
  contentPack,
  kind,
  phase,
  event,
  choice,
  auto,
  source,
  fallbackLine,
  refs
}) {
  const base = state || nextState || {};
  const now = new Date().toISOString();
  const before = state || base;
  const after = nextState || base;
  const coreBefore = cloneCoreRelation(before);
  const coreAfter = cloneCoreRelation(after);

  const npcName = (contentPack?.npcs || [])[Number(base?.time?.tick || 0) % Math.max((contentPack?.npcs || []).length, 1)]?.name || "이름 없는 목격자";
  const factionName = (contentPack?.factions || [])[Number(base?.world?.act || 1) % Math.max((contentPack?.factions || []).length, 1)]?.name || "변경의 잔당";
  const activeQuest = (after?.world?.quests || [])[0]?.name || "미완의 의뢰";

  return {
    kind: kind || "generic",
    phase: phase || null,
    source: source || "system",
    createdAt: now,
    runId: base?.run?.id || `run-${Date.now()}`,
    tick: Number(base?.time?.tick || 0),
    day: Number(base?.world?.day || 1),
    act: Number(base?.world?.act || 1),
    locationId: base?.world?.locationId || "미확인 지점",
    event: event || null,
    choice: choice || null,
    auto: Boolean(auto),
    fallbackLine: fallbackLine || "",
    refs: refs || [],
    contentPack,
    contextActors: { npcName, factionName, activeQuest },
    current: {
      characterName: base?.character?.name || "무명인",
      fatigue: Number(base?.resources?.fatigue || 0),
      taint: Number(base?.resources?.taint || 0),
      relation: coreAfter
    },
    delta: {
      resources: resourceDelta(before, after),
      hp: hpDelta(before, after),
      relation: relationDelta(coreBefore, coreAfter),
      actProgress: Number(after?.world?.actProgress || 0) - Number(before?.world?.actProgress || 0)
    }
  };
}
