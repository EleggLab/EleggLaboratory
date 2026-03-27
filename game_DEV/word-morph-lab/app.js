const STORAGE_KEY = "word-morph-lab-play-v1";

const CATEGORY_LINES = {
  celestial: "The light chamber blooms first, then the portrait answers.",
  elemental: "The air pressure shifts and the frame takes on a raw physical charge.",
  botanical: "Something organic crawls through the composition and settles into place.",
  arcane: "The glass hums with ritual static before the state locks in.",
  creature: "The silhouette twitches into a more animal shape without losing itself.",
  gothic: "The room darkens by a shade and the portrait leans toward the uncanny.",
  cyber: "Scanlines flash across the panel and the face resolves under synthetic light.",
  roles: "Costume logic hardens around the portrait like a sudden script rewrite.",
  moods: "The same face survives, but its emotional temperature tilts hard.",
  materials: "Texture arrives before color, as if the portrait is choosing what it is made of.",
};

const state = {
  catalog: null,
  words: [],
  save: loadSave(),
};

const els = {
  heroUnlocked: document.getElementById("hero-unlocked"),
  heroAttempts: document.getElementById("hero-attempts"),
  heroCompletion: document.getElementById("hero-completion"),
  stageCategory: document.getElementById("stage-category"),
  stageTitle: document.getElementById("stage-title"),
  stageChip: document.getElementById("stage-chip"),
  portraitStage: document.getElementById("portrait-stage"),
  portraitImage: document.getElementById("portrait-image"),
  portraitPlaceholder: document.getElementById("portrait-placeholder"),
  logList: document.getElementById("log-list"),
  wordForm: document.getElementById("word-form"),
  wordInput: document.getElementById("word-input"),
  hintBtn: document.getElementById("hint-btn"),
  randomDiscoveredBtn: document.getElementById("random-discovered-btn"),
  resetProgressBtn: document.getElementById("reset-progress-btn"),
  hintPanel: document.getElementById("hint-panel"),
  detailWord: document.getElementById("detail-word"),
  detailCategory: document.getElementById("detail-category"),
  detailMood: document.getElementById("detail-mood"),
  detailCue: document.getElementById("detail-cue"),
  progressCaption: document.getElementById("progress-caption"),
  categoryProgress: document.getElementById("category-progress"),
  archiveCaption: document.getElementById("archive-caption"),
  archiveGrid: document.getElementById("archive-grid"),
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
}

function bindEvents() {
  els.wordForm.addEventListener("submit", (event) => {
    event.preventDefault();
    submitWord(els.wordInput.value);
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
    history: [],
    hintWordId: "",
    machineLog: [
      {
        type: "info",
        title: "System online",
        text: "Type a hidden word to force the portrait into a new stable state.",
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

      words.push({
        id,
        label: toLabel(id),
        category: category.slug,
        categoryLabel: category.label,
        accent: category.accent,
        promptDelta,
        mood,
        imagePath: `./assets/generated/${id}.png`,
        searchTokens: Array.from(new Set([normalizeToken(id), normalizeToken(toLabel(id)), ...aliases].filter(Boolean))),
        sortIndex: index,
      });
    });
  });

  return words;
}

function renderAll() {
  renderHero();
  renderStage();
  renderLog();
  renderHint();
  renderDetails();
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
}

