const STORAGE_KEY = "word-morph-lab-play-v1";

const CATEGORY_LINES = {
  celestial: "빛의 챔버가 먼저 밝아지고, 그다음 초상이 응답합니다.",
  elemental: "공기 압력이 바뀌고 화면에 물성이 스며듭니다.",
  botanical: "유기적인 무언가가 프레임을 타고 들어와 자리를 잡습니다.",
  arcane: "유리 챔버가 의식처럼 윙윙거린 뒤 상태가 고정됩니다.",
  creature: "실루엣이 짐승 쪽으로 기울면서도 본체의 얼굴은 남아 있습니다.",
  gothic: "실내가 한 톤 어두워지고 초상은 기묘한 쪽으로 기웁니다.",
  cyber: "주사선이 번쩍이며 합성광 아래에서 얼굴이 재구성됩니다.",
  roles: "갑작스러운 배역 교체처럼 의상이 초상을 둘러쌉니다.",
  moods: "같은 얼굴이지만 감정의 온도가 급격히 기웁니다.",
  materials: "색보다 먼저 질감이 들어오며, 초상이 무엇으로 이루어질지 스스로 정합니다.",
};

const CATEGORY_BRIEFS = {
  celestial: {
    directive: "빛 계열 단어를 이어 붙여 상승 곡선을 넓히세요.",
    observation: "얼굴보다 광원과 상징이 먼저 변형되는 축입니다.",
  },
  elemental: {
    directive: "물성과 압력 변화가 큰 단어를 연속으로 밀어 넣어 보세요.",
    observation: "표정 변화보다 피부감과 주변 환경 변화가 더 빠르게 반응합니다.",
  },
  botanical: {
    directive: "유기물 계열 단어를 이어서 입력하면 성장 곡선이 더 선명해집니다.",
    observation: "프레임 밖에서 침투해 들어오는 듯한 증식형 변화가 강합니다.",
  },
  arcane: {
    directive: "의식, 상징, 반사 계열 단어를 좁혀 상태를 정교하게 고정하세요.",
    observation: "형태보다 규칙과 상징이 먼저 나타나는 계산형 반응입니다.",
  },
  creature: {
    directive: "짐승 계열 단어를 가까운 종류끼리 이어서 입력해 보세요.",
    observation: "인간형 얼굴을 남긴 채 실루엣만 비틀어 가는 축입니다.",
  },
  gothic: {
    directive: "의복과 분위기 단어를 섞어 어두운 감정선을 밀어 올리세요.",
    observation: "서사 감각이 강하고, 같은 초상도 가장 극적으로 톤이 바뀌는 구간입니다.",
  },
  cyber: {
    directive: "기계, 신호, 스캔 계열 단어를 좁혀 시스템 노이즈를 이용하세요.",
    observation: "광원과 인터페이스 흔적이 먼저 생기고 얼굴은 나중에 재정렬됩니다.",
  },
  roles: {
    directive: "직업과 배역 계열 단어를 이어 붙여 연출 폭을 늘리세요.",
    observation: "인물의 표정은 유지한 채 외피와 태도만 교체되는 연기형 반응입니다.",
  },
  moods: {
    directive: "감정 계열 단어는 같은 얼굴의 온도를 바꾸는 데 가장 효과적입니다.",
    observation: "형태 변화는 작지만 감정 전달력이 커서 대사 체감이 가장 선명해집니다.",
  },
  materials: {
    directive: "질감 계열 단어를 써서 얼굴이 어떤 물성으로 굳는지 확인하세요.",
    observation: "색 변화보다 표면감과 반사율 변화가 먼저 고정되는 구간입니다.",
  },
};

const EVENT_LABELS = {
  boot: "관측 대기",
  empty: "빈 입력",
  miss: "불일치",
  unlock: "신규 해금",
  revisit: "재방문",
  hint: "힌트 지급",
  browse: "아카이브 점프",
  category: "카테고리 포커스",
  reset: "기록 초기화",
};

const LOCALIZED_ALIASES = {
  angel: ["천사", "엔젤"],
  sun: ["태양", "해"],
  moon: ["달", "문"],
  star: ["별", "스타"],
  eclipse: ["일식", "이클립스"],
  aurora: ["오로라"],
  comet: ["혜성", "코멧"],
  nova: ["초신성", "노바"],
  orbit: ["궤도", "오비트"],
  seraph: ["치천사", "세라프"],
  fire: ["불", "화염"],
  water: ["물", "워터"],
  ice: ["얼음", "빙결"],
  storm: ["폭풍", "스톰"],
  lightning: ["번개", "라이트닝"],
  wind: ["바람", "윈드"],
  earth: ["대지", "흙"],
  sand: ["모래", "샌드"],
  mist: ["안개", "미스트"],
  crystal: ["수정", "크리스탈"],
  rose: ["장미", "로즈"],
  thorn: ["가시"],
  ivy: ["담쟁이", "아이비"],
  bloom: ["개화", "블룸"],
  sakura: ["벚꽃", "사쿠라"],
  lotus: ["연꽃", "로터스"],
  moss: ["이끼", "모스"],
  vine: ["덩굴", "바인"],
  coral: ["산호", "코랄"],
  forest: ["숲", "포레스트"],
  witch: ["마녀", "위치"],
  rune: ["룬"],
  tarot: ["타로"],
  sigil: ["인장", "시질"],
  mirror: ["거울", "미러"],
  dream: ["꿈", "드림"],
  void: ["공허", "보이드"],
  glitch: ["글리치", "오류"],
  neon: ["네온"],
  prism: ["프리즘"],
  cat: ["고양이", "캣"],
  fox: ["여우", "폭스"],
  wolf: ["늑대", "울프"],
  rabbit: ["토끼", "래빗"],
  crow: ["까마귀", "크로우"],
  bat: ["박쥐", "배트"],
  moth: ["나방"],
  butterfly: ["나비", "버터플라이"],
  serpent: ["뱀", "서펀트"],
  dragon: ["용", "드래곤"],
  vampire: ["흡혈귀", "뱀파이어"],
  ghost: ["유령", "고스트"],
  doll: ["인형", "돌"],
  clown: ["광대", "클라운"],
  bride: ["신부", "브라이드"],
  funeral: ["장례", "퓨너럴"],
  candle: ["촛불", "캔들"],
  mask: ["가면", "마스크"],
  midnight: ["자정", "미드나잇"],
  bloody: ["피투성이", "블러디"],
  robot: ["로봇"],
  cyber: ["사이버"],
  hacker: ["해커"],
  laser: ["레이저"],
  pixel: ["픽셀"],
  server: ["서버"],
  satellite: ["위성", "새틀라이트"],
  drone: ["드론"],
  virus: ["바이러스"],
  signal: ["신호", "시그널"],
  queen: ["여왕", "퀸"],
  knight: ["기사", "나이트"],
  pirate: ["해적", "파이럿"],
  nurse: ["간호사", "너스"],
  detective: ["탐정", "디텍티브"],
  idol: ["아이돌"],
  chef: ["요리사", "셰프"],
  pilot: ["조종사", "파일럿"],
  priest: ["사제", "프리스트"],
  guard: ["경비", "가드"],
  joy: ["기쁨", "조이"],
  anger: ["분노", "앵거"],
  sorrow: ["슬픔", "소로우"],
  fear: ["공포", "피어"],
  envy: ["질투", "엔비"],
  greed: ["탐욕"],
  pride: ["자부심", "프라이드"],
  mercy: ["자비", "머시"],
  panic: ["공황", "패닉"],
  calm: ["평온", "고요"],
  glass: ["유리", "글라스"],
  gold: ["금", "골드"],
  silver: ["은", "실버"],
  obsidian: ["흑요석", "옵시디언"],
  porcelain: ["도자기", "포슬린"],
  velvet: ["벨벳"],
  paper: ["종이", "페이퍼"],
  ink: ["잉크"],
  smoke: ["연기", "스모크"],
  honey: ["꿀", "허니"],
};

