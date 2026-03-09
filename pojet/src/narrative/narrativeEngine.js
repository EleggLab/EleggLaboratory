import { buildContextPacket } from "./contextPacketBuilder.js";
import { createChronicleMemoryStore } from "./chronicleMemoryStore.js";
import { generateCausalNotes, deriveFollowupHooks } from "./causalNotesGenerator.js";

function clampSentences(sentences, min = 2, max = 4) {
  const filtered = sentences.filter(Boolean);
  if (filtered.length < min) {
    while (filtered.length < min) filtered.push("기록자는 원인과 결과를 짧게 묶어 다음 선택의 실마리로 남겼다.");
  }
  return filtered.slice(0, max);
}

function hasBatchim(word = "") {
  const ch = String(word).trim().slice(-1);
  if (!ch) return false;
  const code = ch.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

function withTopic(word = "") {
  return `${word}${hasBatchim(word) ? "은" : "는"}`;
}

function withObject(word = "") {
  return `${word}${hasBatchim(word) ? "을" : "를"}`;
}

function pickPoolLine(packet, phase, fallbackLine = "") {
  const map = { exploration: "movement", combat: "combat", social: "rumor", rest: "rest" };
  const key = map[phase] || "movement";
  const pool = packet?.contentPack?.logLines?.[key];
  if (!Array.isArray(pool) || !pool.length) return fallbackLine || "흐름을 기록했다.";
  const idx = Math.abs(Number(packet?.tick || 0) + Number(packet?.day || 0) + key.length) % pool.length;
  return pool[idx];
}

function buildMaturityTags(packet) {
  const tags = [];
  if (packet?.phase) tags.push(`phase:${packet.phase}`);
  if (packet?.event?.tier) tags.push(`tier:${packet.event.tier}`);
  if (Number(packet?.current?.taint || 0) >= 40) tags.push("taint:high");
  if (Number(packet?.current?.fatigue || 0) >= 55) tags.push("fatigue:high");
  if (Number(packet?.current?.relation?.trust || 0) >= 45) tags.push("bond:stable");
  if (Number(packet?.current?.relation?.tension || 0) >= 35) tags.push("bond:tense");
  if (Number(packet?.current?.relation?.desire || 0) >= 26) tags.push("adult:desire");
  if (Number(packet?.current?.relation?.fear || 0) >= 20) tags.push("adult:control");
  return tags;
}

function buildVisualStateTags(packet) {
  const tags = [];
  if (packet?.event?.tier === "T3") tags.push("mood-danger");
  if (Number(packet?.current?.taint || 0) >= 40) tags.push("mood-shadow");
  if (Number(packet?.current?.relation?.trust || 0) >= 45 && Number(packet?.current?.taint || 0) < 40) tags.push("mood-win");
  if (Number(packet?.current?.fatigue || 0) >= 65) tags.push("mood-fatigue");
  if (!tags.length) tags.push("mood-neutral");
  return tags;
}

function visualTagReason(visualStateTags, packet) {
  if (visualStateTags.includes("mood-danger")) return "T3 급 분기라 긴장 연출이 강화되었다.";
  if (visualStateTags.includes("mood-shadow")) return `오염 수치 ${packet?.current?.taint || 0}로 어두운 분위기가 반영되었다.`;
  if (visualStateTags.includes("mood-win")) return "신뢰 기반 상태가 유지되어 안정적인 톤으로 표현됐다.";
  if (visualStateTags.includes("mood-fatigue")) return `피로 수치 ${packet?.current?.fatigue || 0}로 소진 연출이 적용되었다.`;
  return "중립 상태라 기본 연출을 유지한다.";
}

function baseRefs(packet) {
  const refs = [
    `run:${packet?.runId || "-"}`,
    `tick:${packet?.tick || 0}`,
    `loc:${packet?.locationId || "-"}`,
    `npc:${packet?.contextActors?.npcName || "-"}`,
    `faction:${packet?.contextActors?.factionName || "-"}`,
    `quest:${packet?.contextActors?.activeQuest || "-"}`
  ];
  if (packet?.event?.eventId || packet?.event?.id) refs.push(`event:${packet.event.eventId || packet.event.id}`);
  return refs.concat(packet?.refs || []).slice(0, 8);
}

function toLegacyText(entry) {
  return entry?.feedLine || entry?.text || "기록 없음";
}

export function normalizeLogEntry(logInput, meta = {}) {
  if (logInput && typeof logInput === "object" && !Array.isArray(logInput)) {
    const feedLine = logInput.feedLine || logInput.text || logInput.bodyParagraph || meta.fallbackLine || "기록됨";
    const bodyParagraph = logInput.bodyParagraph || logInput.body || "";
    const causalNotes = Array.isArray(logInput.causalNotes) ? logInput.causalNotes : [];
    const followupHooks = Array.isArray(logInput.followupHooks) ? logInput.followupHooks : [];
    const tags = Array.isArray(logInput.tags) ? logInput.tags : [];
    const visualStateTags = Array.isArray(logInput.visualStateTags) ? logInput.visualStateTags : [];
    const refs = Array.isArray(logInput.refs) ? logInput.refs : [];
    const createdAt = logInput.createdAt || meta.createdAt || new Date().toISOString();
    const entry = {
      id: logInput.id || `log-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      kind: logInput.kind || meta.kind || "generic",
      tier: logInput.tier || meta.tier || null,
      source: logInput.source || meta.source || "system",
      createdAt,
      feedLine,
      bodyParagraph,
      causalNotes,
      followupHooks,
      tags,
      maturityTags: Array.isArray(logInput.maturityTags) ? logInput.maturityTags : [],
      visualStateTags,
      visualStateReason: logInput.visualStateReason || meta.visualStateReason || "",
      refs,
      text: logInput.text || feedLine
    };
    return entry;
  }

  const text = String(logInput ?? "").trim() || meta.fallbackLine || "기록 없음";
  return {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    kind: meta.kind || "legacy",
    tier: meta.tier || null,
    source: meta.source || "legacy",
    createdAt: meta.createdAt || new Date().toISOString(),
    feedLine: text,
    bodyParagraph: "",
    causalNotes: [],
    followupHooks: [],
    tags: [],
    maturityTags: [],
    visualStateTags: [],
    visualStateReason: "",
    refs: [],
    text
  };
}

export function createNarrativeEngine(contentPack) {
  const memory = createChronicleMemoryStore();

  function synthesize(packet, options = {}) {
    const ingredient = pickPoolLine(packet, packet.phase, packet.fallbackLine);
    const feedSource = options.feedSource || ingredient;
    const feedLine = `${packet.locationId} | ${feedSource}`;
    const causalNotes = generateCausalNotes(packet);
    const followupHooks = deriveFollowupHooks(packet);
    const maturityTags = buildMaturityTags(packet);
    const visualStateTags = buildVisualStateTags(packet);
    const refs = baseRefs(packet);

    const actor = withTopic(packet.current.characterName || "무명인");
    const placeObj = withObject(packet.locationId || "거리");
    const connective = options.connective || "그 여파로";
    const npcName = packet?.contextActors?.npcName || "이름 없는 목격자";
    const factionName = packet?.contextActors?.factionName || "변경의 잔당";
    const activeQuest = packet?.contextActors?.activeQuest || "미완의 의뢰";

    const adultTone = maturityTags.includes("adult:desire")
      ? `${npcName}의 낮은 숨소리와 함께 거래의 온도도 노골적으로 올라갔다`
      : maturityTags.includes("adult:control")
        ? `${factionName}의 시선이 닿는 순간, 우위와 복종의 기색이 공기처럼 번졌다`
        : `${npcName}조차 계산된 미소 뒤에 숨은 의도를 읽기 시작했다`;

    const sentences = clampSentences([
      `${actor} ${placeObj} 지나며 ${ingredient}`,
      `${connective} ${causalNotes[0] || "지난 선택의 대가가 지금 장면에 드러났다"}`,
      `${adultTone}.`,
      `${activeQuest}의 줄기는 끊기지 않았고, 다음 장면의 빚은 더 커졌다.`,
      followupHooks[0] ? `다음 장면에서는 ${followupHooks[0]} 같은 후폭풍이 기다린다.` : "정적은 잠깐뿐이고, 다음 선택은 더 비싼 값을 요구할 가능성이 크다."
    ], 3, 5);

    const entry = normalizeLogEntry({
      kind: packet.kind,
      tier: packet.event?.tier || options.tier || null,
      source: packet.source,
      feedLine,
      bodyParagraph: sentences.join(" "),
      causalNotes,
      followupHooks,
      tags: [packet.kind, packet.phase || "none"].filter(Boolean),
      maturityTags,
      visualStateTags,
      visualStateReason: visualTagReason(visualStateTags, packet),
      refs,
      text: feedLine
    }, {
      kind: packet.kind,
      tier: packet.event?.tier || options.tier || null,
      source: packet.source
    });

    memory.remember(entry);
    return entry;
  }

  function makePhaseLog({ state, nextState, phase, resolution, source }) {
    const packet = buildContextPacket({
      state,
      nextState,
      contentPack,
      kind: "phase",
      phase,
      source: source || "auto-loop",
      fallbackLine: resolution?.summary || "단계 진행",
      refs: [`phase:${phase}`]
    });
    return synthesize(packet, { connective: "그래서", feedSource: resolution?.summary || pickPoolLine(packet, phase) });
  }

  function makeEventOpenLog({ state, event }) {
    const packet = buildContextPacket({
      state,
      nextState: state,
      contentPack,
      kind: "event-open",
      phase: "event",
      event,
      source: "event-dispatch",
      fallbackLine: event?.title || event?.logSummary || "이벤트 발생",
      refs: [`event-tier:${event?.tier || "T1"}`]
    });
    return synthesize(packet, { tier: event?.tier, connective: "때문에", feedSource: `[${event?.tier || "T1"}] ${event?.title || event?.logSummary || "사건"}` });
  }

  function makeDecisionLog({ state, nextState, event, choice, auto }) {
    const packet = buildContextPacket({
      state,
      nextState,
      contentPack,
      kind: "event-choice",
      phase: "event",
      event,
      choice,
      auto,
      source: auto ? "auto-choice" : "manual-choice",
      fallbackLine: choice?.label || "선택",
      refs: [`choice:${choice?.id || "unknown"}`]
    });
    return synthesize(packet, { tier: event?.tier, connective: "이 선택으로", feedSource: `${auto ? "[자동 선택]" : "[선택]"} ${choice?.label || "선택"}` });
  }

  function makeGenericLog({ state, kind, source, text, refs }) {
    const packet = buildContextPacket({
      state,
      nextState: state,
      contentPack,
      kind: kind || "generic",
      source: source || "system",
      fallbackLine: text,
      refs
    });
    return synthesize(packet, { feedSource: text || pickPoolLine(packet, packet.phase || "exploration") });
  }

  return {
    makePhaseLog,
    makeEventOpenLog,
    makeDecisionLog,
    makeGenericLog,
    normalizeLogEntry,
    recentMemory: memory.recent,
    relatedMemory: memory.relatedByTag,
    toLegacyText
  };
}
