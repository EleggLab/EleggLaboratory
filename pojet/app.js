import { createStore } from "./src/core/store.js";
import { createCharacterTemplate, buildCharacterFromTemplate, createQuest, describeCharacter } from "./src/core/state-machine.js";
import { createAutoProgressionController, applyDecisionChoice, evaluateRunEndType } from "./runtime/loop/autoProgressionController.js";
import {
  ABILITIES,
  DECISION_PRESETS,
  GEAR_POOL
} from "./src/config/runtimeData.js";
import { loadContentPack } from "./src/config/contentLoader.js";
import { loadPresentationPack } from "./src/presentation/presentationLoader.js";
import { derivePortraitTags, mapPortraitVisual, portraitStateCount } from "./src/presentation/portraitStateMapper.js";
import { applyPortraitRender } from "./src/presentation/portraitRenderer.js";
import { resolveAssetPortrait, applyAssetPortrait, resolveSceneBackground, applySceneBackground } from "./src/presentation/assetPortraitRenderer.js";
import { createPanelEmphasisController } from "./src/presentation/panelEmphasisController.js";
import { createSaveLoadManager } from "./src/meta/saveLoadManager.js";
import { resolveLegacyReward, applyLegacyToRun } from "./src/meta/legacyUnlockResolver.js";
import { initNextRunFromLineage } from "./src/meta/lineageInitializer.js";
import { createChronicleEntry } from "./src/meta/chronicleWriter.js";
import { runSimulationTests } from "./runtime/tests/simulationTests.js";
import { normalizeLogEntry } from "./src/narrative/narrativeEngine.js";

const URL_PARAMS = new URLSearchParams(window.location.search);
const AUTO_CAPTURE_MODE = URL_PARAMS.get("autocapture") === "1";
const AUTO_BEGIN_DELAY_MS = Number(URL_PARAMS.get("autobeginMs") || 900);
const AUTO_CHOICE_DELAY_MS = Number(URL_PARAMS.get("autochoiceMs") || 320);

const store = createStore();
const contentPack = await loadContentPack();
const presentationPack = await loadPresentationPack();
const loop = createAutoProgressionController(store, contentPack);
const emphasis = createPanelEmphasisController(presentationPack.panelEmphasisRules);
const saveManager = createSaveLoadManager();

const ui = {
  log: gid("log-panel"),
  storyStage: gid("story-stage"),
  storyPrev: gid("story-prev-btn"),
  storyNext: gid("story-next-btn"),
  storyPage: gid("story-page-label"),
  mainPanel: gid("main-panel"),
  tutorial: gid("tutorial-banner"),
  eventCard: gid("event-card"),
  eventTitle: gid("event-title"),
  eventText: gid("event-text"),
  eventMeta: gid("event-meta"),
  eventChoices: gid("event-choices"),
  eventChoiceHints: gid("event-choice-hints"),
  eventTimer: gid("event-timer"),
  reportIssueBtn: gid("report-issue-btn"),
  reportIssueStatus: gid("report-issue-status"),
  charName: gid("char-name"),
  charTag: gid("char-tag"),
  charTags: gid("char-status-tags"),
  portraitStates: gid("portrait-state-list"),
  portrait: gid("portrait"),
  portraitArt: gid("portrait-art"),
  face: gid("portrait-face"),
  relBars: gid("relationship-bars"),
  axisBars: gid("axis-bars"),
  comp: gid("companion-strip"),
  act: gid("act-label"),
  loc: gid("location-label"),
  day: gid("day-label"),
  bar: gid("act-progress-bar"),
  hp: gid("hp-label"),
  gold: gid("gold-label"),
  fame: gid("fame-label"),
  taint: gid("taint-label"),
  fatigue: gid("fatigue-label"),
  stats: gid("stats-grid"),
  sexualStats: gid("sexual-stats-grid"),
  quests: gid("quest-list"),
  gear: gid("gear-list"),
  legacy: gid("legacy-list"),
  historyTabs: gid("history-tabs"),
  historyBody: gid("history-body"),
  creator: gid("creator-modal"),
  difficultyGroup: gid("difficulty-group"),
  difficultyNote: gid("difficulty-note"),
  genderGroup: gid("gender-group"),
  genderNote: gid("gender-note"),
  name: gid("create-name"),
  beastkindWrap: gid("create-beastkind-wrap"),
  beastkind: gid("create-beastkind"),
  race: gid("create-race"),
  cls: gid("create-class"),
  bg: gid("create-background"),
  storyline: gid("create-storyline"),
  begin: gid("begin-btn"),
  randomBtn: gid("randomize-btn"),
  pause: gid("pause-btn"),
  save: gid("save-btn"),
  load: gid("load-btn"),
  endRun: gid("end-run-btn"),
  settingsBtn: gid("settings-btn"),
  newLife: gid("new-life-btn"),
  setModal: gid("settings-modal"),
  setClose: gid("settings-close"),
  setTabs: gid("settings-tabs"),
  setBody: gid("settings-body"),
  inherit: gid("inheritance-note"),
  t2Style: gid("create-t2-style"),
  alloc: gid("ability-allocator"),
  runEndModal: gid("run-end-modal"),
  runEndSummary: gid("run-end-summary"),
  runEndNext: gid("run-end-next-btn"),
  runEndClose: gid("run-end-close-btn")
};

const MATURE_EVENT_CATEGORIES = new Set(["relationship", "corruption", "social", "market", "legacy"]);
const tutorials = [
  "[가이드 1/3] 로그가 천천히 출력된 뒤 선택지가 열린다. 지금은 세계와 캐릭터의 톤을 읽는 구간이다.",
  "[가이드 2/3] 1로그 1선택으로 진행된다. 한 번의 선택이 다음 장면, 관계, 자원 흐름까지 같이 바꾼다.",
  "[가이드 3/3] 관계(신뢰·긴장·욕망)와 오염 수치가 수위와 결과를 결정한다. 강한 선택일수록 여파가 길게 남는다."
];

let eventCountdown = null;
let eventCountdownKey = "";
let eventCountdownLeft = 0;
let eventTypingTimer = null;
let eventTypingKey = "";
let eventTypingDone = true;
let currentHistoryTab = "현재 런 로그";
let lastVisualTags = [];
let alreadyEnded = false;
let currentSpeed = 1;
let lastPortraitAssetSig = "";
let lastSceneSig = "";
let autoChoiceTimer = null;
let storyFeed = [];
let storyCursor = 0;
let pendingInterludePages = null;
let postChoiceInterlude = null;
let queuedEventAfterInterlude = null;
let reportStatusTimer = null;

const abilityAlloc = { STR: 15, DEX: 14, CON: 13, INT: 12, WIS: 10, CHA: 8 };
const EVENT_TYPING_BASE_MS = 22;
const BEAST_KIND_OPTIONS = [
  { value: "wolf", label: "늑대" },
  { value: "fox", label: "여우" },
  { value: "sheep", label: "양" },
  { value: "rabbit", label: "토끼" }
];
const SEXUAL_STAT_LABELS = {
  experienceFactor: "경험 인수",
  lustfulness: "음란도",
  arousal: "흥분도",
  auraOfLust: "색의 기운"
};

const DIFFICULTY_LIMITS = {
  normal: { min: 8, max: 20, note: "난이도: 원하는 빌드로 자유 분배 가능" },
  high: { min: 8, max: 18, note: "난이도 높음: 능력치 최대 제안 18 적용" }
};

const GENDER_STORY_NOTES = {
  male: "남성 선택: 여러 여성 NPC와 만나는 스토리 중심",
  female: "여성 선택: 내 캐릭터의 변화와 내면에 집중"
};

let selectedDifficulty = "normal";
let selectedGender = "male";

const CREATOR_LINEAGE_OPTIONS = [
  { value: "human", label: "인간" },
  { value: "longkin", label: "엘프" },
  { value: "succubus", label: "서큐버스" },
  { value: "smallkin", label: "하플링" },
  { value: "draconic", label: "용족" },
  { value: "mixed-grace", label: "수인족" },
  { value: "infernal", label: "마족" },
  { value: "mixed-fury", label: "다크 엘프" },
  { value: "smallfoot", label: "뱀파이어" }
];

const CREATOR_CLASS_OPTIONS = [
  { value: "bard", label: "바드" },
  { value: "fighter", label: "기사" },
  { value: "ranger", label: "궁수" },
  { value: "warlock", label: "창부" },
  { value: "monk", label: "댄서" },
  { value: "wizard", label: "마법사" },
  { value: "druid", label: "여행자" },
  { value: "rogue", label: "도둑" },
  { value: "sorcerer", label: "떠돌이 상인" }
];

const CREATOR_BACKGROUND_OPTIONS = [
  { value: "orphan-cutpurse", label: "고아 출신" },
  { value: "border-conscript", label: "노예시장에 있었다가 도망침" },
  { value: "fallen-bastard", label: "귀족 가문의 외동" },
  { value: "tower-dropout", label: "숲속 마녀에게 주워져 길러짐" },
  { value: "funeral-aide", label: "창녀의 자식으로 창녀촌에서 길러짐" },
  { value: "caravan-guard", label: "시골 지방의 농부 부부의 자식으로 길러짐" },
  { value: "forest-watch", label: "부모가 없어 산에서 동물들과 함께 길러짐" },
  { value: "smuggler-runner", label: "타국에서 배를 타고 따라 들어온 밀행자" },
  { value: "relic-digger", label: "왕가의 핏줄이지만 낮은 왕권 순위를 가진 이단아" }
];