const state = {
  catalog: null,
  words: [],
  save: loadSave(),
  ui: {
    currentInput: "",
    missSuggestions: [],
  },
};

const els = {
  heroUnlocked: document.getElementById("hero-unlocked"),
  heroAttempts: document.getElementById("hero-attempts"),
  heroCompletion: document.getElementById("hero-completion"),
  heroStreak: document.getElementById("hero-streak"),
  sessionFilter: document.getElementById("session-filter"),
  sessionHint: document.getElementById("session-hint"),
  sessionBest: document.getElementById("session-best"),
  stageCard: document.getElementById("stage-card"),
  stageCategory: document.getElementById("stage-category"),
  stageTitle: document.getElementById("stage-title"),
  stageChip: document.getElementById("stage-chip"),
  stageMood: document.getElementById("stage-mood"),
  stageCue: document.getElementById("stage-cue"),
  portraitStage: document.getElementById("portrait-stage"),
  portraitImage: document.getElementById("portrait-image"),
  portraitPlaceholder: document.getElementById("portrait-placeholder"),
  dialogueFrame: document.getElementById("dialogue-frame"),
  dialogueSpeaker: document.getElementById("dialogue-speaker"),
  dialogueEvent: document.getElementById("dialogue-event"),
  dialogueLine: document.getElementById("dialogue-line"),
  dialogueDirective: document.getElementById("dialogue-directive"),
  dialogueNote: document.getElementById("dialogue-note"),
  logList: document.getElementById("log-list"),
  consoleCard: document.getElementById("console-card"),
  wordForm: document.getElementById("word-form"),
  wordInput: document.getElementById("word-input"),
  suggestionList: document.getElementById("suggestion-list"),
  hintBtn: document.getElementById("hint-btn"),
  randomDiscoveredBtn: document.getElementById("random-discovered-btn"),
  resetProgressBtn: document.getElementById("reset-progress-btn"),
  clearFilterBtn: document.getElementById("clear-filter-btn"),
  hintPanel: document.getElementById("hint-panel"),
  categoryChipList: document.getElementById("category-chip-list"),
  detailWord: document.getElementById("detail-word"),
  detailCategory: document.getElementById("detail-category"),
  detailMood: document.getElementById("detail-mood"),
  detailCue: document.getElementById("detail-cue"),
  detailObservation: document.getElementById("detail-observation"),
  detailNext: document.getElementById("detail-next"),
  progressCaption: document.getElementById("progress-caption"),
  categoryProgress: document.getElementById("category-progress"),
  archiveCaption: document.getElementById("archive-caption"),
  archiveSort: document.getElementById("archive-sort"),
  archiveGrid: document.getElementById("archive-grid"),
  recentList: document.getElementById("recent-list"),
};

init().catch((error) => {
  renderFatalError(error);
});

async function init() {
  bindEvents();

  const response = await fetch(`./data/word_catalog.json?ts=${Date.now()}`);
  if (!response.ok) {
    throw new Error(`catalog load failed with ${response.status}`);
  }

  state.catalog = await response.json();
  state.words = flattenCatalog(state.catalog);
  normalizeSave();
  renderAll();
  focusWordInput();
}

function bindEvents() {
  els.wordForm.addEventListener("submit", (event) => {
    event.preventDefault();
    submitWord(els.wordInput.value);
  });

  els.wordInput.addEventListener("input", (event) => {
    state.ui.currentInput = event.target.value;
    renderSuggestions();
  });

  els.wordInput.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      els.wordInput.value = "";
      state.ui.currentInput = "";
      state.ui.missSuggestions = [];
      renderSuggestions();
    }
  });

  els.hintBtn.addEventListener("click", () => {
    issueHint();
  });

  els.randomDiscoveredBtn.addEventListener("click", () => {
    focusRandomDiscovered();
  });

  els.resetProgressBtn.addEventListener("click", () => {
    resetProgress();
  });

  els.clearFilterBtn.addEventListener("click", () => {
    state.save.archiveFilter = "all";
    persistSave();
    renderAll();
    focusWordInput();
  });

  els.archiveSort.addEventListener("change", (event) => {
    state.save.archiveSort = event.target.value;
    persistSave();
    renderArchive();
    focusWordInput();
  });

  window.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target;
    const typing = target instanceof HTMLElement && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");

    if (event.key === "/") {
      event.preventDefault();
      focusWordInput();
      return;
    }

    if (typing) return;

    if (event.key.toLowerCase() === "h") {
      event.preventDefault();
      issueHint();
    }

    if (event.key.toLowerCase() === "r") {
      event.preventDefault();
      focusRandomDiscovered();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      state.save.archiveFilter = "all";
      persistSave();
      renderAll();
      focusWordInput();
    }
  });
}

function loadSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultSave();
    return { ...createDefaultSave(), ...JSON.parse(raw) };
  } catch (error) {
    console.warn("save load failed", error);
    return createDefaultSave();
  }
}

function createDefaultSave() {
  return {
    discoveredIds: [],
    currentWordId: "",
    selectedArchiveId: "",
    attempts: 0,
    successfulAttempts: 0,
    streak: 0,
    bestStreak: 0,
    history: [],
    hintWordId: "",
    hintLevel: 0,
    archiveFilter: "all",
    archiveSort: "recent",
    lastEventType: "boot",
    lastEventWordId: "",
    lastInput: "",
    completedCategories: [],
    machineLog: [
      {
        type: "info",
        title: "시스템 가동",
        text: "숨겨진 단어를 입력해 초상을 새로운 안정 상태로 밀어 넣으세요.",
      },
    ],
  };
}

function normalizeSave() {
  const validIds = new Set(state.words.map((word) => word.id));
  state.save.discoveredIds = state.save.discoveredIds.filter((id) => validIds.has(id));
  state.save.history = state.save.history.filter((id) => validIds.has(id)).slice(0, 12);
  if (!validIds.has(state.save.currentWordId)) {
    state.save.currentWordId = state.save.discoveredIds[0] || "";
  }
  if (!validIds.has(state.save.selectedArchiveId)) {
    state.save.selectedArchiveId = state.save.currentWordId || state.save.discoveredIds[0] || "";
  }
  if (!validIds.has(state.save.hintWordId)) {
    state.save.hintWordId = "";
    state.save.hintLevel = 0;
  }
  const validFilters = ["all", ...(state.catalog?.categories || []).map((category) => category.slug)];
  if (!validFilters.includes(state.save.archiveFilter)) {
    state.save.archiveFilter = "all";
  }
  if (!["recent", "alphabetical", "category"].includes(state.save.archiveSort)) {
    state.save.archiveSort = "recent";
  }
  if (typeof state.save.lastEventType !== "string" || !EVENT_LABELS[state.save.lastEventType]) {
    state.save.lastEventType = "boot";
  }
  if (!validIds.has(state.save.lastEventWordId)) {
    state.save.lastEventWordId = "";
  }
  if (typeof state.save.lastInput !== "string") {
    state.save.lastInput = "";
  }
  if (!Array.isArray(state.save.completedCategories)) {
    state.save.completedCategories = [];
  } else {
    state.save.completedCategories = state.save.completedCategories.filter((slug) => validFilters.includes(slug));
  }
  if (!Array.isArray(state.save.machineLog) || !state.save.machineLog.length) {
    state.save.machineLog = createDefaultSave().machineLog;
  } else {
    state.save.machineLog = state.save.machineLog.slice(0, 8);
  }
  persistSave();
}

function persistSave() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.save));
}

function flattenCatalog(catalog) {
  const words = [];

  (catalog?.categories || []).forEach((category) => {
    (category.words || []).forEach((wordDef, index) => {
      const id = String(wordDef[0] || "").trim().toLowerCase();
      if (!id) return;

      const promptDelta = String(wordDef[1] || "").trim();
      const mood = String(wordDef[2] || "").trim();
      const aliases = Array.isArray(wordDef[3]) ? wordDef[3].map((value) => normalizeToken(value)) : [];
      const localizedAliases = Array.isArray(LOCALIZED_ALIASES[id])
        ? LOCALIZED_ALIASES[id].map((value) => normalizeToken(value))
        : [];

      words.push({
        id,
        label: toLabel(id),
        category: category.slug,
        categoryLabel: category.label,
        accent: category.accent,
        promptDelta,
        mood,
        imagePath: `./assets/generated/${id}.png`,
        searchTokens: Array.from(
          new Set([normalizeToken(id), normalizeToken(toLabel(id)), ...aliases, ...localizedAliases].filter(Boolean)),
        ),
        sortIndex: index,
      });
    });
  });

  return words;
}

function renderAll() {
  renderHero();
  renderSessionStrip();
  renderStage();
  renderDialogue();
  renderLog();
  renderSuggestions();
  renderHint();
  renderCategoryNav();
  renderDetails();
  renderRecent();
  renderProgress();
  renderArchive();
}

function renderHero() {
  const discovered = state.save.discoveredIds.length;
  const total = state.words.length;
  const completion = total ? Math.round((discovered / total) * 100) : 0;

  els.heroUnlocked.textContent = `${discovered} / ${total}`;
  els.heroAttempts.textContent = String(state.save.attempts);
  els.heroCompletion.textContent = `${completion}%`;
  els.heroStreak.textContent = `${state.save.streak || 0}`;
}

function renderSessionStrip() {
  const activeFilter = state.save.archiveFilter === "all" ? "전체 상태" : `${toLabel(state.save.archiveFilter)} 필터`;
  const hintWord = getHintWord();
  const activeHint = hintWord ? `${hintWord.label} · Lv.${(state.save.hintLevel || 0) + 1}` : "힌트 없음";

  els.sessionFilter.textContent = activeFilter;
  els.sessionHint.textContent = activeHint;
  els.sessionBest.textContent = `${state.save.bestStreak || 0}`;
}

function renderStage() {
  const word = getCurrentWord();
  if (!word) {
    els.stageCategory.textContent = "LOCKED STATE";
    els.stageTitle.textContent = "아직 아무 상태도 열리지 않았습니다.";
    els.stageChip.textContent = "대기";
    els.stageMood.textContent = "-";
    els.stageCue.textContent = "-";
    els.stageChip.className = "status-chip";
    els.portraitImage.hidden = true;
    els.portraitPlaceholder.hidden = false;
    els.portraitStage.style.setProperty("--stage-accent", "#7ce0ff");
    document.documentElement.style.setProperty("--active-accent", "#77e1ff");
    return;
  }

  els.portraitStage.style.setProperty("--stage-accent", word.accent);
  document.documentElement.style.setProperty("--active-accent", word.accent);
  els.stageCategory.textContent = word.categoryLabel.toUpperCase();
  els.stageTitle.textContent = word.label;
  els.stageChip.textContent = state.save.discoveredIds.includes(word.id) ? "해금됨" : "미해금";
  els.stageMood.textContent = word.mood;
  els.stageCue.textContent = word.promptDelta;
  els.stageChip.className = `status-chip ${state.save.discoveredIds.includes(word.id) ? "is-active" : ""}`;
  els.portraitImage.src = word.imagePath;
  els.portraitImage.alt = `${word.label} portrait`;
  els.portraitImage.hidden = false;
  els.portraitPlaceholder.hidden = true;
}