function renderStage() {
  const word = getCurrentWord();
  if (!word) {
    els.stageCategory.textContent = "LOCKED STATE";
    els.stageTitle.textContent = "아직 아무 상태도 열리지 않았습니다";
    els.stageChip.textContent = "대기";
    els.stageChip.className = "status-chip";
    els.portraitImage.hidden = true;
    els.portraitPlaceholder.hidden = false;
    els.portraitStage.style.setProperty("--stage-accent", "#7ce0ff");
    return;
  }

  els.portraitStage.style.setProperty("--stage-accent", word.accent);
  els.stageCategory.textContent = word.categoryLabel.toUpperCase();
  els.stageTitle.textContent = word.label;
  els.stageChip.textContent = state.save.discoveredIds.includes(word.id) ? "해금됨" : "미해금";
  els.stageChip.className = `status-chip ${state.save.discoveredIds.includes(word.id) ? "is-active" : ""}`;
  els.portraitImage.src = `${word.imagePath}?ts=${Date.now()}`;
  els.portraitImage.alt = `${word.label} portrait`;
  els.portraitImage.hidden = false;
  els.portraitPlaceholder.hidden = true;
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
        <p>막히면 힌트 버튼을 눌러 카테고리와 글자 수를 확인하세요.</p>
      </div>
    `;
    return;
  }

  els.hintPanel.innerHTML = `
    <div class="hint-box" style="--hint-accent: ${escapeAttr(hintWord.accent)};">
      <p class="eyebrow eyebrow-inline">ACTIVE HINT</p>
      <strong>${escapeHtml(hintWord.categoryLabel)}</strong>
      <ul class="hint-list">
        <li>${hintWord.id.length} letters</li>
        <li>starts with ${escapeHtml(hintWord.id[0].toUpperCase())}</li>
        <li>mood: ${escapeHtml(hintWord.mood)}</li>
      </ul>
    </div>
  `;
}

function renderDetails() {
  const word = getSelectedArchiveWord() || getCurrentWord();
  if (!word) {
    els.detailWord.textContent = "-";
    els.detailCategory.textContent = "-";
    els.detailMood.textContent = "-";
    els.detailCue.textContent = "-";
    return;
  }

  els.detailWord.textContent = word.label;
  els.detailCategory.textContent = word.categoryLabel;
  els.detailMood.textContent = word.mood;
  els.detailCue.textContent = word.promptDelta;
}

function renderProgress() {
  const categories = state.catalog?.categories || [];
  let activeCategories = 0;

  els.categoryProgress.innerHTML = categories
    .map((category) => {
      const words = state.words.filter((word) => word.category === category.slug);
      const discovered = words.filter((word) => state.save.discoveredIds.includes(word.id)).length;
      if (discovered > 0) activeCategories += 1;
      const total = words.length || 1;
      const percent = Math.round((discovered / total) * 100);

      return `
        <article class="progress-node" style="--node-accent: ${escapeAttr(category.accent)};">
          <div class="progress-node-head">
            <strong>${escapeHtml(category.label)}</strong>
            <span>${discovered} / ${total}</span>
          </div>
          <div class="progress-bar">
            <span style="width: ${percent}%;"></span>
          </div>
        </article>
      `;
    })
    .join("");

  els.progressCaption.textContent = `${activeCategories} / ${categories.length} 카테고리 활성화`;
}

function renderArchive() {
  const discoveredWords = state.save.discoveredIds.map((id) => findWord(id)).filter(Boolean);

  els.archiveCaption.textContent = `${discoveredWords.length}개 해금`;

  if (!discoveredWords.length) {
    els.archiveGrid.innerHTML = `
      <div class="archive-empty">
        <strong>갤러리가 비어 있습니다</strong>
        <p>해금된 단어가 생기면 썸네일이 이곳에 차곡차곡 쌓입니다.</p>
      </div>
    `;
    return;
  }

  els.archiveGrid.innerHTML = discoveredWords
    .map((word) => {
      const selected = word.id === (state.save.selectedArchiveId || state.save.currentWordId);
      return `
        <button
          type="button"
          class="archive-card-item ${selected ? "is-selected" : ""}"
          data-word-id="${escapeAttr(word.id)}"
          style="--archive-accent: ${escapeAttr(word.accent)};"
        >
          <img src="${escapeAttr(word.imagePath)}?ts=${Date.now()}" alt="${escapeAttr(word.label)}" />
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

  if (!token) {
    pushLog("info", "Console waiting", "아무 입력도 들어오지 않았습니다. 단어를 하나 적어 넣어 주세요.");
    renderAll();
    return;
  }

  state.save.attempts += 1;
  const word = state.words.find((entry) => entry.searchTokens.includes(token));

  if (!word) {
    pushLog(
      "error",
      "No stable match",
      `"${rawValue}"는 현재 카탈로그에서 안정적인 상태를 만들지 못했습니다. 힌트를 써서 방향을 좁혀 보세요.`,
    );
    persistSave();
    renderAll();
    return;
  }

  const isNew = !state.save.discoveredIds.includes(word.id);
  const resolvedHint = state.save.hintWordId === word.id;

  if (isNew) {
    state.save.discoveredIds.push(word.id);
  }

  state.save.successfulAttempts += 1;
  state.save.currentWordId = word.id;
  state.save.selectedArchiveId = word.id;
  state.save.history = [word.id, ...state.save.history.filter((id) => id !== word.id)].slice(0, 12);
  if (resolvedHint) {
    state.save.hintWordId = "";
  }

  pushLog(
    "success",
    isNew ? `State unlocked: ${word.label}` : `State revisited: ${word.label}`,
    buildReaction(word, isNew, resolvedHint),
  );

  persistSave();
  renderAll();
}