const INITIAL_STORYLINE_OPTIONS = [
  { value: "battleworn-veteran", label: "1. 많은 전투와 성행위를 경험하고 감정이 죽어가고 있다 (도심 외곽, 30살 시작)" },
  { value: "academy-prodigy", label: "2. 추천으로 들어간 전투 아카데미 1학년 (전투/성적 만남이 쉬움, 20살 시작)" },
  { value: "mountain-adept", label: "3. 산속에서 수련했고 남들은 보지 못하는 기운을 본다 (23살 시작)" },
  { value: "brothel-fixer", label: "4. 창녀촌에서 포주를 했다 (성행위 경험/언행 능력 높음, 21살 시작)" },
  { value: "thief-crew", label: "5. 도둑 크루 소속, 경험 많고 민첩하며 장난을 잘 친다 (25살 시작)" }
];

init();

function init() {
  fillSelectFromOptions(ui.race, CREATOR_LINEAGE_OPTIONS);
  fillSelectFromOptions(ui.beastkind, BEAST_KIND_OPTIONS);
  fillSelectFromOptions(ui.cls, CREATOR_CLASS_OPTIONS);
  fillSelectFromOptions(ui.bg, CREATOR_BACKGROUND_OPTIONS);
  fillSelectFromOptions(ui.storyline, INITIAL_STORYLINE_OPTIONS);
  setDifficultySelection(selectedDifficulty);
  setGenderSelection(selectedGender);
  toggleBeastkindVisibility();
  renderAbilityAllocator();
  renderSettingsSummary();
  renderHistoryTabs();
  bindControls();
  renderStoryReader();
  openCreator(true);
  renderTutorial(store.getState());

  const tests = runSimulationTests();
  tests.forEach((t) => pushLog(`[테스트] ${t.name}: ${t.pass ? "PASS" : "FAIL"}${t.summary ? ` | ${t.summary}` : ""}`));
  pushLog(`[초상화] 조합 프리셋 ${portraitStateCount(presentationPack.portraitStateMap)}개 준비됨`);

  store.subscribe((state, action) => {
    if (action.type === "LOG") appendLog(action.payload.log);
    if (action.type === "HISTORY_EVENT" && action.payload?.entry?.stage === "resolved") {
      pendingInterludePages = buildPostChoiceInterludePages(state, action.payload.entry);
    }
    if (action.type === "CLEAR_ACTIVE_EVENT" && pendingInterludePages?.length) {
      postChoiceInterlude = {
        key: `interlude-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        index: 0,
        pages: pendingInterludePages
      };
      queuedEventAfterInterlude = null;
      pendingInterludePages = null;
    }
    renderState(state);
    renderEvent(state.activeDecisionEvent, state);
    renderHistory(state);

    if (state.run.status === "running" && state.time.tick > 0 && state.time.tick % 6 === 0) {
      saveManager.save(state, true);
    }
    renderTutorial(state);

    if (action.type === "SET_ACTIVE_EVENT") {
      const tier = state.activeDecisionEvent?.tier;
      if (tier === "T3") emphasis.apply(ui.portrait, "T3");
      if (tier === "T2") emphasis.apply(ui.portrait, "T2");
    }
    if (action.type === "HISTORY_EVENT" && action.payload?.entry?.tier === "T3") {
      emphasis.apply(ui.portrait, "T3");
    }
    if (action.type === "APPLY_PATCH" && state.character && state.character.level > 1) {
      emphasis.apply(ui.portrait, "LEVEL_UP");
    }
    if (AUTO_CAPTURE_MODE) autoCaptureTick(state);

    const endType = state.character ? evaluateRunEndType(state) : null;
    if (state.run.status === "running" && endType && !alreadyEnded) {
      finalizeRun(endType);
    }
  });
  if (AUTO_CAPTURE_MODE) {
    scheduleAutoBegin();
  }
}

function scheduleAutoBegin() {
  setTimeout(() => {
    if (!store.getState().character && !ui.creator.classList.contains("hidden")) {
      beginRun();
    }
  }, AUTO_BEGIN_DELAY_MS);
}

function autoCaptureTick(state) {
  if (postChoiceInterlude) return;
  const active = state?.activeDecisionEvent;
  if (!active || !Array.isArray(active.choices) || !active.choices.length) return;
  if (!eventTypingDone) return;
  clearTimeout(autoChoiceTimer);
  autoChoiceTimer = setTimeout(() => {
    const live = store.getState();
    const evt = live?.activeDecisionEvent;
    if (!evt || !Array.isArray(evt.choices) || !evt.choices.length) return;
    if (!eventTypingDone) return;
    applyDecisionChoice(store, evt.choices[0], true, contentPack);
  }, AUTO_CHOICE_DELAY_MS);
}

function renderTutorial(state) {
  if (!ui.tutorial) return;
  const stage = resolveTutorialStage(state);
  const text = tutorials[stage] || tutorials[0];
  ui.tutorial.textContent = text;
  ui.tutorial.dataset.stage = String(stage + 1);
}

function resolveTutorialStage(state) {
  const events = Array.isArray(state?.history?.events) ? state.history.events : [];
  const opened = events.filter((x) => x?.stage === "opened").length;
  const resolved = events.filter((x) => x?.stage === "resolved").length;
  const matureOpened = events.filter((x) => x?.stage === "opened" && MATURE_EVENT_CATEGORIES.has(String(x?.category || ""))).length;
  if (resolved >= 1) return 2;
  if (opened >= 1 || matureOpened >= 1) return 1;
  return 0;
}

function bindControls() {
  qsa("[data-speed]").forEach((b) => {
    b.onclick = () => {
      store.dispatch({ type: "TIME_SPEED", payload: { speed: Number(b.dataset.speed) } });
      setActiveSpeed(Number(b.dataset.speed));
      store.dispatch({ type: "LOG", payload: { log: `배속 ${b.dataset.speed}x` } });
    };
  });

  ui.pause.onclick = () => {
    const status = store.getState().run.status;
    if (status === "running") {
      store.dispatch({ type: "RUN_PAUSE" });
      ui.pause.textContent = "재개";
      store.dispatch({ type: "LOG", payload: { log: "시간이 멈췄다." } });
      return;
    }
    if (status === "paused") {
      store.dispatch({ type: "RUN_RESUME" });
      ui.pause.textContent = "일시정지";
      store.dispatch({ type: "LOG", payload: { log: "시간이 다시 흐른다." } });
      return;
    }
  };

  ui.save.onclick = () => {
    saveManager.save(store.getState(), false);
    store.dispatch({ type: "LOG", payload: { log: "수동 저장 완료." } });
  };

  ui.load.onclick = () => {
    const loaded = saveManager.load(false);
    if (!loaded) {
      store.dispatch({ type: "LOG", payload: { log: "불러올 저장이 없다." } });
      return;
    }
    store.dispatch({ type: "HYDRATE_STATE", payload: { state: loaded } });
    if (loaded.run?.status === "running") loop.start();
    store.dispatch({ type: "LOG", payload: { log: "저장을 불러왔다." } });
  };

  ui.endRun.onclick = () => finalizeRun("glorious_retirement");

  ui.settingsBtn.onclick = () => ui.setModal.classList.remove("hidden");
  ui.setClose.onclick = () => ui.setModal.classList.add("hidden");
  ui.newLife.onclick = () => openCreator(true);

  ui.randomBtn.onclick = randomizeCreator;
  ui.begin.onclick = beginRun;
  qsa("[data-difficulty]", ui.difficultyGroup).forEach((btn) => {
    btn.onclick = () => setDifficultySelection(btn.dataset.difficulty || "normal");
  });
  qsa("[data-gender]", ui.genderGroup).forEach((btn) => {
    btn.onclick = () => setGenderSelection(btn.dataset.gender || "male");
  });
  ui.race.onchange = () => {
    toggleBeastkindVisibility();
  };

  ui.storyPrev.onclick = () => moveStoryCursor(1);
  ui.storyNext.onclick = () => moveStoryCursor(-1);

  ui.runEndClose.onclick = () => ui.runEndModal.classList.add("hidden");
  ui.runEndNext.onclick = () => {
    ui.runEndModal.classList.add("hidden");
    openCreator(true);
  };

  if (ui.reportIssueBtn) {
    ui.reportIssueBtn.onclick = () => { copyActiveIssueReport(); };
  }
}

function beginRun() {
  alreadyEnded = false;
  store.reset();
  clearEventRenderState();
  pendingInterludePages = null;
  postChoiceInterlude = null;
  queuedEventAfterInterlude = null;
  storyFeed = [];
  storyCursor = 0;
  renderStoryReader();

  const storylineId = ui.storyline?.value || INITIAL_STORYLINE_OPTIONS[0].value;
  const lineageId = ui.race.value;
  const beastKind = lineageId === "mixed-grace" ? ui.beastkind.value : null;

  const tpl = createCharacterTemplate({
    name: ui.name.value.trim() || undefined,
    classId: ui.cls.value,
    lineageId,
    backgroundId: ui.bg.value,
    gender: selectedGender,
    difficultyId: selectedDifficulty,
    beastKind,
    storylineId,
    abilities: structuredClone(abilityAlloc),
    automationPreset: ui.t2Style.value || "신중형",
    sexualStats: defaultSexualStats()
  });

  const character = buildCharacterFromTemplate(tpl);
  character.gear.push(pick(GEAR_POOL));
  const dailyPool = (contentPack.questlines || []).filter((q) => q.questType === "daily");
  character.questLog = [dailyPool.length ? toQuestFromContent(pick(dailyPool)) : createQuest()];

  const latestArchive = saveManager.getArchive()[0] || null;
  const latestRunType = latestArchive ? findRunEndMeta(latestArchive.outcome) : null;
  const reward = resolveLegacyReward(presentationPack.legacyRewards, latestRunType?.legacyRewardId);

  store.dispatch({ type: "SET_CHARACTER", payload: { character } });

  if (latestArchive) {
    const lineagePatch = initNextRunFromLineage(store.getState(), latestArchive, reward);
    store.dispatch({ type: "APPLY_PATCH", payload: { patch: lineagePatch } });
    const withLegacy = applyLegacyToRun(store.getState(), reward);
    store.dispatch({ type: "HYDRATE_STATE", payload: { state: withLegacy } });
    store.dispatch({ type: "LOG", payload: { log: `[계승] ${latestArchive.title}의 흔적이 다음 삶에 남았다.` } });
  }

  const region = (contentPack.regions || [])[0];
  const companion = (contentPack.companions || [])[0];
  const storylineSetup = buildInitialStorylineSetup(store.getState(), storylineId, region?.name);
  if (storylineSetup.patch) {
    store.dispatch({ type: "APPLY_PATCH", payload: { patch: storylineSetup.patch } });
  } else if (region) {
    store.dispatch({ type: "APPLY_PATCH", payload: { patch: { world: { locationId: region.name } } } });
  }
  if (companion) {
    store.dispatch({ type: "APPLY_PATCH", payload: { patch: { character: { activeCompanion: companion.name } } } });
  }

  store.dispatch({ type: "RUN_START" });
  store.dispatch({ type: "APPLY_PATCH", payload: { patch: { automation: { t2Policy: "ask" } } } });
  store.dispatch({ type: "LOG", payload: { log: `${store.getState().character.name}의 연대기가 시작된다.` } });
  store.dispatch({ type: "LOG", payload: { log: selectedGender === "male" ? "[성별 포커스] 남성 루트: 다양한 여성 NPC와 관계 중심으로 전개된다." : "[성별 포커스] 여성 루트: 내 캐릭터의 변화와 내면 중심으로 전개된다." } });
  store.dispatch({ type: "LOG", payload: { log: selectedDifficulty === "high" ? "[난이도] 높은 난이도 제안치가 적용되어 성장 선택이 더 빡빡하다." : "[난이도] 자유 분배 모드로 시작한다." } });
  store.dispatch({ type: "LOG", payload: { log: `[세계관] 욕망과 권력이 거래되는 성인 다크 판타지 구역에 진입했다.` } });
  store.dispatch({ type: "LOG", payload: { log: `[안내] 초반 선택은 관계 밀도(신뢰/긴장/욕망)와 오염 수치에 즉시 반영된다.` } });
  (storylineSetup.logs || []).forEach((log) => {
    store.dispatch({ type: "LOG", payload: { log } });
  });

  if (companion) store.dispatch({ type: "LOG", payload: { log: `[동료] ${companion.name}이(가) 합류했다.` } });
  (contentPack.npcs || []).slice(0, 4).forEach((npc) => {
    store.dispatch({ type: "LOG", payload: { log: `[인물] ${npc.name}: ${npc.firstImpression}` } });
  });
  (contentPack.factions || []).slice(0, 2).forEach((f) => {
    store.dispatch({ type: "LOG", payload: { log: `[세력] ${f.name}: ${f.identity}` } });
  });

  ui.creator.classList.add("hidden");
  ui.pause.textContent = "일시정지";
  loop.start();
}

function finalizeRun(endType) {
  const state = store.getState();
  if (!state.character) return;
  if (state.run.status === "ended") return;
  alreadyEnded = true;
  loop.stop();

  const endMeta = findRunEndMeta(endType);
  const rewardId = endMeta?.legacyRewardId;
  const entry = createChronicleEntry(state, endType, endMeta, rewardId, lastVisualTags);
  store.dispatch({ type: "CHRONICLE_ENTRY", payload: { entry } });
  saveManager.archiveChronicle(entry);
  saveManager.save(store.getState(), false);
  saveManager.clearCurrent();
  store.dispatch({ type: "RUN_END", payload: { cause: endType } });

  const reward = resolveLegacyReward(presentationPack.legacyRewards, rewardId);
  ui.runEndSummary.innerHTML = [
    `<div class="setting-row"><strong>종결</strong><span>${endMeta?.displayName || endType}</span></div>`,
    `<div class="setting-row"><strong>연대기 문장</strong><span>${endMeta?.tone || "비가 멎기 전, 이름이 기록되었다."}</span></div>`,
    `<div class="setting-row"><strong>요약</strong><span>${entry.summary}</span></div>`,
    `<div class="setting-row"><strong>유산</strong><span>${reward?.heirloomItem || "기본 유산"}</span></div>`,
    `<div class="setting-row"><strong>다음 시작 효과</strong><span>명성 +${entry.boonRenown}, 금화 +${entry.boonGold}, 오염 +${entry.boonTaint}</span></div>`
  ].join("");

  ui.runEndModal.classList.remove("hidden");
  store.dispatch({ type: "LOG", payload: { log: `[연대기] ${endMeta?.displayName || endType}로 한 삶이 끝났다.` } });
}

function renderState(state) {
  currentSpeed = state?.time?.speed || 1;
  const c = state.character;
  if (!c) {
    ui.charName.textContent = "아직 이름 없는 자";
    ui.charTag.textContent = "무명의 생존자";
    if (ui.sexualStats) ui.sexualStats.innerHTML = "";
    return;
  }

  ui.charName.textContent = c.name;
  ui.charTag.textContent = describeCharacter(c);

  ui.charTags.innerHTML = "";
  [
    `Lv.${c.level}`,
    c.gender === "female" ? "여성" : "남성",
    c.age ? `${c.age}세` : "나이 미상",
    c.difficultyId === "high" ? "난이도 높음" : "난이도 보통",
    `명성 ${state.resources.renown}`,
    state.resources.taint >= 40 ? "오염 징후" : "정신 안정",
    state.resources.fatigue >= 60 ? "피로 누적" : "호흡 유지"
  ].forEach((t) => {
    const tag = document.createElement("span");
    tag.textContent = t;
    ui.charTags.appendChild(tag);
  });

  const tags = derivePortraitTags(state);
  lastVisualTags = tags;
  const visual = mapPortraitVisual(tags, presentationPack.portraitStateMap);
  applyPortraitRender(ui.portrait, ui.face, ui.portraitStates, visual);
  const portraitAsset = resolveAssetPortrait(state, visual, presentationPack);
  const portraitSig = [
    portraitAsset?.faceImage || "",
    portraitAsset?.sceneImage || "",
    portraitAsset?.themeClass || "",
    portraitAsset?.layers?.baseLayer || "",
    portraitAsset?.layers?.faceLayer || "",
    portraitAsset?.layers?.outfitLayer || "",
    (portraitAsset?.layers?.effectLayers || []).join(",")
  ].join("|");
  if (portraitSig !== lastPortraitAssetSig) {
    applyAssetPortrait(ui.portrait, ui.portraitArt, portraitAsset);
    lastPortraitAssetSig = portraitSig;
  }

  const scene = resolveSceneBackground(state, visual, presentationPack);
  const sceneSig = `${scene?.image || ""}|${scene?.toneClass || ""}|${scene?.overlayClass || ""}`;
  if (sceneSig !== lastSceneSig) {
    applySceneBackground(ui.mainPanel, scene);
    lastSceneSig = sceneSig;
  }

  if ((state.history.events[0]?.tier || "") === "T3") emphasis.apply(ui.portrait, "T3");
  else if ((state.history.events[0]?.tier || "") === "T2") emphasis.apply(ui.portrait, "T2");

  ui.act.textContent = `막 ${state.world.act}`;
  ui.loc.textContent = state.world.locationId || "검은비 변경";
  ui.day.textContent = `${state.world.day}일`;
  ui.bar.style.width = `${Math.min(100, state.world.actProgress)}%`;

  ui.hp.textContent = `${c.hp} / ${c.maxHp}`;
  ui.gold.textContent = state.resources.gold;
  ui.fame.textContent = state.resources.renown;
  ui.taint.textContent = state.resources.taint;
  ui.fatigue.textContent = state.resources.fatigue;

  ui.stats.innerHTML = "";
  ABILITIES.forEach((ab) => {
    const div = document.createElement("div");
    div.textContent = `${ab} ${c.abilities[ab]} (${sign(mod(c.abilities[ab]))})`;
    ui.stats.appendChild(div);
  });

  const sexual = normalizeSexualStats(c.sexualStats);
  ui.sexualStats.innerHTML = "";
  Object.entries(SEXUAL_STAT_LABELS).forEach(([key, label]) => {
    const div = document.createElement("div");
    div.textContent = `${label} ${Math.round(Number(sexual[key] || 0))}`;
    ui.sexualStats.appendChild(div);
  });

  ui.quests.innerHTML = "";
  (state.world.quests || []).slice(0, 3).forEach((q) => {
    const li = document.createElement("li");
    li.textContent = `${q.name} (${q.progress}%) - ${q.mood}`;
    ui.quests.appendChild(li);
  });

  ui.gear.innerHTML = "";
  (c.gear || []).forEach((g) => {
    const li = document.createElement("li");
    li.textContent = g;
    ui.gear.appendChild(li);
  });

  ui.legacy.innerHTML = "";
  saveManager.getArchive().slice(0, 5).forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = `${entry.title} (${entry.outcome})`;
    ui.legacy.appendChild(li);
  });
  if (!ui.legacy.children.length) {
    const li = document.createElement("li");
    li.textContent = "기록 없음";
    ui.legacy.appendChild(li);
  }

  renderMeter(ui.relBars, [
    ["신뢰", state.relationships.npcRelations.core.trust || 0],
    ["친밀", state.relationships.npcRelations.core.intimacy || 0],
    ["긴장", state.relationships.npcRelations.core.tension || 0],
    ["욕망", state.relationships.npcRelations.core.desire || 0],
    ["존경", state.relationships.npcRelations.core.respect || 0],
    ["두려움", state.relationships.npcRelations.core.fear || 0]
  ]);

  renderMeter(ui.axisBars, [
    ["질서", axis(50 + (state.factions.reputation.temple || 0) - (state.factions.reputation.underbelly || 0))],
    ["자비", axis(50 + (state.relationships.npcRelations.core.trust || 0) - (state.relationships.npcRelations.core.fear || 0))],
    ["신앙", axis(50 + (state.factions.reputation.temple || 0))],
    ["절제", axis(50 + state.resources.renown - state.resources.infamy)]
  ]);

  ui.comp.textContent = c.activeCompanion || "동료 없음";
}

function renderEvent(event, state) {
  if (postChoiceInterlude) {
    if (event) queuedEventAfterInterlude = event;
    renderPostChoiceInterlude();
    return;
  }

  if (!event) {
    clearEventRenderState();
    ui.eventCard.classList.add("hidden");
    ui.eventCard.classList.remove("tier-t2", "tier-t3");
    ui.eventText.classList.remove("typing");
    ui.eventChoices.classList.remove("hidden");
    if (ui.eventChoiceHints) {
      ui.eventChoiceHints.innerHTML = "";
      ui.eventChoiceHints.classList.add("hidden");
    }
    renderReportButtonState(null, false);
    return;
  }

  ui.eventCard.classList.remove("hidden");
  ui.eventCard.classList.remove("tier-t2", "tier-t3");
  if (event.tier === "T2") ui.eventCard.classList.add("tier-t2");
  if (event.tier === "T3") ui.eventCard.classList.add("tier-t3");
  ui.eventTitle.textContent = `[${event.tier}] ${event.title}`;
  ui.eventText.textContent = event.text;
  const toneMeta = event?.identitySignal === "adult"
    ? `성인 톤 · ${event?.toneHint || "관계/욕망 분기"}`
    : `중립 톤 · ${event?.toneHint || "일반 분기"}`;
  const controlMeta = event.tier === "T3"
    ? "필수 선택"
    : (state.automation.t2Policy === "ask" ? "수동 선택" : "자동 처리 대기");
  const metaToneClass = event?.identitySignal === "adult" ? "adult" : "neutral";
  const metaControlClass = state.automation.t2Policy === "ask" || event.tier === "T3" ? "manual" : "auto";
  ui.eventMeta.innerHTML = `<span class="meta-pill ${metaToneClass}">${escapeHtml(toneMeta)}</span><span class="meta-pill ${metaControlClass}">${escapeHtml(controlMeta)}</span>`;

  const eventKey = [
    event.eventId || event.title,
    event.tier || "T2",
    event.text || ""
  ].join("|");

  if (eventKey !== eventTypingKey) {
    clearEventRenderState();
    eventTypingKey = eventKey;
    eventTypingDone = false;
    ui.eventText.textContent = "";
    ui.eventText.classList.add("typing");
    ui.eventChoices.innerHTML = "";
    ui.eventChoices.classList.add("hidden");
    if (ui.eventChoiceHints) {
      ui.eventChoiceHints.innerHTML = "";
      ui.eventChoiceHints.classList.add("hidden");
    }
    renderReportButtonState(event, false);
    ui.eventTimer.textContent = "이야기가 전개되는 중...";

    startEventTyping(eventKey, event.text || "", () => {
      if (eventTypingKey !== eventKey) return;
      eventTypingDone = true;
      ui.eventText.classList.remove("typing");
      renderEventChoices(event, state);
      renderChoiceHints(event, state);
      renderReportButtonState(event, true);
      ui.eventChoices.classList.remove("hidden");
      startEventCountdownIfNeeded(event, state, eventKey);
    });
    return;
  }

  if (!eventTypingDone) {
    renderReportButtonState(event, false);
    return;
  }

  if (!ui.eventChoices.childElementCount) {
    renderEventChoices(event, state);
  }
  renderChoiceHints(event, state);
  renderReportButtonState(event, true);
  ui.eventChoices.classList.remove("hidden");
  startEventCountdownIfNeeded(event, state, eventKey);
}

function renderPostChoiceInterlude() {
  const interlude = postChoiceInterlude;
  if (!interlude || !Array.isArray(interlude.pages) || !interlude.pages.length) {
    postChoiceInterlude = null;
    return;
  }

  const page = interlude.pages[interlude.index] || interlude.pages[0];
  const pageKey = `${interlude.key}|${interlude.index}`;
  if (ui.eventChoiceHints) {
    ui.eventChoiceHints.innerHTML = "";
    ui.eventChoiceHints.classList.add("hidden");
  }
  renderReportButtonState(null, false);

  ui.eventCard.classList.remove("hidden");
  ui.eventCard.classList.remove("tier-t2", "tier-t3");
  ui.eventCard.classList.add("tier-t2");
  ui.eventTitle.textContent = `[후속 스토리] ${interlude.index + 1} / ${interlude.pages.length}`;
  ui.eventMeta.innerHTML = `<span class="meta-pill neutral">선택의 여파</span><span class="meta-pill manual">텍스트 진행</span>`;

  if (pageKey !== eventTypingKey) {
    clearEventRenderState();
    eventTypingKey = pageKey;
    eventTypingDone = false;
    ui.eventText.textContent = "";
    ui.eventText.classList.add("typing");
    ui.eventChoices.innerHTML = "";
    ui.eventChoices.classList.add("hidden");
    ui.eventTimer.textContent = "장면을 서술하는 중...";

    startEventTyping(pageKey, page.text || "", () => {
      if (eventTypingKey !== pageKey) return;
      eventTypingDone = true;
      ui.eventText.classList.remove("typing");
      renderInterludeChoices();
      ui.eventChoices.classList.remove("hidden");
      ui.eventTimer.textContent = "이전/다음 장면으로 흐름을 확인할 수 있다.";
    });
    return;
  }

  if (!eventTypingDone) return;
  renderInterludeChoices();
  ui.eventChoices.classList.remove("hidden");
  ui.eventTimer.textContent = "이전/다음 장면으로 흐름을 확인할 수 있다.";
}

function renderInterludeChoices() {
  const interlude = postChoiceInterlude;
  if (!interlude) return;
  ui.eventChoices.innerHTML = "";

  const prev = document.createElement("button");
  prev.className = "choice-btn choice-info";
  prev.textContent = "이전 장면";
  prev.disabled = interlude.index <= 0;
  prev.onclick = () => moveInterlude(-1);
  ui.eventChoices.appendChild(prev);

  const next = document.createElement("button");
  const isLast = interlude.index >= interlude.pages.length - 1;
  next.className = "choice-btn choice-primary";
  next.textContent = isLast
    ? (queuedEventAfterInterlude ? "다음 선택으로" : "계속 진행")
    : "다음 장면";
  next.onclick = () => {
    if (isLast) {
      finishInterlude();
      return;
    }
    moveInterlude(1);
  };
  ui.eventChoices.appendChild(next);
}

function moveInterlude(delta) {
  if (!postChoiceInterlude) return;
  const nextIdx = postChoiceInterlude.index + delta;
  if (nextIdx < 0 || nextIdx >= postChoiceInterlude.pages.length) return;
  postChoiceInterlude.index = nextIdx;
  renderEvent(store.getState().activeDecisionEvent, store.getState());
}

function finishInterlude() {
  postChoiceInterlude = null;
  clearEventRenderState();
  const queued = queuedEventAfterInterlude;
  queuedEventAfterInterlude = null;
  renderEvent(queued || store.getState().activeDecisionEvent, store.getState());
}

function renderEventChoices(event, state) {
  ui.eventChoices.innerHTML = "";
  (event.choices || []).forEach((choice, idx) => {
    const btn = document.createElement("button");
    btn.className = classifyChoiceStyle(choice.label, idx);
    btn.textContent = choice.label;
    btn.onclick = () => applyDecisionChoice(store, choice, false, contentPack);
    ui.eventChoices.appendChild(btn);
  });
}

function renderChoiceHints(event, state) {
  if (!ui.eventChoiceHints) return;
  const rows = buildChoiceHintRows(event, state);
  const selectionLine = describeSelectionDebug(event?.selectionDebug);
  if (!rows.length) {
    ui.eventChoiceHints.innerHTML = "";
    ui.eventChoiceHints.classList.add("hidden");
    return;
  }
  const lines = rows.map((row) => (
    `<p class="choice-hint-row"><strong>${escapeHtml(row.title)}</strong><span>${escapeHtml(row.hint)}</span></p>`
  ));
  const debugLineHtml = selectionLine
    ? `<p class="choice-hint-row"><strong>노출 이유</strong><span>${escapeHtml(selectionLine)}</span></p>`
    : "";
  ui.eventChoiceHints.innerHTML = `<h4>선택 조건 힌트</h4>${debugLineHtml}${lines.join("")}`;
  ui.eventChoiceHints.classList.remove("hidden");
}

function buildChoiceHintRows(event, state) {
  if (!event || !Array.isArray(event.choices) || !event.choices.length) return [];
  const c = state?.character || {};
  const core = state?.relationships?.npcRelations?.core || {};
  const classLabel = optionLabel(CREATOR_CLASS_OPTIONS, c.classId);
  const lineageLabel = optionLabel(CREATOR_LINEAGE_OPTIONS, c.lineageId);
  const backgroundLabel = optionLabel(CREATOR_BACKGROUND_OPTIONS, c.backgroundId);
  const classAffinity = Array.isArray(event.classAffinity) ? event.classAffinity : [];
  const backgroundAffinity = Array.isArray(event.backgroundAffinity) ? event.backgroundAffinity : [];
  const statAffinity = Array.isArray(event.statAffinity) ? event.statAffinity : [];
  const trig = event.triggerConditions || {};
  const requires = Array.isArray(trig.requires) ? trig.requires : [];
  const excludes = Array.isArray(trig.excludes) ? trig.excludes : [];

  return event.choices.map((choice, idx) => {
    const bits = [];
    bits.push(`분기 ${event.tier || "T2"} · 범주 ${event.category || "social"}`);
    if (idx === 0) bits.push("현재 우선 노출 선택");
    if (String(choice?.id || "").startsWith("trait-cha-")) bits.push(`카리스마 조건 반영 (CHA ${Number(c?.abilities?.CHA || 0)})`);
    if (String(choice?.id || "").startsWith("trait-lineage-")) bits.push(`혈통 조건 반영 (${lineageLabel})`);
    if (String(choice?.id || "").startsWith("trait-bg-")) bits.push(`배경 조건 반영 (${backgroundLabel})`);
    if (String(choice?.id || "").startsWith("trait-wis-")) bits.push(`지혜 조건 반영 (WIS ${Number(c?.abilities?.WIS || 0)})`);
    if (String(choice?.id || "").startsWith("bonus-")) bits.push("상황 보너스 선택");

    if (classAffinity.length) {
      if (classAffinity.includes(c.classId)) bits.push(`클래스 친화 일치 (${classLabel})`);
      else bits.push(`권장 클래스 ${classAffinity.map((id) => optionLabel(CREATOR_CLASS_OPTIONS, id)).join("/")}`);
    }
    if (backgroundAffinity.length) {
      if (backgroundAffinity.includes(c.backgroundId)) bits.push(`배경 친화 일치 (${backgroundLabel})`);
      else bits.push(`권장 배경 ${backgroundAffinity.map((id) => optionLabel(CREATOR_BACKGROUND_OPTIONS, id)).join("/")}`);
    }
    if (statAffinity.length) bits.push(`핵심 능력 ${statAffinity.join("/")}`);
    if (requires.length) bits.push(`필요 태그 ${requires.join(", ")}`);
    if (excludes.length) bits.push(`제외 태그 ${excludes.join(", ")}`);

    const relationMood = relationPressureHint(core);
    if (relationMood) bits.push(relationMood);
    const effectSummary = summarizeChoiceEffects(choice?.effects || []);
    if (effectSummary) bits.push(effectSummary);

    return {
      title: `${idx + 1}. ${String(choice?.label || "선택")}`,
      hint: bits.join(" · ")
    };
  });
}

function summarizeChoiceEffects(effects) {
  if (!Array.isArray(effects) || !effects.length) return "";
  let taint = 0;
  let gold = 0;
  let renown = 0;
  const relationDelta = { trust: 0, intimacy: 0, tension: 0, desire: 0, respect: 0, fear: 0 };

  effects.forEach((fx) => {
    if (!fx || typeof fx !== "object") return;
    if (fx.kind === "taint") taint += Number(fx.value || 0);
    if (fx.kind === "gain_gold") gold += Number(fx.value || 0);
    if (fx.kind === "renown") renown += Number(fx.value || 0);
    if (fx.kind === "relation" && fx.value && typeof fx.value === "object") {
      Object.keys(relationDelta).forEach((k) => {
        relationDelta[k] += Number(fx.value[k] || 0);
      });
    }
  });

  const parts = [];
  const relationText = summarizeRelationDelta(relationDelta);
  if (relationText) parts.push(relationText);
  if (gold) parts.push(`금화 ${signed(gold)}`);
  if (renown) parts.push(`명성 ${signed(renown)}`);
  if (taint) parts.push(`오염 ${signed(taint)}`);
  return parts.join(", ");
}

function summarizeRelationDelta(delta) {
  const labels = {
    trust: "신뢰",
    intimacy: "친밀",
    tension: "긴장",
    desire: "욕망",
    respect: "존경",
    fear: "두려움"
  };
  const parts = [];
  Object.entries(delta || {}).forEach(([k, v]) => {
    const n = Number(v || 0);
    if (!n) return;
    parts.push(`${labels[k] || k} ${signed(n)}`);
  });
  if (!parts.length) return "";
  return `관계 ${parts.join(" / ")}`;
}

function relationPressureHint(core) {
  const desire = Number(core?.desire || 0);
  const tension = Number(core?.tension || 0);
  const fear = Number(core?.fear || 0);
  if (desire >= 28 && tension >= 28) return "현재 욕망과 긴장이 동시에 높아 강한 선택에 반응이 크게 튄다";
  if (fear >= 30) return "현재 두려움이 높은 구간이라 강압 선택의 역반동이 커질 수 있다";
  if (desire >= 24) return "현재 욕망 수치가 높아 유혹/거래 계열 선택 효율이 올라간다";
  return "관계 수치가 균형 구간이라 선택 여파가 완만하게 누적된다";
}

function describeSelectionDebug(debug) {
  if (!debug || typeof debug !== "object") return "";
  const sourceMap = {
    weighted: "가중치 기반 후보 선정",
    "least-recent": "최근 반복 최소 후보 선정",
    "fallback-random": "조건 미충족으로 임의 후보 선정",
    "forced-identity": "초반 성인 톤 고정 후보 선정"
  };
  const source = sourceMap[String(debug.source || "")] || `선정 방식: ${String(debug.source || "unknown")}`;
  const parts = [source];
  if (Number.isFinite(Number(debug.weight)) && Number(debug.weight) > 0) parts.push(`가중치 ${Number(debug.weight).toFixed(2)}`);
  if (Number.isFinite(Number(debug.baseScore)) && Number(debug.baseScore) > 0) parts.push(`기본 점수 ${Number(debug.baseScore).toFixed(2)}`);
  if (Number.isFinite(Number(debug.candidateCount)) && Number(debug.candidateCount) > 0) parts.push(`후보 ${Number(debug.candidateCount)}개`);
  if (Number.isFinite(Number(debug.recencyPenalty)) && Number(debug.recencyPenalty) > 0) parts.push(`반복 패널티 ${Number(debug.recencyPenalty).toFixed(2)}`);
  if (Number.isFinite(Number(debug.seenCount)) && Number(debug.seenCount) > 0) parts.push(`과거 등장 ${Number(debug.seenCount)}회`);

  const matches = [];
  if (debug.classMatch) matches.push("클래스");
  if (debug.backgroundMatch) matches.push("배경");
  if (debug.statMatch) matches.push("능력치");
  if (matches.length) parts.push(`일치: ${matches.join("/")}`);
  if (debug.preferMature) parts.push("성인 분기 우선");
  return parts.join(" · ");
}

function optionLabel(options, value) {
  const hit = (options || []).find((x) => x.value === value);
  return hit?.label || String(value || "-");
}

function startEventTyping(eventKey, text, onDone) {
  const fullText = String(text || "");
  let index = 0;
  const tick = () => {
    if (eventTypingKey !== eventKey) return;
    if (index >= fullText.length) {
      onDone?.();
      return;
    }
    const ch = fullText[index];
    index += 1;
    ui.eventText.textContent = fullText.slice(0, index);
    const delay = /[,.!?…]/.test(ch) ? 70 : (ch === "\n" ? 85 : EVENT_TYPING_BASE_MS);
    eventTypingTimer = setTimeout(tick, delay);
  };
  tick();
}

function startEventCountdownIfNeeded(event, state, eventKey) {
  if (!(event.tier === "T2" && event.timeoutSec && state.automation.t2Policy !== "ask")) {
    if (eventCountdown) clearEventCountdown();
    ui.eventTimer.textContent = "";
    return;
  }
  if (eventCountdown && eventCountdownKey === eventKey) {
    ui.eventTimer.textContent = `미응답 자동 처리까지 ${eventCountdownLeft}초`;
    return;
  }

  clearEventCountdown();
  eventCountdownKey = eventKey;
  eventCountdownLeft = event.timeoutSec;
  ui.eventTimer.textContent = `미응답 자동 처리까지 ${eventCountdownLeft}초`;
  eventCountdown = setInterval(() => {
    eventCountdownLeft -= 1;
    ui.eventTimer.textContent = `미응답 자동 처리까지 ${Math.max(0, eventCountdownLeft)}초`;
    if (eventCountdownLeft <= 0) clearEventCountdown();
  }, 1000);
}

function clearEventCountdown() {
  clearInterval(eventCountdown);
  eventCountdown = null;
  eventCountdownKey = "";
  eventCountdownLeft = 0;
}

function clearEventTyping() {
  clearTimeout(eventTypingTimer);
  eventTypingTimer = null;
}

function clearEventRenderState() {
  clearEventCountdown();
  clearEventTyping();
  eventTypingKey = "";
  eventTypingDone = true;
}

function renderReportButtonState(event, enabled = true) {
  if (!ui.reportIssueBtn) return;
  const hasEvent = Boolean(event);
  ui.reportIssueBtn.disabled = !hasEvent || !enabled;
  ui.reportIssueBtn.textContent = hasEvent ? "버그 리포트 복사" : "버그 리포트";
  if (!hasEvent) setReportStatus("", false);
}

async function copyActiveIssueReport() {
  const state = store.getState();
  const event = state?.activeDecisionEvent || null;
  if (!event) {
    setReportStatus("현재 활성 이벤트가 없어 리포트를 만들 수 없다.", true);
    return;
  }
  const payload = buildIssueReportPayload(state, event);
  const text = JSON.stringify(payload, null, 2);
  const copied = await copyTextToClipboard(text);
  if (!copied) {
    setReportStatus("클립보드 복사에 실패했다. 브라우저 권한을 확인해 달라.", true);
    return;
  }
  setReportStatus("리포트 JSON 복사 완료. 이슈에 바로 붙여 넣으면 된다.", false);
  store.dispatch({
    type: "LOG",
    payload: { log: `[진단] 버그 리포트 복사 (${event.eventId || event.id || "unknown"})` }
  });
}

function buildIssueReportPayload(state, event) {
  const logs = (state?.history?.logs || [])
    .slice(0, 8)
    .map((entry) => {
      const normalized = normalizeLogEntry(entry, { source: "bug-report" });
      return {
        at: normalized.at || null,
        tier: normalized.tier || null,
        text: compactText(normalized.feedLine || normalized.text || "")
      };
    });
  const recentResolved = (state?.history?.events || [])
    .filter((x) => x?.stage === "resolved")
    .slice(0, 8)
    .map((x) => ({
      eventId: x.eventId || null,
      choiceId: x.choiceId || null,
      tier: x.tier || null,
      auto: Boolean(x.auto),
      tick: Number(x.tick || 0)
    }));
  const recentOpened = (state?.history?.events || [])
    .filter((x) => x?.stage === "opened")
    .slice(0, 8)
    .map((x) => ({
      eventId: x.eventId || null,
      category: x.category || null,
      tier: x.tier || null,
      tick: Number(x.tick || 0)
    }));

  return {
    reportVersion: 1,
    createdAt: new Date().toISOString(),
    run: {
      id: state?.run?.id || null,
      status: state?.run?.status || null,
      seed: state?.run?.seed ?? null
    },
    clock: {
      tick: Number(state?.time?.tick || 0),
      day: Number(state?.world?.day || 0),
      act: Number(state?.world?.act || 0),
      location: state?.world?.locationId || null
    },
    character: {
      name: state?.character?.name || null,
      classId: state?.character?.classId || null,
      lineageId: state?.character?.lineageId || null,
      backgroundId: state?.character?.backgroundId || null,
      level: Number(state?.character?.level || 0),
      hp: Number(state?.character?.hp || 0),
      maxHp: Number(state?.character?.maxHp || 0)
    },
    resources: {
      gold: Number(state?.resources?.gold || 0),
      renown: Number(state?.resources?.renown || 0),
      taint: Number(state?.resources?.taint || 0),
      fatigue: Number(state?.resources?.fatigue || 0)
    },
    activeEvent: {
      eventId: event?.eventId || event?.id || null,
      title: event?.title || null,
      tier: event?.tier || null,
      category: event?.category || null,
      timeoutSec: Number(event?.timeoutSec || 0),
      choiceIds: (event?.choices || []).map((c) => c?.id || null),
      choiceLabels: (event?.choices || []).map((c) => compactText(c?.label || "")),
      selectionDebug: event?.selectionDebug || null
    },
    relationCore: {
      trust: Number(state?.relationships?.npcRelations?.core?.trust || 0),
      intimacy: Number(state?.relationships?.npcRelations?.core?.intimacy || 0),
      tension: Number(state?.relationships?.npcRelations?.core?.tension || 0),
      desire: Number(state?.relationships?.npcRelations?.core?.desire || 0),
      respect: Number(state?.relationships?.npcRelations?.core?.respect || 0),
      fear: Number(state?.relationships?.npcRelations?.core?.fear || 0)
    },
    recentOpened,
    recentResolved,
    recentLogs: logs
  };
}

function compactText(value, max = 240) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

async function copyTextToClipboard(text) {
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {}
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "true");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.focus();
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return Boolean(ok);
  } catch {
    return false;
  }
}

function setReportStatus(message, isError = false) {
  if (!ui.reportIssueStatus) return;
  ui.reportIssueStatus.textContent = String(message || "");
  ui.reportIssueStatus.classList.toggle("error", Boolean(isError));
  clearTimeout(reportStatusTimer);
  if (!message) return;
  reportStatusTimer = setTimeout(() => {
    if (ui.reportIssueStatus.textContent === message) {
      ui.reportIssueStatus.textContent = "";
      ui.reportIssueStatus.classList.remove("error");
    }
  }, 5000);
}

function renderHistoryTabs() {
  const tabs = ["현재 런 로그", "주요 선택", "완료 퀘스트", "관계 변천", "연대기"];
  ui.historyTabs.innerHTML = "";
  tabs.forEach((t) => {
    const b = document.createElement("button");
    b.textContent = t;
    b.classList.toggle("active", t === currentHistoryTab);
    b.onclick = () => {
      currentHistoryTab = t;
      qsa("button", ui.historyTabs).forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      renderHistory(store.getState());
    };
    ui.historyTabs.appendChild(b);
  });
}

function renderHistory(state) {
  const rows = [];
  if (currentHistoryTab === "현재 런 로그") {
    (state.history.logs || []).slice(0, 40).forEach((x) => rows.push(historyLogLine(x)));
  } else if (currentHistoryTab === "주요 선택") {
    (state.history.majorChoices || []).slice(0, 30).forEach((x) => rows.push(`${x.tier || "선택"} ${x.eventId || "-"} ${x.choiceId || ""}`));
  } else if (currentHistoryTab === "완료 퀘스트") {
    (state.history.completedQuests || []).slice(0, 30).forEach((x) => rows.push(`${x.title} 완료`));
  } else if (currentHistoryTab === "관계 변천") {
    (state.history.relationChanges || []).slice(0, 30).forEach((x) => rows.push(`${x.source}: 신뢰 ${x.after?.trust ?? "-"}, 긴장 ${x.after?.tension ?? "-"}`));
  } else {
    saveManager.getArchive().slice(0, 30).forEach((x) => rows.push(`${x.title} | ${x.summary} | ${x.outcome}`));
  }

  ui.historyBody.innerHTML = rows.length
    ? rows.map((r) => `<p class="history-row">${escapeHtml(String(r))}</p>`).join("")
    : `<p class="history-row">기록 없음</p>`;
}

function openCreator(random = false) {
  ui.creator.classList.remove("hidden");
  if (random) randomizeCreator();
  toggleBeastkindVisibility();
  if (ui.genderNote) ui.genderNote.textContent = GENDER_STORY_NOTES[selectedGender];
  const archive = saveManager.getArchive()[0];
  ui.inherit.textContent = archive
    ? `이전 삶의 유산: ${archive.title} (금화 +${archive.boonGold}, 명성 +${archive.boonRenown})`
    : "아직 계승된 기록이 없다. 첫 연대기를 시작하세요.";
}

function randomizeCreator() {
  ui.name.value = `${pick(["엘린", "케른", "마리브", "타스", "레이나", "브란", "실바", "오르덴"])}${rand(11, 99)}`;
  setDifficultySelection(pick(["normal", "high"]));
  setGenderSelection(pick(["male", "female"]));
  ui.race.value = pick(CREATOR_LINEAGE_OPTIONS).value;
  toggleBeastkindVisibility();
  if (ui.race.value === "mixed-grace") {
    ui.beastkind.value = pick(BEAST_KIND_OPTIONS).value;
  }
  ui.cls.value = pick(CREATOR_CLASS_OPTIONS).value;
  ui.bg.value = pick(CREATOR_BACKGROUND_OPTIONS).value;
  ui.storyline.value = pick(INITIAL_STORYLINE_OPTIONS).value;
  ui.t2Style.value = pick(Object.keys(DECISION_PRESETS));
  const cap = DIFFICULTY_LIMITS[selectedDifficulty]?.max || 20;
  const floor = DIFFICULTY_LIMITS[selectedDifficulty]?.min || 8;
  ABILITIES.forEach((ab, i) => {
    const baseline = [15, 14, 13, 12, 10, 8][i];
    abilityAlloc[ab] = clamp(Math.min(cap, baseline + rand(-1, 1)), floor, cap);
  });
  renderAbilityAllocator();
}

function renderSettingsSummary() {
  const tabs = ["일반", "속도와 자동화", "선택지 처리", "서사와 로그", "초상화/연출", "성인/민감도 필터", "접근성"];
  ui.setTabs.innerHTML = "";
  tabs.forEach((t, i) => {
    const b = document.createElement("button");
    b.textContent = t;
    b.classList.toggle("active", i === 0);
    b.onclick = () => {
      qsa("button", ui.setTabs).forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      ui.setBody.innerHTML = `<div class="setting-row"><strong>${t}</strong><span>구조 연결됨 (콘텐츠/아트 단계에서 확장)</span></div>`;
    };
    ui.setTabs.appendChild(b);
  });
  ui.setBody.innerHTML = `<div class="setting-row"><strong>자동 처리 성향</strong><span>${Object.keys(DECISION_PRESETS).join(", ")}</span></div>`;
}

function renderAbilityAllocator() {
  const limits = DIFFICULTY_LIMITS[selectedDifficulty] || DIFFICULTY_LIMITS.normal;
  const min = Number(limits.min || 8);
  const max = Number(limits.max || 20);

  if (ui.difficultyNote) {
    ui.difficultyNote.textContent = limits.note;
  }
  ui.alloc.innerHTML = "";
  ABILITIES.forEach((ab) => {
    const row = document.createElement("div");
    row.className = "row";
    const name = document.createElement("strong");
    name.textContent = ab;
    const input = document.createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    abilityAlloc[ab] = clamp(Number(abilityAlloc[ab]), min, max);
    input.value = String(abilityAlloc[ab]);
    const value = document.createElement("span");
    value.textContent = String(abilityAlloc[ab]);
    input.oninput = () => {
      abilityAlloc[ab] = Number(input.value);
      value.textContent = input.value;
    };
    row.append(name, input, value);
    ui.alloc.appendChild(row);
  });
}

function setDifficultySelection(nextDifficulty) {
  selectedDifficulty = nextDifficulty === "high" ? "high" : "normal";
  qsa("[data-difficulty]", ui.difficultyGroup).forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.difficulty === selectedDifficulty);
  });
  renderAbilityAllocator();
}

function setGenderSelection(nextGender) {
  selectedGender = nextGender === "female" ? "female" : "male";
  qsa("[data-gender]", ui.genderGroup).forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.gender === selectedGender);
  });
  const succubusOpt = qsa("option", ui.race).find((opt) => opt.value === "succubus");
  if (succubusOpt) {
    succubusOpt.textContent = selectedGender === "male" ? "인큐버스" : "서큐버스";
  }
  if (ui.genderNote) ui.genderNote.textContent = GENDER_STORY_NOTES[selectedGender];
}

function toggleBeastkindVisibility() {
  const show = ui.race.value === "mixed-grace";
  ui.beastkindWrap.classList.toggle("hidden", !show);
}

function defaultSexualStats() {
  return {
    experienceFactor: 0,
    lustfulness: 0,
    arousal: 0,
    auraOfLust: 0
  };
}

function normalizeSexualStats(input = {}) {
  return {
    experienceFactor: Math.max(0, Number(input.experienceFactor || 0)),
    lustfulness: Math.max(0, Number(input.lustfulness || 0)),
    arousal: Math.max(0, Number(input.arousal || 0)),
    auraOfLust: Math.max(0, Number(input.auraOfLust || 0))
  };
}

function fillSelect(select, values, labels = {}) {
  select.innerHTML = "";
  values.forEach((v) => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = labels[v] || v;
    select.appendChild(opt);
  });
}

function fillSelectFromOptions(select, options) {
  select.innerHTML = "";
  options.forEach((entry) => {
    const opt = document.createElement("option");
    opt.value = entry.value;
    opt.textContent = entry.label;
    select.appendChild(opt);
  });
}

function buildInitialStorylineSetup(state, storylineId, fallbackLocation = "검은비 변경") {
  const c = state.character;
  if (!c) return { patch: null, logs: [] };

  const core = state.relationships?.npcRelations?.core || {};
  const baseAbilities = c.abilities || {};
  const baseResources = state.resources || {};
  const baseSexual = normalizeSexualStats(c.sexualStats);
  const abilityDelta = {};
  const relationDelta = {};
  const resourceDelta = {};
  let sexualSet = defaultSexualStats();
  let locationId = fallbackLocation;
  let gearAdd = [];
  let charTags = [];
  let introLogs = [];
  let startAge = 20;

  switch (storylineId) {
    case "battleworn-veteran":
      Object.assign(abilityDelta, { STR: 2, CON: 2, CHA: 1, WIS: 1 });
      Object.assign(resourceDelta, { gold: 24, fatigue: 10, taint: 8, renown: 2 });
      Object.assign(relationDelta, { trust: -2, tension: 3, desire: 2, respect: 2, fear: 1 });
      sexualSet = { experienceFactor: 80, lustfulness: 60, arousal: 20, auraOfLust: 10 };
      startAge = 30;
      locationId = "도심 외곽 여관";
      gearAdd = ["낡은 가죽 갑옷", "녹슨 단검", "비단 스카프"];
      charTags = ["무감각한 베테랑"];
      introLogs = [
        "[스토리 시작 라인 1] 많은 전투와 성행위를 거치며 감정이 무뎌졌다. 도심 외곽의 허름한 여관에서 새벽을 맞는다.",
        "[초기 상태] 잃어버린 감각을 되찾을지, 더 깊은 욕망으로 가라앉을지 지금부터 선택한다."
      ];
      break;
    case "academy-prodigy":
      Object.assign(abilityDelta, { STR: 1, DEX: 2, INT: 1, CHA: 1 });
      Object.assign(resourceDelta, { gold: 14, fatigue: 3, taint: 2, renown: 3 });
      Object.assign(relationDelta, { trust: 2, tension: 1, desire: 1, respect: 1 });
      sexualSet = { experienceFactor: 10, lustfulness: 30, arousal: 70, auraOfLust: 5 };
      startAge = 20;
      locationId = "전투 아카데미 기숙동";
      gearAdd = ["아카데미 교복", "훈련용 목검", "초급 마법서"];
      charTags = ["아카데미 유망주"];
      introLogs = [
        "[스토리 시작 라인 2] 추천으로 들어간 전투 아카데미 1학년. 기술을 배우는 만큼 금지된 만남도 빠르게 다가온다.",
        "[초기 상태] 실력, 평판, 관계를 동시에 관리해야 한다."
      ];
      break;
    case "mountain-adept":
      Object.assign(abilityDelta, { STR: 1, DEX: 2, WIS: 2 });
      Object.assign(resourceDelta, { gold: 8, fatigue: 2, taint: 1, renown: 1 });
      Object.assign(relationDelta, { trust: 1, tension: -1, desire: -1, respect: 2 });
      sexualSet = { experienceFactor: 5, lustfulness: 15, arousal: 30, auraOfLust: 50 };
      startAge = 23;
      locationId = "산문 앞 수행처";
      gearAdd = ["수련복", "나무 지팡이", "약초 꾸러미"];
      charTags = ["기운 감응자"];
      introLogs = [
        "[스토리 시작 라인 3] 산속 수련 끝에 세속으로 내려왔다. 남들은 보지 못하는 기운이 눈앞에서 요동친다.",
        "[초기 상태] 순수함을 지킬지, 금지된 쾌락과 힘을 받아들일지 갈림길에 섰다."
      ];
      break;
    case "brothel-fixer":
      Object.assign(abilityDelta, { DEX: 1, INT: 1, CHA: 2 });
      Object.assign(resourceDelta, { gold: 36, fatigue: 6, taint: 12, infamy: 2 });
      Object.assign(relationDelta, { trust: -2, tension: 2, desire: 4, respect: 1, fear: 2 });
      sexualSet = { experienceFactor: 95, lustfulness: 90, arousal: 50, auraOfLust: 20 };
      startAge = 21;
      locationId = "창녀촌 중심가";
      gearAdd = ["화려한 비단 옷", "은밀한 독약", "금고 열쇠"];
      charTags = ["욕망의 협상가"];
      introLogs = [
        "[스토리 시작 라인 4] 창녀촌의 포주로 살아왔다. 성행위 경험과 언행 능력이 이미 바닥을 찍고 올라왔다.",
        "[초기 상태] 유혹과 협상으로 세력을 키울지, 더 거친 지배로 밀어붙일지 선택해야 한다."
      ];
      break;
    case "thief-crew":
    default:
      Object.assign(abilityDelta, { DEX: 2, INT: 1, CHA: 1 });
      Object.assign(resourceDelta, { gold: 22, fatigue: 5, taint: 6 });
      Object.assign(relationDelta, { trust: 1, tension: 2, desire: 2, fear: 1 });
      sexualSet = { experienceFactor: 85, lustfulness: 70, arousal: 60, auraOfLust: 15 };
      startAge = 25;
      locationId = "도적단 은신처";
      gearAdd = ["검은 가죽 옷", "자물쇠 따개 세트", "은밀한 보석"];
      charTags = ["도둑 크루 일원"];
      introLogs = [
        "[스토리 시작 라인 5] 도둑 크루와 함께 위험한 임무를 뛰었다. 이미 많은 경험이 쌓였고 손놀림은 가볍다.",
        "[초기 상태] 장난처럼 시작한 선택이 곧 생존과 쾌락의 경계를 가른다."
      ];
      break;
  }

  const abilityCap = c.difficultyId === "high" ? 18 : 20;
  const nextAbilities = ABILITIES.reduce((acc, ab) => {
    const base = Number(baseAbilities[ab] || 10);
    const delta = Number(abilityDelta[ab] || 0);
    acc[ab] = clamp(base + delta, 8, abilityCap);
    return acc;
  }, {});

  const nextSexualStats = {
    experienceFactor: Math.max(0, Number(sexualSet.experienceFactor ?? baseSexual.experienceFactor)),
    lustfulness: Math.max(0, Number(sexualSet.lustfulness ?? baseSexual.lustfulness)),
    arousal: Math.max(0, Number(sexualSet.arousal ?? baseSexual.arousal)),
    auraOfLust: Math.max(0, Number(sexualSet.auraOfLust ?? baseSexual.auraOfLust))
  };

  const nextCore = {
    trust: clamp(Number(core.trust || 0) + Number(relationDelta.trust || 0), 0, 100),
    intimacy: clamp(Number(core.intimacy || 0) + Number(relationDelta.intimacy || 0), 0, 100),
    tension: clamp(Number(core.tension || 0) + Number(relationDelta.tension || 0), 0, 100),
    desire: clamp(Number(core.desire || 0) + Number(relationDelta.desire || 0), 0, 100),
    respect: clamp(Number(core.respect || 0) + Number(relationDelta.respect || 0), 0, 100),
    fear: clamp(Number(core.fear || 0) + Number(relationDelta.fear || 0), 0, 100)
  };

  const nextGear = [...new Set([...(c.gear || []), ...gearAdd])];
  const nextTags = [...new Set([...(c.tags || []), ...charTags])];

  return {
    patch: {
      character: {
        abilities: nextAbilities,
        gear: nextGear,
        tags: nextTags,
        sexualStats: nextSexualStats,
        age: startAge,
        storyFocus: c.gender === "male" ? "external-relations" : "inner-focus"
      },
      resources: {
        gold: Math.max(0, Number(baseResources.gold || 0) + Number(resourceDelta.gold || 0)),
        fatigue: clamp(Number(baseResources.fatigue || 0) + Number(resourceDelta.fatigue || 0), 0, 100),
        taint: clamp(Number(baseResources.taint || 0) + Number(resourceDelta.taint || 0), 0, 100),
        renown: clamp(Number(baseResources.renown || 0) + Number(resourceDelta.renown || 0), -100, 100),
        infamy: clamp(Number(baseResources.infamy || 0) + Number(resourceDelta.infamy || 0), 0, 100)
      },
      world: { locationId },
      relationships: { npcRelations: { core: nextCore } }
    },
    logs: introLogs
  };
}

function toQuestFromContent(q) {
  return { id: q.id, name: q.title, mood: q.emotionalTheme || "의무", progress: 0, stage: "active", state: "ongoing" };
}

function findRunEndMeta(id) {
  return (presentationPack.runEndTypes || []).find((x) => x.id === id) || null;
}

function renderMeter(target, rows) {
  target.innerHTML = "";
  rows.forEach(([name, value]) => {
    const m = document.createElement("div");
    m.className = "meter";
    const val = clamp(value, 0, 100);
    m.innerHTML = `<span>${name}</span><div class="track"><span style="width:${val}%"></span></div><strong>${Math.round(val)}</strong>`;
    target.appendChild(m);
  });
}

function setActiveSpeed(speed) {
  qsa("[data-speed]").forEach((b) => b.classList.toggle("active", Number(b.dataset.speed) === speed));
}

function appendLog(text) {
  const entry = normalizeLogEntry(text, { source: "ui-log" });
  pushStoryEntry(entry);
}

function pushLog(text) {
  const entry = normalizeLogEntry(text, { source: "boot", kind: "system" });
  pushStoryEntry(entry);
}

function pushStoryEntry(entry) {
  if (storyCursor > 0) storyCursor += 1;
  storyFeed.unshift(entry);
  if (storyFeed.length > 260) {
    storyFeed = storyFeed.slice(0, 260);
  }
  storyCursor = clamp(storyCursor, 0, Math.max(0, storyFeed.length - 1));
  renderStoryReader();
}

function moveStoryCursor(offset) {
  if (!storyFeed.length) return;
  const next = clamp(storyCursor + offset, 0, storyFeed.length - 1);
  if (next === storyCursor) return;
  storyCursor = next;
  renderStoryReader();
}

function renderStoryReader() {
  if (!ui.storyStage || !ui.storyPage || !ui.storyPrev || !ui.storyNext) return;

  if (!storyFeed.length) {
    ui.storyPage.textContent = "장면 0 / 0";
    ui.storyPrev.disabled = true;
    ui.storyNext.disabled = true;
    ui.storyStage.innerHTML = `<article class="story-page"><h4>이야기 시작 전</h4><p>연대기를 시작하면 장면이 이곳에 쌓입니다.</p></article>`;
    return;
  }

  storyCursor = clamp(storyCursor, 0, storyFeed.length - 1);
  const entry = storyFeed[storyCursor];
  ui.storyPage.textContent = `장면 ${storyCursor + 1} / ${storyFeed.length}${storyCursor === 0 ? " · 최신" : ""}`;
  ui.storyPrev.disabled = storyCursor >= storyFeed.length - 1;
  ui.storyNext.disabled = storyCursor <= 0;

  ui.storyStage.innerHTML = "";
  ui.storyStage.appendChild(createStoryPage(entry));
}

function createStoryPage(entry) {
  const wrap = document.createElement("article");
  wrap.className = "story-page";

  const title = document.createElement("h4");
  title.className = "story-page-title";
  title.textContent = entry.feedLine || entry.text || "장면";
  wrap.appendChild(title);

  if (entry.tier) {
    const tier = document.createElement("p");
    tier.className = "story-page-tier";
    tier.textContent = `등급: ${entry.tier}`;
    wrap.appendChild(tier);
  }

  const body = document.createElement("p");
  body.className = "story-page-body";
  body.textContent = entry.bodyParagraph || entry.text || entry.feedLine || "기록 없음";
  wrap.appendChild(body);

  if (entry.followupHooks?.length) {
    const hook = document.createElement("p");
    hook.className = "story-page-hook";
    hook.textContent = `다음 기류: ${entry.followupHooks.slice(0, 2).join(" / ")}`;
    wrap.appendChild(hook);
  }

  return wrap;
}

function buildPostChoiceInterludePages(state, resolvedEntry) {
  const logs = (state.history.logs || []).slice(0, 4).map((x) => normalizeLogEntry(x, { source: "interlude" }));
  const pages = [];
  const seen = new Set();

  logs.forEach((entry) => {
    if (pages.length >= 3) return;
    const body = String(entry.bodyParagraph || entry.text || entry.feedLine || "").trim();
    if (!body) return;
    const key = body.slice(0, 120);
    if (seen.has(key)) return;
    seen.add(key);
    pages.push({ text: body });
  });

  if (pages.length < 2) {
    pages.push({
      text: `방금 선택(${resolvedEntry?.choiceId || "unknown"})의 여파가 퍼진다. 관계와 자원, 그리고 다음 분기의 공기가 천천히 바뀐다.`
    });
  }
  if (pages.length < 3 && logs[0]?.causalNotes?.length) {
    pages.push({
      text: `왜 이렇게 흘렀나: ${logs[0].causalNotes.slice(0, 2).join(" / ")}.`
    });
  }

  return pages.slice(0, 3);
}

function escapeHtml(v) {
  return v.replace(/[&<>\"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
}

function historyLogLine(logInput) {
  if (typeof logInput === "string") return logInput;
  const entry = normalizeLogEntry(logInput, { source: "history" });
  return entry.tier ? `[${entry.tier}] ${entry.feedLine}` : entry.feedLine;
}

function isImportantLog(entry) {
  return entry.tier === "T2" || entry.tier === "T3" || entry.causalNotes.length > 0 || entry.followupHooks.length > 0;
}

function createLogRow(entry) {
  const p = document.createElement("p");
  p.className = "log-entry";
  p.textContent = entry.feedLine || entry.text;
  return p;
}

function createLogCard(entry) {
  const card = document.createElement("article");
  card.className = `log-card ${entry.tier ? `tier-${entry.tier.toLowerCase()}` : ""}`.trim();

  const head = document.createElement("div");
  head.className = "log-card-head";
  const title = document.createElement("strong");
  title.textContent = entry.feedLine || entry.text;
  head.appendChild(title);
  if (entry.tier) {
    const tier = document.createElement("span");
    tier.className = "log-tier";
    tier.textContent = entry.tier;
    head.appendChild(tier);
  }
  card.appendChild(head);

  const badges = [...(entry.maturityTags || []).slice(0, 2), ...(entry.visualStateTags || []).slice(0, 2)];
  if (badges.length) {
    const wrap = document.createElement("div");
    wrap.className = "log-badges";
    badges.forEach((b) => {
      const s = document.createElement("span");
      s.className = "log-badge";
      s.textContent = b;
      wrap.appendChild(s);
    });
    card.appendChild(wrap);
  }

  if (entry.bodyParagraph) {
    const body = document.createElement("p");
    body.className = "log-card-body";
    body.textContent = entry.bodyParagraph;
    card.appendChild(body);
  }

  const detail = document.createElement("details");
  detail.className = "log-card-detail";
  detail.open = entry.tier === "T3" || currentSpeed <= 2;
  const summary = document.createElement("summary");
  summary.textContent = "왜 이런 일이?";
  detail.appendChild(summary);

  const ul = document.createElement("ul");
  ul.className = "log-reason-list";
  entry.causalNotes.forEach((note) => {
    const li = document.createElement("li");
    li.textContent = note;
    ul.appendChild(li);
  });
  entry.followupHooks.forEach((hook) => {
    const li = document.createElement("li");
    li.textContent = `후속: ${hook}`;
    ul.appendChild(li);
  });
  if (entry.visualStateReason) {
    const li = document.createElement("li");
    li.textContent = `연출: ${entry.visualStateReason}`;
    ul.appendChild(li);
  }
  if (entry.refs.length) {
    const li = document.createElement("li");
    li.textContent = `참조: ${entry.refs.join(", ")}`;
    ul.appendChild(li);
  }
  detail.appendChild(ul);
  card.appendChild(detail);

  return card;
}

function classifyChoiceStyle(label = "", idx = 0) {
  const t = String(label).toLowerCase();
  if (idx === 0) return "choice-btn choice-primary";
  if (/(지배|강압|정복|복종|강제|위협|피해|오염|굴복|희생|빼앗|죽|attack|dominate|force|corrupt)/.test(t)) {
    return "choice-btn choice-risk";
  }
  if (/(살핀|관찰|분석|조사|기록|정보|질문|협상|대화|신중|탐색|찰나|기회|check|investigate|analyze)/.test(t)) {
    return "choice-btn choice-info";
  }
  if (/(위로|보호|배려|안정|휴식|신뢰|존중|자비|연민|calm|soothe|comfort)/.test(t)) {
    return "choice-btn choice-soft";
  }
  return "choice-btn";
}

function axis(v) { return clamp(v, 0, 100); }
function gid(id) { return document.getElementById(id); }
function qsa(sel, parent = document) { return [...parent.querySelectorAll(sel)]; }
function mod(score) { return Math.floor((score - 10) / 2); }
function sign(n) { return n >= 0 ? `+${n}` : `${n}`; }
function signed(n) { return n >= 0 ? `+${n}` : `${n}`; }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[rand(0, arr.length - 1)]; }
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