function renderDialogue() {
  const eventWord = findWord(state.save.lastEventWordId);
  const wordfulEvents = new Set(["unlock", "revisit", "hint", "browse", "category"]);
  const word = wordfulEvents.has(state.save.lastEventType) || state.save.lastEventType === "boot" ? eventWord || getCurrentWord() : eventWord;
  const packet = buildDialoguePacket(word, state.save.lastEventType, state.save.lastInput);

  els.dialogueFrame.style.setProperty("--dialogue-accent", packet.accent);
  els.dialogueSpeaker.textContent = packet.speaker;
  els.dialogueEvent.textContent = packet.event;
  els.dialogueLine.textContent = packet.line;
  els.dialogueDirective.textContent = packet.directive;
  els.dialogueNote.textContent = packet.note;
}

function renderLog() {
  els.logList.innerHTML = state.save.machineLog
    .map(
      (entry) => `
        <article class="log-entry log-${escapeAttr(entry.type)}">
          <div class="log-entry-head">
            <strong>${escapeHtml(entry.title)}</strong>
            <span class="tiny-caption">${escapeHtml(entry.type.toUpperCase())}</span>
          </div>
          <p>${escapeHtml(entry.text)}</p>
        </article>
      `,
    )
    .join("");
}

function renderHint() {
  const hintWord = getHintWord();
  if (!hintWord) {
    els.hintPanel.innerHTML = `
      <div class="hint-empty">
        <strong>힌트 없음</strong>
        <p>막히면 힌트 버튼을 눌러 카테고리와 글자 정보를 확인해 보세요.</p>
      </div>
    `;
    return;
  }

  els.hintPanel.innerHTML = `
    <div class="hint-box" style="--hint-accent: ${escapeAttr(hintWord.accent)};">
      <p class="eyebrow eyebrow-inline">ACTIVE HINT</p>
      <strong>${escapeHtml(hintWord.categoryLabel)}</strong>
      <ul class="hint-list">
        <li>힌트 레벨: ${(state.save.hintLevel || 0) + 1} / 3</li>
        <li>글자 수: ${hintWord.id.length}</li>
        <li>시작 글자: ${escapeHtml(hintWord.id.slice(0, Math.min((state.save.hintLevel || 0) + 1, hintWord.id.length)).toUpperCase())}</li>
        <li>분위기: ${escapeHtml(hintWord.mood)}</li>
      </ul>
    </div>
  `;
}

function renderSuggestions() {
  const token = normalizeToken(state.ui.currentInput);
  const activeSuggestions = token ? getSuggestions(token, 6) : [];
  const missSuggestions = state.ui.missSuggestions.map((id) => findWord(id)).filter(Boolean);
  const starterSuggestions = !token && !missSuggestions.length ? getStarterSuggestions(4) : [];

  if (!token && !missSuggestions.length && !starterSuggestions.length) {
    els.suggestionList.innerHTML = `
      <div class="suggestion-empty">
        <strong>입력 대기 중</strong>
        입력을 시작하면 관련 후보가 여기에 나타납니다. 정확한 단어가 아니어도 비슷한 후보를 바로 잡아줍니다.
      </div>
    `;
    return;
  }

  const blocks = [];

  if (starterSuggestions.length) {
    blocks.push(`
      <div class="suggestion-group">
        <span class="tiny-caption">시작 추천</span>
        <div class="suggestion-row">
          ${starterSuggestions
            .map(
              (word) => `
                <button type="button" class="suggestion-chip" data-suggestion-word-id="${escapeAttr(word.id)}">
                  <strong>${escapeHtml(word.label)}</strong>
                  <small>${escapeHtml(word.categoryLabel)}</small>
                </button>
              `,
            )
            .join("")}
        </div>
      </div>
    `);
  }

  if (activeSuggestions.length) {
    blocks.push(`
      <div class="suggestion-group">
        <span class="tiny-caption">입력 중 후보</span>
        <div class="suggestion-row">
          ${activeSuggestions
            .map(
              (word) => `
                <button type="button" class="suggestion-chip" data-suggestion-word-id="${escapeAttr(word.id)}">
                  <strong>${escapeHtml(word.label)}</strong>
                  <small>${escapeHtml(word.categoryLabel)}</small>
                </button>
              `,
            )
            .join("")}
        </div>
      </div>
    `);
  }

  if (!activeSuggestions.length && token) {
    blocks.push(`
      <div class="suggestion-empty">
        현재 입력과 바로 맞닿는 후보는 아직 없습니다. 힌트를 눌러 카테고리를 좁히거나 철자를 조금 바꿔 보세요.
      </div>
    `);
  }

  if (missSuggestions.length) {
    blocks.push(`
      <div class="suggestion-group">
        <span class="tiny-caption">가까운 후보</span>
        <div class="suggestion-row">
          ${missSuggestions
            .map(
              (word) => `
                <button type="button" class="suggestion-chip" data-suggestion-word-id="${escapeAttr(word.id)}">
                  <strong>${escapeHtml(word.label)}</strong>
                  <small>${escapeHtml(word.categoryLabel)}</small>
                </button>
              `,
            )
            .join("")}
        </div>
      </div>
    `);
  }

  els.suggestionList.innerHTML = blocks.join("");

  els.suggestionList.querySelectorAll("[data-suggestion-word-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const wordId = button.dataset.suggestionWordId;
      els.wordInput.value = wordId;
      state.ui.currentInput = wordId;
      submitWord(wordId);
    });
  });
}

