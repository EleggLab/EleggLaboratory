import { createStore } from "../../src/core/store.js";
import { createCharacterTemplate, buildCharacterFromTemplate } from "../../src/core/state-machine.js";
import { ruleResolver } from "../../src/resolvers/ruleResolver.js";
import { CLASS_AI, DECISION_PRESETS } from "../../src/config/runtimeData.js";
import { shouldForcePause, maybeDispatchDecisionEvent } from "../../src/events/eventDispatcher.js";
import { createNarrativeEngine } from "../../src/narrative/narrativeEngine.js";
import { buildLogQualityReport } from "../narrative/logQualityValidator.js";
import { maybeLevelUp } from "../resolvers/rewardResolver.js";
import { inferCombatAbility } from "../resolvers/combatResolver.js";

export function runSimulationTests() {
  const results = [];
  const store = createStore();
  const character = buildCharacterFromTemplate(createCharacterTemplate({ classId: "fighter" }));
  store.dispatch({ type: "SET_CHARACTER", payload: { character } });
  store.dispatch({ type: "RUN_START" });

  const state = store.getState();

  const chk = ruleResolver.abilityCheck({ state, ability: "STR", dc: 10, proficient: true });
  results.push({ name: "ability check 계산", pass: typeof chk.total === "number" && typeof chk.success === "boolean" });

  const save = ruleResolver.save({ state, ability: "CON", dc: 12, proficient: false });
  results.push({ name: "save 계산", pass: typeof save.total === "number" && typeof save.success === "boolean" });

  const preset = DECISION_PRESETS["신중형"];
  results.push({ name: "decision preset 적용", pass: preset.t2DefaultChoice === "safest" });

  const ai = CLASS_AI.fighter;
  results.push({ name: "class AI 로직 호출", pass: Array.isArray(ai.openerPriority) && ai.openerPriority.length > 0 });

  const fakeT3 = { tier: "T3", mustPause: true };
  results.push({ name: "T3 강제 정지 플래그", pass: shouldForcePause(fakeT3) === true });

  const combatAbilityOk = inferCombatAbility("ranger") === "DEX" && inferCombatAbility("monk") === "DEX";
  results.push({ name: "전투 능력치 매핑(ranger/monk)", pass: combatAbilityOk });

  let hpBounded = true;
  for (let i = 0; i < 300; i += 1) {
    const patch = maybeLevelUp({
      character: { level: 3, xp: 999, maxHp: 30, hp: 16 },
      resources: { renown: 0 }
    });
    if (!patch || patch.character.hp > patch.character.maxHp) {
      hpBounded = false;
      break;
    }
  }
  results.push({ name: "레벨업 HP 상한 보정", pass: hpBounded });

  store.dispatch({ type: "LOG", payload: { log: "test-log" } });
  store.dispatch({ type: "HISTORY_EVENT", payload: { entry: { eventId: "test", tier: "T1" } } });
  const final = store.getState();
  results.push({ name: "런 상태 로그/히스토리 기록", pass: final.history.logs.length > 0 && final.history.events.length > 0 });

  const legacyQuality = buildLogQualityReport(final.history.logs);
  results.push({ name: "서사 로그 품질 리포트(legacy)", pass: legacyQuality.pass, summary: legacyQuality.summary });

  const narrative = createNarrativeEngine({
    logLines: { movement: ["이동"], combat: ["전투"], rumor: ["소문"], rest: ["휴식"] },
    npcs: [{ name: "세라 쏜" }],
    factions: [{ name: "밀수 조합" }]
  });
  const generated = narrative.makeGenericLog({ state: final, kind: "phase", source: "test", text: "생성 로그 검증" });
  const generatedQuality = buildLogQualityReport([generated]);
  const generatedBody = String(generated?.bodyParagraph || "");
  const generatedPass = generatedQuality.pass || (generatedBody.length >= 80 && generatedQuality.checked >= 1);
  results.push({ name: "서사 로그 품질 리포트(generated)", pass: generatedPass, summary: generatedQuality.summary });

  const decisionState = structuredClone(final);
  decisionState.location = decisionState.location || {};
  decisionState.character.name = "테스터";
  decisionState.character.lineageId = "succubus";
  decisionState.location.current = "검은비 변경";
  decisionState.relationships = decisionState.relationships || { npcRelations: {} };
  decisionState.relationships.npcRelations = {
    ...(decisionState.relationships.npcRelations || {}),
    core: { trust: 24, desire: 31, tension: 18, fear: 8 }
  };
  decisionState.world.activeQuestId = "회색 계약";
  decisionState.world.quests = decisionState.world.quests || {};
  decisionState.world.quests["회색 계약"] = {
    id: "회색 계약",
    name: "회색 계약",
    status: "active"
  };

  const decisionEvent = {
    eventId: "t2-sexual-flow",
    id: "t2-sexual-flow",
    tier: "T2",
    category: "relationship",
    title: "유혹의 거래",
    text: "입술보다 값비싼 말이 오간다."
  };
  const decisionChoice = {
    id: "choice-seduce",
    label: "유혹한다",
    effects: [
      { kind: "relation", value: { desire: 4 } },
      { kind: "gain_xp", value: 6 }
    ]
  };
  const nextDecisionState = structuredClone(decisionState);
  nextDecisionState.relationships.npcRelations.core.desire = 35;

  const decisionLog = narrative.makeDecisionLog({
    state: decisionState,
    nextState: nextDecisionState,
    event: decisionEvent,
    choice: decisionChoice,
    auto: false
  });
  const decisionBody = String(decisionLog?.bodyParagraph || "");
  const decisionSentences = decisionBody.split(/[.!?]\s+/).filter(Boolean).length;
  const hasActionResultHook = decisionSentences >= 4
    && Array.isArray(decisionLog?.causalNotes) && decisionLog.causalNotes.length > 0
    && Array.isArray(decisionLog?.followupHooks) && decisionLog.followupHooks.length > 0;
  const hasSexualAftermath = decisionBody.includes("성행위");
  results.push({ name: "선택 로그 4단 흐름(행동/결과/후속/다음선택)", pass: hasActionResultHook });
  results.push({ name: "유혹 선택 후 성행위 묘사 반영", pass: hasSexualAftermath });

  const eventState = structuredClone(final);
  eventState.time.tick = 7;
  eventState.world.act = 2;
  eventState.character.classId = "bard";
  eventState.character.lineageId = "succubus";
  eventState.character.backgroundId = "smuggler-runner";
  eventState.character.abilities.CHA = 16;
  eventState.history.events = [{ stage: "opened", tick: 5 }];

  const gatedPack = {
    eventsT2: [
      {
        id: "t2-test-social",
        tier: "T2",
        category: "social",
        classAffinity: ["bard"],
        backgroundAffinity: ["smuggler-runner"],
        statAffinity: ["CHA"],
        triggerConditions: { actMin: 1, minLevel: 1, requires: [], excludes: [] },
        narrativeText: "밀실 협상이 시작됐다.",
        choices: [{ id: "c1", label: "받아들인다", effects: [{ kind: "gain_gold", value: 8 }] }]
      }
    ],
    eventsT3: []
  };
  const dispatched = maybeDispatchDecisionEvent(eventState, gatedPack);
  const hasTraitChoice = Boolean((dispatched?.choices || []).find((c) => String(c.id).startsWith("trait-")));
  const hasExpandedText = String(dispatched?.text || "").includes("\n\n");
  results.push({ name: "조건 기반 이벤트 선택", pass: Boolean(dispatched && dispatched.eventId === "t2-test-social") });
  results.push({ name: "특성 기반 선택지 주입", pass: hasTraitChoice });
  results.push({ name: "이벤트 텍스트 확장", pass: hasExpandedText });

  return results;
}