function issueHint() {
  const undiscovered = state.words.filter((word) => !state.save.discoveredIds.includes(word.id));
  if (!undiscovered.length) {
    pushLog("info", "Archive complete", "모든 상태가 이미 해금되었습니다. 이제 갤러리를 다듬거나 새 카탈로그를 만들 차례입니다.");
    renderAll();
    return;
  }

  const currentHintStillLocked = undiscovered.find((word) => word.id === state.save.hintWordId);
  const hintWord = currentHintStillLocked || undiscovered[Math.floor(Math.random() * undiscovered.length)];

  state.save.hintWordId = hintWord.id;
  pushLog(
    "info",
    "Hint issued",
    `${hintWord.categoryLabel} 계열입니다. ${hintWord.id.length}글자이며 ${hintWord.id[0].toUpperCase()}로 시작합니다.`,
  );
  persistSave();
  renderAll();
}

function focusRandomDiscovered() {
  if (!state.save.discoveredIds.length) {
    pushLog("info", "Archive empty", "먼저 단어 하나를 맞혀서 첫 상태를 해금해 보세요.");
    renderAll();
    return;
  }

  const wordId = state.save.discoveredIds[Math.floor(Math.random() * state.save.discoveredIds.length)];
  state.save.currentWordId = wordId;
  state.save.selectedArchiveId = wordId;
  pushLog("info", "Archive jump", `${toLabel(wordId)} 상태로 화면을 전환했습니다.`);
  persistSave();
  renderAll();
}

function resetProgress() {
  const confirmed = window.confirm("해금 기록과 로그를 모두 초기화할까요?");
  if (!confirmed) return;
  state.save = createDefaultSave();
  persistSave();
  renderAll();
}

function buildReaction(word, isNew, resolvedHint) {
  const lead = CATEGORY_LINES[word.category] || "The portrait shifts and stabilizes.";
  const novelty = isNew
    ? "A new state has been added to the archive."
    : "The same state returns faster this time, like it remembers the path.";
  const hintLine = resolvedHint ? "The hinted pattern clicks into place immediately." : "";

  return `${lead} ${hintLine} ${novelty} ${word.promptDelta}. The room now feels ${word.mood}.`
    .replace(/\s+/g, " ")
    .trim();
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

function normalizeToken(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toLabel(value) {
  return String(value || "")
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((chunk) => chunk.slice(0, 1).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function renderFatalError(error) {
  document.body.innerHTML = `
    <main class="fatal-shell">
      <section class="fatal-card">
        <p class="eyebrow">BOOT ERROR</p>
        <h1>카탈로그를 불러오지 못했습니다.</h1>
        <p>${escapeHtml(error.message)}</p>
        <p class="tiny-caption">이 앱은 로컬 서버에서 여는 것을 전제로 합니다. <code>game_DEV/word-morph-lab</code>에서 <code>python -m http.server 4173</code> 후 접속해 주세요.</p>
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