function renderCategoryNav() {
  const categories = state.catalog?.categories || [];

  els.categoryChipList.innerHTML = categories
    .map((category) => {
      const words = state.words.filter((word) => word.category === category.slug);
      const discovered = words.filter((word) => state.save.discoveredIds.includes(word.id)).length;
      const isActive = state.save.archiveFilter === category.slug;

      return `
        <button
          type="button"
          class="category-chip ${isActive ? "is-active" : ""}"
          data-category-slug="${escapeAttr(category.slug)}"
          style="--chip-accent: ${escapeAttr(category.accent)};"
        >
          <span>
            <strong>${escapeHtml(category.label)}</strong>
            <small>${discovered} / ${words.length}</small>
          </span>
          <small>${discovered === words.length ? "완료" : "열기"}</small>
        </button>
      `;
    })
    .join("");

  els.categoryChipList.querySelectorAll("[data-category-slug]").forEach((button) => {
    button.addEventListener("click", () => {
      focusCategory(button.dataset.categorySlug);
    });
  });
}

function renderDetails() {
  const word = getSelectedArchiveWord() || getCurrentWord();
  if (!word) {
    els.detailWord.textContent = "-";
    els.detailCategory.textContent = "-";
    els.detailMood.textContent = "-";
    els.detailCue.textContent = "-";
    els.detailObservation.textContent = "-";
    els.detailNext.textContent = "-";
    return;
  }

  els.detailWord.textContent = word.label;
  els.detailCategory.textContent = word.categoryLabel;
  els.detailMood.textContent = word.mood;
  els.detailCue.textContent = word.promptDelta;
  els.detailObservation.textContent = buildDossierObservation(word);
  els.detailNext.textContent = buildNextPush(word);
}

