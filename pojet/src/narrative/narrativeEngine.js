import { buildContextPacket } from "./contextPacketBuilder.js";
import { createChronicleMemoryStore } from "./chronicleMemoryStore.js";
import { generateCausalNotes, deriveFollowupHooks } from "./causalNotesGenerator.js";

function clampSentences(sentences, min = 3, max = 4) {
  const filtered = sentences.filter(Boolean);
  if (filtered.length < min) {
    while (filtered.length < min) filtered.push("기록은 원인과 결과를 연결하며 다음 선택을 준비한다.");
  }
  return filtered.slice(0, max);
}

function ensureDot(text = "") {
  const t = String(text || "").trim();
  if (!t) return "";
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

function hasBatchim(word = "") {
  const ch = String(word).trim().slice(-1);
  if (!ch) return false;
  const code = ch.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return true;
  return (code - 0xac00) % 28 !== 0;
}

function withTopic(word = "") {
  return `${word}${hasBatchim(word) ? "은" : "는"}`;
}

function withSubject(word = "") {
  return `${word}${hasBatchim(word) ? "이" : "가"}`;
}

function withObject(word = "") {
  return `${word}${hasBatchim(word) ? "을" : "를"}`;
}

function withAnd(word = "") {
  return `${word}${hasBatchim(word) ? "과" : "와"}`;
}

function pickVariant(seed, variants = [], fallback = "") {
  if (!Array.isArray(variants) || !variants.length) return fallback;
  const idx = Math.abs(Number(seed || 0)) % variants.length;
  return variants[idx] || fallback;
}

function oneLine(text = "", maxLen = 90) {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 3)}...`;
}

function buildContinuityBridge(packet, previousEntry) {
  if (!previousEntry) return "";
  const prevHook = oneLine(previousEntry?.followupHooks?.[0] || "");
  const prevCause = oneLine(previousEntry?.causalNotes?.[0] || "");
  if (prevHook) return `Previous thread impact: ${prevHook}`;
  if (prevCause) return `Previous scene result: ${prevCause}`;
  if (packet?.contextActors?.activeQuest) return `The previous choice still shapes the ${packet.contextActors.activeQuest} route`;
  return "";
}

function buildProfileFocusLine(packet) {
  const p = packet?.contextProfile || {};
  const bits = [p?.lineageName, p?.className, p?.backgroundName].filter(Boolean);
  const storyline = p?.storylineName ? `origin ${p.storylineName}` : "";
  if (!bits.length && !storyline) return "";
  return `${bits.join(" / ")} profile drives how this scene is interpreted and resolved${storyline ? ` (${storyline})` : ""}`;
}

function fallbackFollowupHooks(packet) {
  const quest = packet?.contextActors?.activeQuest || "active route";
  const category = String(packet?.event?.category || packet?.phase || packet?.kind || "branch");
  return [`Resolve the ${category} aftermath on the ${quest} route`];
}

function choiceEffectSummary(choice) {
  const fx = Array.isArray(choice?.effects) ? choice.effects : [];
  if (!fx.length) return "즉시 수치 변화 없음";
  const bits = fx.slice(0, 2).map((e) => {
    if (e.kind === "gain_gold") return `금화 ${e.value > 0 ? "+" : ""}${e.value}`;
    if (e.kind === "gain_xp") return `경험치 ${e.value > 0 ? "+" : ""}${e.value}`;
    if (e.kind === "renown") return `명성 ${e.value > 0 ? "+" : ""}${e.value}`;
    if (e.kind === "infamy") return `악명 ${e.value > 0 ? "+" : ""}${e.value}`;
    if (e.kind === "taint") return `오염 ${e.value > 0 ? "+" : ""}${e.value}`;
    if (e.kind === "fatigue") return `피로 ${e.value > 0 ? "+" : ""}${e.value}`;
    if (e.kind === "blessing") return `축복 ${e.value > 0 ? "+" : ""}${e.value}`;
    if (e.kind === "relation") return "관계 수치 변화";
    if (e.kind === "faction") return "세력 평판 변화";
    if (e.kind === "chronicle_tag") return "연대기 플래그";
    return e.kind;
  });
  return bits.join(", ");
}

function pickPoolLine(packet, phase, fallbackLine = "") {
  const map = { exploration: "movement", combat: "combat", social: "rumor", rest: "rest", event: "rumor" };
  const key = map[phase] || "movement";
  const pool = packet?.contentPack?.logLines?.[key];
  if (!Array.isArray(pool) || !pool.length) return fallbackLine || "다음 장면이 열린다";
  const idx = Math.abs(Number(packet?.tick || 0) + Number(packet?.day || 0) + key.length) % pool.length;
  return pool[idx];
}

function buildMaturityTags(packet) {
  const tags = [];
  const maturity = packet?.maturity || { level: 1, label: "S1", style: "restrained" };
  if (packet?.phase) tags.push(`phase:${packet.phase}`);
  if (packet?.event?.tier) tags.push(`tier:${packet.event.tier}`);
  tags.push(`maturity:${maturity.label}`);
  tags.push(`tone-style:${maturity.style}`);
  if (Number(packet?.current?.taint || 0) >= 40) tags.push("taint:high");
  if (Number(packet?.current?.fatigue || 0) >= 55) tags.push("fatigue:high");
  if (Number(packet?.current?.relation?.trust || 0) >= 45) tags.push("bond:stable");
  if (Number(packet?.current?.relation?.tension || 0) >= 35) tags.push("bond:tense");
  if (Number(packet?.current?.relation?.desire || 0) >= 26) tags.push("tone:desire");
  if (Number(packet?.current?.relation?.fear || 0) >= 20) tags.push("tone:control");
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
  if ((packet?.maturity?.level || 1) >= 4 && visualStateTags.includes("mood-shadow")) {
    return "고강도 톤(S4+)과 오염 누적으로 어두운 연출을 강화했다.";
  }
  if (visualStateTags.includes("mood-danger")) return "T3 분기라서 긴장 연출이 강화되었다.";
  if (visualStateTags.includes("mood-shadow")) return `오염 수치 ${packet?.current?.taint || 0}이 어두운 분위기를 만들었다.`;
  if (visualStateTags.includes("mood-win")) return "신뢰 기반 구간이라 안정적인 톤이 유지되었다.";
  if (visualStateTags.includes("mood-fatigue")) return `피로 수치 ${packet?.current?.fatigue || 0}으로 지친 톤이 적용되었다.`;
  return "중립 상태의 기본 연출이 적용되었다.";
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

function phaseNarrative(packet, tier) {
  const npcName = packet?.contextActors?.npcName || "익명 인물";
  const factionName = packet?.contextActors?.factionName || "무소속";
  const activeQuest = packet?.contextActors?.activeQuest || "미확정 임무";
  const phase = packet?.phase || "exploration";
  const undertone = relationUndertone(packet);
  const maturityTone = maturityUndertone(packet);

  if (tier === "T3") {
    const line = pickVariant(packet.tick + 20, [
      `${factionName}의 압력이 높아지고, ${withSubject(npcName)} 제안이 ${activeQuest}의 향방을 가른다`,
      `${activeQuest}는 후퇴가 어려운 분기로 진입했고, ${npcName}의 재촉이 공기를 잠근다`,
      `${factionName} 내부 균열이 드러나며, ${activeQuest}는 지금 당장 결단을 요구한다`
    ], `${activeQuest}가 대형 분기로 진입한다`);
    return line;
  }

  if (tier === "T2") {
    const line = pickVariant(packet.tick + 21, [
      `${withSubject(npcName)} ${activeQuest}의 조건을 내밀며, 이득과 관계의 저울을 흔든다`,
      `${factionName}의 제안은 짧은 보상과 긴 후폭풍을 동시에 요구한다`,
      `${activeQuest}는 서둘러도 늦어도 대가가 남는 중형 분기로 열린다`
    ], `${activeQuest}에 대한 중형 선택지가 열린다`);
    return line;
  }

  if (phase === "combat") {
    const line = `${withAnd(npcName)} 대치한 여파가 남아 있고, 생존과 체면이 동시에 시험대에 오른다`;
    return [line, undertone, maturityTone].filter(Boolean).join(". ");
  }
  if (phase === "social") {
    const line = `${factionName}의 대화석에서 짧은 한마디가 신뢰와 욕망 축을 함께 건드린다`;
    return [line, undertone, maturityTone].filter(Boolean).join(". ");
  }
  if (phase === "rest") {
    const line = `짧은 휴식으로 숨을 고르지만 ${activeQuest}의 압박은 밤새 남아 있다`;
    return [line, undertone, maturityTone].filter(Boolean).join(". ");
  }
  const moveLine = `${withObject(activeQuest)} 향해 이동하며 ${withSubject(npcName)} 남긴 단서와 숨은 의도를 맞춰 본다`;
  return [moveLine, undertone, maturityTone].filter(Boolean).join(". ");
}

function tierPressureLine(tier) {
  if (tier === "T3") return "대형 분기다. 한번 넘기면 관계선과 메인 루트가 크게 재배치된다";
  if (tier === "T2") return "중형 분기다. 짧은 지연도 주도권과 평판의 손실로 연결된다";
  return "일반 진행 구간이지만, 다음 선택의 압력은 이미 바닥에서 올라오고 있다";
}

function relationUndertone(packet) {
  const relation = packet?.current?.relation || {};
  const desire = Number(relation.desire || 0);
  const tension = Number(relation.tension || 0);
  const fear = Number(relation.fear || 0);
  const trust = Number(relation.trust || 0);

  if (desire >= 28 && tension >= 28) return "시선이 오래 머물며 유혹과 경계가 같은 온도로 번진다";
  if (desire >= 26) return "말 사이 침묵이 길어져 은밀한 긴장감이 공기층에 남는다";
  if (fear >= 22) return "공기가 눌리듯 가라앉아 지배와 복종의 기색이 드러난다";
  if (trust >= 45) return "조심스러운 신뢰가 형성되어 제안의 무게가 더 깊게 스민다";
  return "";
}

function maturityUndertone(packet) {
  const level = Number(packet?.maturity?.level || 1);
  if (level <= 1) return "";
  if (level === 2) return "말끝에 은밀한 여운이 남아 선택의 유혹을 키운다";
  if (level === 3) return "대화의 간격마다 긴장과 끌림이 교차하며 분위기를 달군다";
  if (level === 4) return "주도권을 둘러싼 욕망의 압력이 강해져 관계선이 빠르게 흔들린다";
  return "극단적인 밀도 속에서 지배와 굴복의 기색이 동시에 부상한다";
}

function safeText(value = "") {
  return String(value || "").trim();
}

function normalizeForMatch(text = "") {
  return safeText(text)
    .replace(/\s+/g, "")
    .toLowerCase();
}

function hasDesireUp(choice) {
  const fx = Array.isArray(choice?.effects) ? choice.effects : [];
  return fx.some((e) => e?.kind === "relation" && Number(e?.value?.desire || 0) > 0);
}

function isSexualChoice(packet, event, choice, state, nextState) {
  const labelRaw = safeText(choice?.label);
  const label = normalizeForMatch(labelRaw);
  const id = normalizeForMatch(choice?.id || "");
  const category = normalizeForMatch(event?.category || "");
  const lineage = normalizeForMatch(state?.character?.lineageId || "");
  const nextDesire = Number(nextState?.relationships?.npcRelations?.core?.desire || packet?.current?.relation?.desire || 0);

  const keywordHit = /(유혹|몸을판|몸으로협상|성행위|잠자리|애무|쾌락|육체|정사|침대|매춘|창부|유혹한다|몸판다|몸으로)/.test(labelRaw) ||
    /(seduce|sex|bed|lust|courtesan|succubus|incubus)/.test(label);
  const succubusLineage = lineage === "succubus";
  const succubusSkillLike = succubusLineage && (id.includes("trait-lineage") || category === "relationship" || category === "corruption" || hasDesireUp(choice));
  const highLustFlow = nextDesire >= 28 && (category === "relationship" || category === "social" || category === "market");

  return Boolean(keywordHit || succubusSkillLike || highLustFlow);
}

function buildDecisionActionLine(packet, choice, sexual) {
  const actor = packet?.current?.characterName || "당신";
  const npc = packet?.contextActors?.npcName || "상대";
  const action = safeText(choice?.label) || "결정";

  if (sexual) {
    return `${actor}은(는) ${npc}에게 ${action}를 밀어붙였다. 손끝과 입맞춤, 노골적인 신체 접촉으로 분위기를 성행위 쪽으로 틀어버렸다.`;
  }
  return `${actor}은(는) ${npc} 앞에서 ${action}를 실행했다. 말투와 자세, 타이밍까지 계산해 현재 국면의 주도권을 잡으려 했다.`;
}

function buildDecisionResultLine(packet, effectLine, sexual) {
  const relation = packet?.delta?.relation || {};
  const plusDesire = Number(relation?.desire || 0);
  const plusTension = Number(relation?.tension || 0);
  const plusTrust = Number(relation?.trust || 0);

  if (sexual) {
    const reaction = plusDesire > 0
      ? "상대의 호흡은 더 거칠어졌고, 관계의 욕망 축이 눈에 띄게 치솟았다."
      : "짧은 쾌락 뒤에 경계와 긴장이 동시에 남아 관계의 결이 날카로워졌다.";
    return `행동의 즉시 결과: ${effectLine}. ${reaction}`;
  }

  const relationTone = plusTrust > 0
    ? "신뢰가 조금 올라갔다."
    : plusTension > 0
      ? "긴장이 높아져 다음 대화 난도가 올라간다."
      : "관계의 축은 크게 흔들리지 않았다.";
  return `행동의 즉시 결과: ${effectLine}. ${relationTone}`;
}

function buildDecisionAftermathLine(packet, event, sexual) {
  const location = packet?.locationId || "현장";
  const faction = packet?.contextActors?.factionName || "주변 세력";
  const category = String(event?.category || "social");

  if (sexual) {
    return `${location}의 공기는 노골적으로 달아올랐고, ${faction} 쪽 시선도 변했다. 성행위로 만든 균열은 단순한 쾌락이 아니라 다음 협상 조건으로 남는다.`;
  }

  if (category === "faction" || category === "legacy") {
    return `${location}에서 남긴 결정은 개인 감정이 아니라 세력 계산표에 바로 기록된다.`;
  }
  return `${location}의 분위기가 바뀌면서 주변 인물들의 반응이 재정렬됐다.`;
}

function buildDecisionNextHookLine(packet, event) {
  const quest = packet?.contextActors?.activeQuest || "현재 과제";
  const tier = String(event?.tier || "T2");
  if (tier === "T3") {
    return `다음 선택을 위한 흐름: ${quest}의 핵심 분기가 열렸고, 여기서의 한 번 더 선택이 메인 루트를 고정한다.`;
  }
  return `다음 선택을 위한 흐름: ${quest} 주변에 새로운 변수들이 생겼고, 이어지는 장면에서 다시 선택지가 열린다.`;
}

function toLegacyText(entry) {
  return entry?.feedLine || entry?.text || "?? ??";
}

function scrubArtifactText(value = "") {
  return String(value || "")
    .replace(/\?{2,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeLogEntry(logInput, meta = {}) {
  if (logInput && typeof logInput === "object" && !Array.isArray(logInput)) {
    const feedLine = scrubArtifactText(logInput.feedLine || logInput.text || logInput.bodyParagraph || meta.fallbackLine || "기록");
    const bodyParagraph = scrubArtifactText(logInput.bodyParagraph || logInput.body || "");
    const causalNotes = (Array.isArray(logInput.causalNotes) ? logInput.causalNotes : [])
      .map((line) => scrubArtifactText(line))
      .filter(Boolean);
    const followupHooks = (Array.isArray(logInput.followupHooks) ? logInput.followupHooks : [])
      .map((line) => scrubArtifactText(line))
      .filter(Boolean);
    const tags = Array.isArray(logInput.tags) ? logInput.tags : [];
    const visualStateTags = Array.isArray(logInput.visualStateTags) ? logInput.visualStateTags : [];
    const refs = Array.isArray(logInput.refs) ? logInput.refs : [];
    const createdAt = logInput.createdAt || meta.createdAt || new Date().toISOString();
    return {
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
      visualStateReason: scrubArtifactText(logInput.visualStateReason || meta.visualStateReason || ""),
      refs,
      text: scrubArtifactText(logInput.text || feedLine)
    };
  }

  const text = scrubArtifactText(String(logInput ?? "").trim() || meta.fallbackLine || "기록 없음");
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
    const previousEntry = memory.recent(1)[0] || null;
    const ingredient = pickPoolLine(packet, packet.phase, packet.fallbackLine);
    const feedSource = options.feedSource || ingredient;
    const feedLine = `${packet.locationId} | ${feedSource}`;

    const causalNotes = generateCausalNotes(packet);
    const followupHooksRaw = deriveFollowupHooks(packet);
    const followupHooks = Array.isArray(followupHooksRaw) && followupHooksRaw.length
      ? followupHooksRaw
      : fallbackFollowupHooks(packet);
    const maturityTags = buildMaturityTags(packet);
    const visualStateTags = buildVisualStateTags(packet);
    const refs = baseRefs(packet);

    const tier = packet.event?.tier || options.tier || "T1";
    const eventNarrative = packet?.event?.text || packet?.event?.narrativeText || "";
    const lead = options.tierLead || `${withTopic(packet.current.characterName)} positions the next beat at ${packet.locationId}`;
    const phaseLine = phaseNarrative(packet, tier);
    const causalLine = causalNotes[0] || "This shift alters the setup for the next branch";
    const pressureLine = tierPressureLine(tier);
    const continuityLine = buildContinuityBridge(packet, previousEntry);
    const profileFocusLine = buildProfileFocusLine(packet);
    const hookLine = followupHooks[0]
      ? `Next beat: ${followupHooks[0]}`
      : "Next beat: the consequence chain is still unfolding";

    const customSentences = Array.isArray(options.bodySentences) ? options.bodySentences : null;
    const seededCustomSentences = customSentences
      ? [continuityLine, profileFocusLine, ...customSentences].filter(Boolean)
      : null;
    const sentences = seededCustomSentences
      ? clampSentences(seededCustomSentences.map((s) => ensureDot(s)), 4, 5)
      : clampSentences([
        ensureDot(lead),
        continuityLine ? ensureDot(continuityLine) : "",
        profileFocusLine ? ensureDot(profileFocusLine) : "",
        ensureDot(phaseLine),
        eventNarrative ? ensureDot(eventNarrative) : ensureDot(pressureLine),
        ensureDot(`${options.connective || "As a result,"} ${causalLine}`),
        ensureDot(hookLine)
      ], 4, 5);

    const tags = [packet.kind, packet.phase || "none"].filter(Boolean);
    if (continuityLine) tags.push("continuity-bridge");
    if (profileFocusLine) tags.push("profile-focus");

    const entry = normalizeLogEntry({
      kind: packet.kind,
      tier: packet.event?.tier || options.tier || null,
      source: packet.source,
      feedLine,
      bodyParagraph: sentences.join(" "),
      causalNotes,
      followupHooks,
      tags,
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
    return synthesize(packet, {
      connective: "이 변화로",
      feedSource: resolution?.summary || pickPoolLine(packet, phase)
    });
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
    return synthesize(packet, {
      tier: event?.tier,
      connective: "이 시점에",
      feedSource: `[${event?.tier || "T1"}] ${event?.title || event?.logSummary || "분기"}`
    });
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

    const effectLine = choiceEffectSummary(choice);
    const maturityLabel = packet?.maturity?.label || "S1";
    const sexual = isSexualChoice(packet, event, choice, state, nextState);
    const feedSource = `${auto ? "[자동 선택]" : "[선택]"} ${choice?.label || "선택"}`;
    const bodySentences = [
      buildDecisionActionLine(packet, choice, sexual),
      buildDecisionResultLine(packet, effectLine, sexual),
      buildDecisionAftermathLine(packet, event, sexual),
      buildDecisionNextHookLine(packet, event)
    ];
    return synthesize(packet, {
      tier: event?.tier,
      connective: "선택 결과로",
      feedSource,
      tierLead: `${packet.current.characterName}이 결정을 확정했다. 톤 강도 ${maturityLabel}에서 대가와 보상이 즉시 반영된다: ${effectLine}`,
      bodySentences
    });
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
