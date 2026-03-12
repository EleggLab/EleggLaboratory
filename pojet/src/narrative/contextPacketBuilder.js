import { computeMaturityTier } from "./maturityTier.js";
import { CLASS_LABELS_KO, LINEAGE_LABELS_KO, BACKGROUND_LABELS_KO } from "../config/runtimeData.js";

const STORYLINE_LABELS = {
  "battleworn-veteran": "전투와 쾌락에 닳은 베테랑",
  "academy-prodigy": "전투 아카데미 유망주",
  "mountain-adept": "산중 수행자",
  "brothel-fixer": "창녀촌 포주",
  "thief-crew": "도둑 크루 일원"
};

const BEAST_KIND_LABELS = {
  wolf: "늑대",
  fox: "여우",
  sheep: "양",
  rabbit: "토끼"
};

function resolveLineageLabel(character = {}) {
  const lineageId = String(character?.lineageId || "");
  if (lineageId === "succubus" && character?.gender === "male") return "인큐버스";
  if (lineageId === "mixed-grace" && character?.beastKind) {
    const beast = BEAST_KIND_LABELS[String(character.beastKind)] || String(character.beastKind);
    return `수인족(${beast})`;
  }
  return LINEAGE_LABELS_KO[lineageId] || lineageId || "미정";
}

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

function pickByTick(list, tick) {
  if (!Array.isArray(list) || !list.length) return null;
  const idx = Math.abs(Number(tick || 0)) % list.length;
  return list[idx];
}

function isPlaceholderLabel(value = "") {
  const text = String(value || "").trim();
  if (!text) return true;
  if (/\?{3,}/.test(text)) return true;
  if (/^인물-\d+/i.test(text)) return true;
  if (/^무명\s*(세력|지역)/.test(text)) return true;
  if (/^broker\b/i.test(text)) return true;
  if (/^[A-Za-z0-9 _.'-]+$/.test(text)) return true;
  return false;
}

function isPlaceholderQuest(value = "") {
  const text = String(value || "").trim();
  if (!text) return true;
  if (/\?{3,}/.test(text)) return true;
  if (/의뢰\s*\d{2,}/.test(text)) return true;
  if (/quest\s*\d+/i.test(text)) return true;
  return false;
}

function chooseLabel(primary, fallback) {
  const p = String(primary || "").trim();
  if (isPlaceholderLabel(p)) return String(fallback || "").trim();
  return p;
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
  const before = state || base;
  const after = nextState || base;
  const now = new Date().toISOString();
  const tick = Number(base?.time?.tick || 0);
  const act = Number(base?.world?.act || 1);

  const fallbackNpcs = ["벨라트릭스", "에단", "세레나", "카이우스"];
  const fallbackFactions = ["검은 길드", "등불 신전", "시민 의회", "항구 연맹"];
  const fallbackQuests = ["첫 의뢰", "긴급 수색", "비밀 거래", "봉인 확인"];

  const pickedNpc = pickByTick(contentPack?.npcs, tick);
  const pickedFaction = pickByTick(contentPack?.factions, act);

  const fallbackNpcName = pickByTick(fallbackNpcs, tick);
  const fallbackFactionName = pickByTick(fallbackFactions, act);
  const fallbackQuestName = pickByTick(fallbackQuests, tick);

  const npcName = chooseLabel(pickedNpc?.name, fallbackNpcName);
  const factionName = chooseLabel(pickedFaction?.name, fallbackFactionName);
  const questName = String((after?.world?.quests || [])[0]?.name || "").trim();
  const activeQuest = isPlaceholderQuest(questName) ? fallbackQuestName : questName;

  const coreBefore = cloneCoreRelation(before);
  const coreAfter = cloneCoreRelation(after);
  const character = after?.character || before?.character || {};
  const classId = String(character?.classId || "");
  const backgroundId = String(character?.backgroundId || "");
  const storylineId = String(character?.storylineId || "");
  const lineageId = String(character?.lineageId || "");
  const className = CLASS_LABELS_KO[classId] || classId || "미정";
  const backgroundName = BACKGROUND_LABELS_KO[backgroundId] || backgroundId || "미정";
  const storylineName = STORYLINE_LABELS[storylineId] || storylineId || "미정";
  const lineageName = resolveLineageLabel(character);
  const maturity = computeMaturityTier({
    state: after,
    event,
    phase: phase || kind
  });

  return {
    kind: kind || "generic",
    phase: phase || null,
    source: source || "system",
    createdAt: now,
    runId: base?.run?.id || `run-${Date.now()}`,
    tick,
    day: Number(base?.world?.day || 1),
    act,
    locationId: base?.world?.locationId || "미확인 지점",
    event: event || null,
    choice: choice || null,
    auto: Boolean(auto),
    fallbackLine: fallbackLine || "",
    refs: refs || [],
    contentPack,
    contextActors: { npcName, factionName, activeQuest },
    contextProfile: {
      classId,
      className,
      backgroundId,
      backgroundName,
      lineageId,
      lineageName,
      storylineId,
      storylineName,
      gender: String(character?.gender || ""),
      storyFocus: String(character?.storyFocus || "")
    },
    current: {
      characterName: base?.character?.name || "무명",
      fatigue: Number(base?.resources?.fatigue || 0),
      taint: Number(base?.resources?.taint || 0),
      relation: coreAfter
    },
    maturity,
    delta: {
      resources: resourceDelta(before, after),
      hp: hpDelta(before, after),
      relation: relationDelta(coreBefore, coreAfter),
      actProgress: Number(after?.world?.actProgress || 0) - Number(before?.world?.actProgress || 0)
    }
  };
}