function renderRecent() {
  const recentWords = state.save.history.map((id) => findWord(id)).filter(Boolean).slice(0, 6);

  if (!recentWords.length) {
    els.recentList.innerHTML = `
      <div class="recent-empty">
        <strong>아직 기록이 없습니다</strong>
        <p>단어를 맞히기 시작하면 최근 방문 상태가 여기에 쌓입니다.</p>
      </div>
    `;
    return;
  }

  els.recentList.innerHTML = recentWords
    .map((word, index) => {
      const isCurrent = word.id === state.save.currentWordId;
      return `
        <button
          type="button"
          class="recent-item"
          data-recent-word-id="${escapeAttr(word.id)}"
          style="--recent-accent: ${escapeAttr(word.accent)};"
        >
          <span class="recent-item-copy">
            <strong>${escapeHtml(word.label)}</strong>
            <small>${escapeHtml(word.categoryLabel)} · ${escapeHtml(word.mood)}</small>
          </span>
          <span class="recent-index">${isCurrent ? "LIVE" : `#0${index + 1}`}</span>
        </button>
      `;
    })
    .join("");

  els.recentList.querySelectorAll("[data-recent-word-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const wordId = button.dataset.recentWordId;
      state.save.currentWordId = wordId;
      state.save.selectedArchiveId = wordId;
      persistSave();
      renderAll();
      focusWordInput();
    });
  });
}

function renderProgress() {
  const categories = state.catalog?.categories || [];
  let activeCategories = 0;
  const remaining = Math.max(state.words.length - state.save.discoveredIds.length, 0);

  els.categoryProgress.innerHTML = categories
    .map((category) => {
      const words = state.words.filter((word) => word.category === category.slug);
      const discovered = words.filter((word) => state.save.discoveredIds.includes(word.id)).length;
      if (discovered > 0) activeCategories += 1;
      const total = words.length || 1;
      const percent = Math.round((discovered / total) * 100);
      const status = discovered === total ? "완료" : discovered > 0 ? "진행 중" : "잠김";

      return `
        <article class="progress-node" style="--node-accent: ${escapeAttr(category.accent)};">
          <div class="progress-node-head">
            <strong>${escapeHtml(category.label)}</strong>
            <span>${discovered} / ${total} · ${status}</span>
          </div>
          <div class="progress-bar">
            <span style="width: ${percent}%;"></span>
          </div>
        </article>
      `;
    })
    .join("");

  els.progressCaption.textContent = `${activeCategories} / ${categories.length} 카테고리 활성화 · ${remaining}개 남음`;
}

function renderArchive() {
  const discoveredWords = state.save.discoveredIds
    .map((id) => findWord(id))
    .filter(Boolean)
    .filter((word) => state.save.archiveFilter === "all" || word.category === state.save.archiveFilter);
  const sortedWords = sortArchiveWords(discoveredWords);
  const overallRemaining = Math.max(state.words.length - state.save.discoveredIds.length, 0);

  els.archiveSort.value = state.save.archiveSort;

  els.archiveCaption.textContent =
    state.save.archiveFilter === "all"
      ? `${sortedWords.length}개 표시 · 전체 ${overallRemaining}개 남음`
      : `${sortedWords.length}개 표시 · ${toLabel(state.save.archiveFilter)} 필터`;

  if (!sortedWords.length) {
    els.archiveGrid.innerHTML = `
      <div class="archive-empty">
        <strong>${state.save.archiveFilter === "all" ? "아카이브가 비어 있습니다" : "이 필터에는 아직 카드가 없습니다"}</strong>
        <p>${
          state.save.archiveFilter === "all"
            ? "해금된 단어가 생기면 이곳에 카드가 차곡차곡 쌓입니다."
            : "다른 카테고리를 열어 보거나 전체 보기로 돌아가면 해금된 카드들을 다시 볼 수 있습니다."
        }</p>
      </div>
    `;
    return;
  }

  els.archiveGrid.innerHTML = sortedWords
    .map((word) => {
      const selected = word.id === (state.save.selectedArchiveId || state.save.currentWordId);
      return `
        <button
          type="button"
          class="archive-card-item ${selected ? "is-selected" : ""}"
          data-word-id="${escapeAttr(word.id)}"
          style="--archive-accent: ${escapeAttr(word.accent)};"
        >
          <img src="${escapeAttr(word.imagePath)}" alt="${escapeAttr(word.label)}" loading="lazy" decoding="async" />
          <span class="archive-copy">
            <strong>${escapeHtml(word.label)}</strong>
            <small>${escapeHtml(word.categoryLabel)}</small>
          </span>
        </button>
      `;
    })
    .join("");

  els.archiveGrid.querySelectorAll("[data-word-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const wordId = button.dataset.wordId;
      state.save.selectedArchiveId = wordId;
      state.save.currentWordId = wordId;
      persistSave();
      renderAll();
    });
  });
}

function submitWord(rawValue) {
  const token = normalizeToken(rawValue);
  els.wordInput.value = "";
  state.ui.currentInput = "";

  if (!token) {
    setLastEvent("empty");
    pushLog("info", "콘솔 대기", "아무 입력도 들어오지 않았습니다. 단어를 하나 적어 넣어 주세요.");
    state.ui.missSuggestions = [];
    flashCard(els.consoleCard, "is-error");
    renderAll();
    focusWordInput();
    return;
  }

  state.save.attempts += 1;
  const word = state.words.find((entry) => entry.searchTokens.includes(token));

  if (!word) {
    state.save.streak = 0;
    setLastEvent("miss", "", rawValue);
    state.ui.missSuggestions = getSuggestions(token, 4).map((entry) => entry.id);
    pushLog(
      "error",
      "안정 상태 없음",
      `"${rawValue}"는 현재 카탈로그에서 안정적인 상태를 만들지 못했습니다. 힌트를 써서 방향을 좁혀 보세요.`,
    );
    flashCard(els.consoleCard, "is-error");
    persistSave();
    renderAll();
    focusWordInput();
    return;
  }

  const isNew = !state.save.discoveredIds.includes(word.id);
  const resolvedHint = state.save.hintWordId === word.id;
  state.ui.missSuggestions = [];

  if (isNew) {
    state.save.discoveredIds.push(word.id);
  }

  state.save.successfulAttempts += 1;
  state.save.streak = (state.save.streak || 0) + 1;
  state.save.bestStreak = Math.max(state.save.bestStreak || 0, state.save.streak);
  state.save.currentWordId = word.id;
  state.save.selectedArchiveId = word.id;
  state.save.history = [word.id, ...state.save.history.filter((id) => id !== word.id)].slice(0, 12);
  if (resolvedHint) {
    state.save.hintWordId = "";
    state.save.hintLevel = 0;
  }
  setLastEvent(isNew ? "unlock" : "revisit", word.id, rawValue);

  pushLog(
    "success",
    isNew ? `상태 해금: ${word.label}` : `상태 재방문: ${word.label}`,
    buildReaction(word, isNew, resolvedHint),
  );

  if (isNew) {
    maybeCelebrateCategory(word.category);
  }

  flashCard(els.consoleCard, "is-success");
  flashCard(els.stageCard, "is-success");
  persistSave();
  renderAll();
  focusWordInput();
}

function issueHint() {
  const undiscovered = state.words.filter((word) => !state.save.discoveredIds.includes(word.id));
  if (!undiscovered.length) {
    pushLog("info", "아카이브 완성", "모든 상태가 이미 해금됐습니다. 이제 갤러리를 둘러보거나 새 카탈로그를 만들 차례입니다.");
    renderAll();
    focusWordInput();
    return;
  }

  const scopedPool =
    state.save.archiveFilter === "all"
      ? undiscovered
      : undiscovered.filter((word) => word.category === state.save.archiveFilter);
  const currentHintStillLocked = undiscovered.find((word) => word.id === state.save.hintWordId);
  const hintPool = scopedPool.length ? scopedPool : undiscovered;
  const hintWord = currentHintStillLocked || hintPool[Math.floor(Math.random() * hintPool.length)];

  state.save.hintWordId = hintWord.id;
  state.save.hintLevel = currentHintStillLocked ? Math.min((state.save.hintLevel || 0) + 1, 2) : 0;
  setLastEvent("hint", hintWord.id, hintWord.id);
  pushLog(
    "info",
    "힌트 지급",
    buildHintLine(hintWord),
  );
  persistSave();
  renderAll();
  focusWordInput();
}

function focusRandomDiscovered() {
  if (!state.save.discoveredIds.length) {
    pushLog("info", "아카이브 비어 있음", "먼저 단어 하나를 맞혀 첫 상태를 해금해 보세요.");
    renderAll();
    focusWordInput();
    return;
  }

  const wordId = state.save.discoveredIds[Math.floor(Math.random() * state.save.discoveredIds.length)];
  state.save.currentWordId = wordId;
  state.save.selectedArchiveId = wordId;
  setLastEvent("browse", wordId, wordId);
  pushLog("info", "아카이브 점프", `${toLabel(wordId)} 상태로 화면을 전환했습니다.`);
  persistSave();
  renderAll();
  focusWordInput();
}

function resetProgress() {
  const confirmed = window.confirm("해금 기록과 로그를 모두 초기화할까요?");
  if (!confirmed) return;
  state.save = createDefaultSave();
  setLastEvent("reset");
  persistSave();
  renderAll();
  focusWordInput();
}

function buildReaction(word, isNew, resolvedHint) {
  const lead = CATEGORY_LINES[word.category] || "초상이 흔들리다가 다시 안정됩니다.";
  const novelty = isNew
    ? "새로운 상태가 아카이브에 추가되었습니다."
    : "같은 상태가 더 빠르게 돌아옵니다. 이미 길을 기억하는 것 같습니다.";
  const hintLine = resolvedHint ? "방금 받은 힌트가 정확히 들어맞았습니다." : "";

  return `${lead} ${hintLine} ${novelty} ${word.promptDelta}. 지금 공간의 분위기는 ${word.mood} 쪽으로 기울어 있습니다.`
    .replace(/\s+/g, " ")
    .trim();
}

function buildDialoguePacket(word, eventType, rawInput) {
  if (!word) {
    return buildIdleDialoguePacket(eventType, rawInput);
  }

  return {
    speaker: `SUBJECT-01 · ${word.label}`,
    event: EVENT_LABELS[eventType] || EVENT_LABELS.boot,
    line: buildSubjectLine(word, eventType, rawInput),
    directive: buildDialogueDirective(word, eventType),
    note: buildDialogueNote(word, eventType),
    accent: word.accent || "#77e1ff",
  };
}

function buildIdleDialoguePacket(eventType, rawInput) {
  if (eventType === "empty") {
    return {
      speaker: "SUBJECT-01",
      event: EVENT_LABELS.empty,
      line: "아무 말도 넣지 않으면 나는 아무 쪽으로도 기울지 않아요.",
      directive: "영문이나 한글 별칭으로 첫 단어를 입력하세요.",
      note: "빈 입력은 상태를 만들지 못합니다. 시작 추천 칩을 눌러도 됩니다.",
      accent: "#77e1ff",
    };
  }

  if (eventType === "miss") {
    const safeInput = String(rawInput || "").trim() || "입력값";
    return {
      speaker: "LAB CONSOLE",
      event: EVENT_LABELS.miss,
      line: `"${safeInput}"은 표면에서 미끄러졌습니다. 조금 더 가까운 단어가 필요합니다.`,
      directive: "가까운 후보를 누르거나 힌트로 범위를 좁혀 보세요.",
      note: "카탈로그 밖 입력입니다. 스트릭은 끊기지만 탐색 힌트는 계속 쓸 수 있습니다.",
      accent: "#ff7e8c",
    };
  }

  if (eventType === "reset") {
    return {
      speaker: "SUBJECT-01",
      event: EVENT_LABELS.reset,
      line: "기록이 비워졌네요. 다시 처음 얼굴부터 시작할 수 있어요.",
      directive: "첫 단어를 다시 입력해 반응 곡선을 여세요.",
      note: "아카이브와 로그가 초기화됐습니다. 이미지 파일은 그대로 남아 있습니다.",
      accent: "#ffc96b",
    };
  }

  return {
    speaker: "SUBJECT-01",
    event: EVENT_LABELS.boot,
    line: "아직은 같은 얼굴뿐이에요. 단어가 들어와야 내가 어느 쪽으로 기울지 정해져요.",
    directive: "첫 단어를 입력해 초상을 다른 안정 상태로 밀어 넣으세요.",
    note: "초기 상태입니다. 입력 성공 후 대사, 초상, 로그가 함께 갱신됩니다.",
    accent: "#77e1ff",
  };
}

function buildSubjectLine(word, eventType) {
  const motif = getPromptFragments(word.promptDelta, 2);

  if (eventType === "hint") {
    return `"${word.label}" 쪽 냄새가 나요. ${word.categoryLabel} 결을 따라오면 ${motif}가 먼저 붙을 거예요.`;
  }

  if (eventType === "revisit") {
    return `"${word.label}"은 이미 기억해요. 이번에는 더 빨리 ${word.mood} 쪽으로 돌아갈 수 있어요.`;
  }

  if (eventType === "browse") {
    return `"${word.label}"은 아직 여기 있어요. 같은 단어를 다시 밀어도 형태가 쉽게 흐트러지지 않아요.`;
  }

  if (eventType === "category") {
    return `"${word.categoryLabel}" 쪽 공기가 짙어졌어요. ${word.label} 같은 말이 지금은 더 잘 먹힐 거예요.`;
  }

  return `"${word.label}"... ${motif}가 먼저 붙어요. 지금은 ${word.mood} 쪽으로 서 있는 게 가장 쉬워요.`;
}

function buildDialogueDirective(word, eventType) {
  const brief = CATEGORY_BRIEFS[word.category];

  if (eventType === "hint") {
    const prefix = word.id.slice(0, Math.min((state.save.hintLevel || 0) + 1, word.id.length)).toUpperCase();
    return `${word.categoryLabel} 계열 · ${word.id.length}글자 · ${prefix} 시작을 기억하세요.`;
  }

  if (eventType === "browse") {
    return `${word.label} 주변 상태를 이어서 입력해 연쇄 반응을 노리세요.`;
  }

  if (eventType === "category") {
    return `${word.categoryLabel} 포커스 활성화. ${brief?.directive || "같은 계열 단어를 계속 밀어 보세요."}`;
  }

  return brief?.directive || "가까운 단어를 이어 입력해 상태 변형 폭을 넓히세요.";
}

function buildDialogueNote(word, eventType) {
  const motif = getPromptFragments(word.promptDelta, 2);
  const related = getRelatedWords(word, 2)
    .map((entry) => entry.label)
    .join(", ");

  if (eventType === "hint") {
    return `힌트 고정 중입니다. 분위기 축은 ${word.mood}이고, 표면 단서는 ${motif}입니다.`;
  }

  if (eventType === "revisit") {
    return `재방문 안정화 상태입니다. 같은 계열에서 이어 가면 스트릭 유지에 유리합니다.`;
  }

  if (eventType === "browse") {
    return related ? `아카이브 기준점 복원. 같은 계열 후보: ${related}.` : `아카이브 기준점이 복원됐습니다.`;
  }

  if (eventType === "category") {
    return `선택 카테고리: ${word.categoryLabel}. 미해금 단어를 먼저 밀면 흐름이 더 잘 이어집니다.`;
  }

  return `${word.categoryLabel} 반응 고정. 표면 단서: ${motif}.`;
}

function buildDossierObservation(word) {
  const brief = CATEGORY_BRIEFS[word.category];
  return `${brief?.observation || "현재 상태를 유지한 채 표면 요소만 바뀌는 반응입니다."} 표면 단서: ${getPromptFragments(word.promptDelta, 2)}.`;
}

function buildNextPush(word) {
  const related = getRelatedWords(word, 3);
  if (!related.length) {
    return `${word.categoryLabel} 계열은 거의 닫혔습니다. 다른 카테고리로 옮겨도 됩니다.`;
  }

  const lockedRelated = related.filter((entry) => !state.save.discoveredIds.includes(entry.id));
  const pool = lockedRelated.length ? lockedRelated : related;
  return `${word.categoryLabel} 계열에서 ${pool.map((entry) => entry.label).join(", ")} 쪽으로 더 밀면 결이 자연스럽게 이어집니다.`;
}

function getRelatedWords(word, limit) {
  return state.words
    .filter((entry) => entry.category === word.category && entry.id !== word.id)
    .sort((left, right) => {
      const lockedLeft = state.save.discoveredIds.includes(left.id) ? 1 : 0;
      const lockedRight = state.save.discoveredIds.includes(right.id) ? 1 : 0;
      return lockedLeft - lockedRight || Math.abs(left.sortIndex - word.sortIndex) - Math.abs(right.sortIndex - word.sortIndex);
    })
    .slice(0, limit);
}

function getPromptFragments(promptDelta, limit) {
  return String(promptDelta || "")
    .split(",")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .slice(0, limit)
    .join(", ");
}

function setLastEvent(type, wordId = "", rawInput = "") {
  state.save.lastEventType = type;
  state.save.lastEventWordId = wordId;
  state.save.lastInput = String(rawInput || "").trim();
}

function pushLog(type, title, text) {
  state.save.machineLog = [{ type, title, text }, ...state.save.machineLog].slice(0, 8);
}

function getCurrentWord() {
  return findWord(state.save.currentWordId);
}

function getHintWord() {
  return findWord(state.save.hintWordId);
}

function getSelectedArchiveWord() {
  return findWord(state.save.selectedArchiveId);
}

function findWord(wordId) {
  return state.words.find((word) => word.id === wordId) || null;
}

function getSuggestions(token, limit) {
  return state.words
    .map((word) => ({ word, score: scoreWordMatch(word, token) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.word.label.localeCompare(right.word.label))
    .slice(0, limit)
    .map((entry) => entry.word);
}

function getStarterSuggestions(limit) {
  const pool = state.words.filter(
    (word) =>
      !state.save.discoveredIds.includes(word.id) &&
      (state.save.archiveFilter === "all" || word.category === state.save.archiveFilter),
  );
  const fallback = pool.length ? pool : state.words.filter((word) => !state.save.discoveredIds.includes(word.id));
  return fallback.slice(0, limit);
}

function scoreWordMatch(word, token) {
  let best = 0;
  word.searchTokens.forEach((searchToken) => {
    if (searchToken === token) {
      best = Math.max(best, 100);
      return;
    }
    if (searchToken.startsWith(token)) {
      best = Math.max(best, 80 - Math.max(searchToken.length - token.length, 0));
      return;
    }
    if (searchToken.includes(token)) {
      best = Math.max(best, 52 - Math.max(searchToken.length - token.length, 0));
      return;
    }
    const distance = levenshtein(searchToken, token);
    if (distance <= 2) {
      best = Math.max(best, 34 - distance * 10);
    }
  });
  return best;
}

function normalizeToken(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildHintLine(word) {
  const prefix = word.id.slice(0, Math.min((state.save.hintLevel || 0) + 1, word.id.length)).toUpperCase();
  const extra =
    state.save.hintLevel >= 2 ? ` 상태 단서: ${word.promptDelta.split(",").slice(0, 2).join(", ")}.` : "";
  return `${word.categoryLabel} 계열입니다. ${word.id.length}글자이며 ${prefix}로 시작합니다.${extra}`;
}

function maybeCelebrateCategory(categorySlug) {
  const categoryWords = state.words.filter((word) => word.category === categorySlug);
  const allUnlocked = categoryWords.every((word) => state.save.discoveredIds.includes(word.id));
  if (!allUnlocked || state.save.completedCategories.includes(categorySlug)) return;

  state.save.completedCategories.push(categorySlug);
  pushLog("success", `카테고리 완성: ${toLabel(categorySlug)}`, `${toLabel(categorySlug)} 카테고리의 모든 상태를 해금했습니다.`);
}

function focusWordInput() {
  els.wordInput.focus();
}

function flashCard(element, className) {
  if (!element) return;
  element.classList.remove("is-success", "is-error");
  void element.offsetWidth;
  element.classList.add(className);
  window.setTimeout(() => {
    element.classList.remove(className);
  }, 460);
}

function toLabel(value) {
  return String(value || "")
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((chunk) => chunk.slice(0, 1).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function focusCategory(categorySlug) {
  state.save.archiveFilter = categorySlug;
  const discoveredInCategory = state.words.filter(
    (word) => word.category === categorySlug && state.save.discoveredIds.includes(word.id),
  );

  if (discoveredInCategory.length) {
    state.save.currentWordId = discoveredInCategory[0].id;
    state.save.selectedArchiveId = discoveredInCategory[0].id;
    setLastEvent("category", discoveredInCategory[0].id, categorySlug);
    pushLog("info", "카테고리 점프", `${toLabel(categorySlug)} 카테고리의 해금 상태로 이동했습니다.`);
  } else {
    const lockedInCategory = state.words.filter(
      (word) => word.category === categorySlug && !state.save.discoveredIds.includes(word.id),
    );
    if (lockedInCategory.length) {
      state.save.hintWordId = lockedInCategory[0].id;
      state.save.hintLevel = 0;
      setLastEvent("category", lockedInCategory[0].id, categorySlug);
      pushLog("info", "카테고리 점프", `${toLabel(categorySlug)} 카테고리는 아직 미해금입니다. 첫 힌트를 준비했습니다.`);
    }
  }

  persistSave();
  renderAll();
  focusWordInput();
}

function sortArchiveWords(words) {
  if (state.save.archiveSort === "alphabetical") {
    return [...words].sort((left, right) => left.label.localeCompare(right.label));
  }

  if (state.save.archiveSort === "category") {
    return [...words].sort(
      (left, right) =>
        left.categoryLabel.localeCompare(right.categoryLabel) || left.sortIndex - right.sortIndex || left.label.localeCompare(right.label),
    );
  }

  return [...words].sort(
    (left, right) => state.save.discoveredIds.indexOf(right.id) - state.save.discoveredIds.indexOf(left.id),
  );
}

function levenshtein(left, right) {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = new Array(right.length + 1).fill(0);

  for (let row = 1; row <= left.length; row += 1) {
    current[0] = row;
    for (let column = 1; column <= right.length; column += 1) {
      const cost = left[row - 1] === right[column - 1] ? 0 : 1;
      current[column] = Math.min(previous[column] + 1, current[column - 1] + 1, previous[column - 1] + cost);
    }
    for (let column = 0; column <= right.length; column += 1) {
      previous[column] = current[column];
    }
  }

  return previous[right.length];
}

function renderFatalError(error) {
  document.body.innerHTML = `
    <main class="fatal-shell">
      <section class="fatal-card">
        <p class="eyebrow">BOOT ERROR</p>
        <h1>카탈로그를 불러오지 못했습니다.</h1>
        <p>${escapeHtml(error.message)}</p>
        <p class="tiny-caption">정적 로컬 서버에서 여는 것을 전제로 합니다. <code>game_DEV/word-morph-lab</code>에서 <code>python -m http.server 4173</code> 실행 후 접속해 주세요.</p>
      </section>
    </main>
  `;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}
