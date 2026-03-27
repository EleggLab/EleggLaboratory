const STORAGE_KEY = "text-choice-frame-studio-v1";

function createTemplateProject() {
  return {
    version: 1,
    meta: {
      title: "기본 텍스트 템플릿",
      author: "",
      start_node_id: "intro",
    },
    nodes: [
      {
        id: "intro",
        kind: "scene",
        title: "도입",
        speaker: "",
        text: "[도입] 지금 어디에 있고 무엇이 평소와 달라졌는지 적으세요.",
        writer_note: "배경 설명을 길게 쓰기보다 첫 장면의 변화만 바로 보여 주세요.",
        next: "incident",
        choices: [],
      },
      {
        id: "incident",
        kind: "scene",
        title: "사건",
        speaker: "",
        text: "[사건] 지금 바로 반응해야 하는 문제나 변화가 무엇인지 적으세요.",
        writer_note: "이 장면에서 독자가 처음으로 방향을 고르게 만드세요.",
        next: "",
        choices: [
          {
            id: "incident_to_clue",
            text: "상황을 더 파고든다",
            writer_note: "정보, 발견, 관찰로 이어지는 선택",
            next: "clue",
          },
          {
            id: "incident_to_pressure",
            text: "먼저 버틴다",
            writer_note: "위험이나 부담이 커지는 선택",
            next: "pressure",
          },
        ],
      },
      {
        id: "clue",
        kind: "scene",
        title: "단서",
        speaker: "",
        text: "[단서] 상황을 다시 보게 만드는 정보나 발견을 적으세요.",
        writer_note: "새로운 사실이 나오더라도 핵심 한 가지에만 집중하세요.",
        next: "decision",
        choices: [],
      },
      {
        id: "pressure",
        kind: "scene",
        title: "압박",
        speaker: "",
        text: "[압박] 시간이 부족하거나 위험이 커지는 이유를 적으세요.",
        writer_note: "서두르게 만드는 이유가 분명하면 다음 선택이 선명해집니다.",
        next: "decision",
        choices: [],
      },
      {
        id: "decision",
        kind: "scene",
        title: "결정",
        speaker: "",
        text: "[결정] 이제 무엇을 선택해야 하는지 한 문장으로 분명하게 적으세요.",
        writer_note: "엔딩으로 바로 연결되는 마지막 선택 장면입니다.",
        next: "",
        choices: [
          {
            id: "decision_to_ending_a",
            text: "정면으로 결정한다",
            writer_note: "얻는 것이 분명한 결말로 연결",
            next: "ending_a",
          },
          {
            id: "decision_to_ending_b",
            text: "다른 길을 택한다",
            writer_note: "남는 감정이 다른 결말로 연결",
            next: "ending_b",
          },
        ],
      },
      {
        id: "ending_a",
        kind: "ending",
        title: "엔딩 A",
        speaker: "",
        text: "[엔딩 A] 선택의 결과로 얻은 것과 남은 여운을 적으세요.",
        writer_note: "무엇이 달라졌는지, 무엇이 남았는지만 짧게 정리하세요.",
        next: "",
        choices: [],
      },
      {
        id: "ending_b",
        kind: "ending",
        title: "엔딩 B",
        speaker: "",
        text: "[엔딩 B] 다른 선택의 결과와 마지막 감정을 적으세요.",
        writer_note: "첫 엔딩과 결의 감정 차이가 보이도록 마무리하세요.",
        next: "",
        choices: [],
      },
    ],
  };
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function slugify(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function createId(base, fallback) {
  const value = slugify(base);
  if (value) return value;
  return `${fallback}-${Math.random().toString(36).slice(2, 7)}`;
}

function ensureUniqueId(existingIds, base, fallback) {
  const clean = createId(base, fallback);
  if (!existingIds.includes(clean)) return clean;
  let index = 2;
  while (existingIds.includes(`${clean}-${index}`)) {
    index += 1;
  }
  return `${clean}-${index}`;
}

function normalizeText(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    return String(value.ko || value.text || value.en || "");
  }
  return "";
}

function normalizeChoice(choice, index) {
  return {
    id: String(choice?.id || `choice-${index + 1}`),
    text: normalizeText(choice?.text || ""),
    writer_note: String(choice?.writer_note || ""),
    next: typeof choice?.next === "string" ? choice.next : "",
  };
}

function normalizeNode(node, index) {
  return {
    id: String(node?.id || `node-${index + 1}`),
    kind: node?.kind === "ending" ? "ending" : "scene",
    title: String(node?.title || `장면 ${index + 1}`),
    speaker: String(node?.speaker || ""),
    text: normalizeText(node?.text || ""),
    writer_note: String(node?.writer_note || ""),
    next: typeof node?.next === "string" ? node.next : "",
    choices: Array.isArray(node?.choices) ? node.choices.map(normalizeChoice) : [],
  };
}

function normalizeProject(raw) {
  const fallback = createTemplateProject();
  const root = raw?.project && typeof raw.project === "object" ? raw.project : raw;
  if (!root || typeof root !== "object") return deepClone(fallback);

  const nodes = Array.isArray(root.nodes) ? root.nodes.map(normalizeNode) : deepClone(fallback.nodes);
  const project = {
    version: 1,
    meta: {
      title: String(root?.meta?.title || fallback.meta.title),
      author: String(root?.meta?.author || ""),
      start_node_id: String(root?.meta?.start_node_id || ""),
    },
    nodes: nodes.length ? nodes : deepClone(fallback.nodes),
  };

  if (!project.meta.start_node_id || !project.nodes.some((node) => node.id === project.meta.start_node_id)) {
    project.meta.start_node_id = project.nodes[0]?.id || "";
  }

  project.nodes.forEach((node) => {
    if (node.kind === "ending") {
      node.next = "";
      node.choices = [];
    }
  });

  pruneProject(project);
  return project;
}

function serializeProject(project) {
  const normalized = normalizeProject(project);
  return {
    version: normalized.version,
    meta: {
      title: normalized.meta.title,
      author: normalized.meta.author,
      start_node_id: normalized.meta.start_node_id,
    },
    nodes: normalized.nodes.map((node) => ({
      id: node.id,
      kind: node.kind,
      title: node.title,
      speaker: node.speaker,
      text: node.text,
      writer_note: node.writer_note,
      next: node.next,
      choices: node.choices.map((choice) => ({
        id: choice.id,
        text: choice.text,
        writer_note: choice.writer_note,
        next: choice.next,
      })),
    })),
  };
}

function loadProject() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createTemplateProject();
    return normalizeProject(JSON.parse(raw));
  } catch (error) {
    console.warn("local project load failed", error);
    return createTemplateProject();
  }
}

function saveProject(project) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeProject(project)));
}

function downloadJson(data, filename) {
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function pruneProject(project) {
  const validNodeIds = new Set(project.nodes.map((node) => node.id));
  project.nodes.forEach((node) => {
    if (!validNodeIds.has(node.next)) node.next = "";
    node.choices = node.choices.map((choice) => ({
      id: choice.id,
      text: choice.text,
      writer_note: choice.writer_note,
      next: validNodeIds.has(choice.next) ? choice.next : "",
    }));
  });
}

const state = {
  project: loadProject(),
  ui: {
    selectedNodeId: "",
  },
  playtest: null,
};

state.ui.selectedNodeId = state.project.meta.start_node_id || state.project.nodes[0]?.id || "";
state.playtest = createPlaytestState(state.project);

const els = {
  projectTitle: document.getElementById("project-title"),
  projectAuthor: document.getElementById("project-author"),
  nodeList: document.getElementById("node-list"),
  sceneEditor: document.getElementById("scene-editor"),
  playtestPanel: document.getElementById("playtest-panel"),
  newProjectBtn: document.getElementById("new-project-btn"),
  importBtn: document.getElementById("import-btn"),
  exportBtn: document.getElementById("export-btn"),
  addSceneBtn: document.getElementById("add-scene-btn"),
  addEndingBtn: document.getElementById("add-ending-btn"),
  restartPlaytestBtn: document.getElementById("restart-playtest-btn"),
  importInput: document.getElementById("import-input"),
};

bindTopLevelEvents();
renderAll();

function bindTopLevelEvents() {
  els.newProjectBtn.addEventListener("click", () => {
    state.project = createTemplateProject();
    state.ui.selectedNodeId = state.project.meta.start_node_id;
    state.playtest = createPlaytestState(state.project);
    renderAll();
  });

  els.importBtn.addEventListener("click", () => {
    els.importInput.click();
  });

  els.importInput.addEventListener("change", handleImportFile);

  els.exportBtn.addEventListener("click", () => {
    const payload = serializeProject(state.project);
    const filenameBase = createId(state.project.meta.title || "text-choice-template", "text-choice-template");
    downloadJson(payload, `${filenameBase}.json`);
  });

  els.addSceneBtn.addEventListener("click", () => {
    const node = createNode("scene");
    state.project.nodes.push(node);
    state.ui.selectedNodeId = node.id;
    persistAndRender();
  });

  els.addEndingBtn.addEventListener("click", () => {
    const node = createNode("ending");
    state.project.nodes.push(node);
    state.ui.selectedNodeId = node.id;
    persistAndRender();
  });

  els.restartPlaytestBtn.addEventListener("click", () => {
    state.playtest = createPlaytestState(state.project);
    renderPlaytest();
  });
}

function handleImportFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  file
    .text()
    .then((text) => {
      const parsed = JSON.parse(text);
      state.project = normalizeProject(parsed);
      state.ui.selectedNodeId = state.project.meta.start_node_id || state.project.nodes[0]?.id || "";
      state.playtest = createPlaytestState(state.project);
      renderAll();
    })
    .catch((error) => {
      window.alert(`불러오기 실패: ${error.message}`);
    })
    .finally(() => {
      event.target.value = "";
    });
}

function persistAndRender() {
  pruneProject(state.project);
  saveProject(state.project);
  state.playtest = createPlaytestState(state.project);
  renderAll();
}

function renderAll() {
  if (!state.project.nodes.some((node) => node.id === state.ui.selectedNodeId)) {
    state.ui.selectedNodeId = state.project.meta.start_node_id || state.project.nodes[0]?.id || "";
  }
  renderProjectMeta();
  renderNodeList();
  renderSceneEditor();
  renderPlaytest();
  saveProject(state.project);
}

function renderProjectMeta() {
  els.projectTitle.value = state.project.meta.title || "";
  els.projectAuthor.value = state.project.meta.author || "";

  els.projectTitle.onchange = (event) => {
    state.project.meta.title = event.target.value;
    saveProject(state.project);
  };

  els.projectAuthor.onchange = (event) => {
    state.project.meta.author = event.target.value;
    saveProject(state.project);
  };
}

function renderNodeList() {
  if (!state.project.nodes.length) {
    els.nodeList.innerHTML = `<div class="empty-state">장면이 없습니다. 새 장면을 추가하세요.</div>`;
    return;
  }

  els.nodeList.innerHTML = state.project.nodes
    .map((node) => {
      const selected = node.id === state.ui.selectedNodeId;
      return `
        <article class="node-card ${selected ? "is-selected" : ""}" data-node-id="${escapeAttr(node.id)}">
          <button type="button">
            <div class="node-row">
              <strong>${escapeHtml(node.title || node.id)}</strong>
              <div class="button-row">
                ${node.id === state.project.meta.start_node_id ? `<span class="status-pill">시작</span>` : ""}
                <span class="kind-badge ${node.kind === "ending" ? "kind-ending" : ""}">${node.kind === "ending" ? "엔딩" : "장면"}</span>
              </div>
            </div>
            <p class="tiny-caption">${escapeHtml(node.id)}</p>
          </button>
        </article>
      `;
    })
    .join("");

  els.nodeList.querySelectorAll("[data-node-id]").forEach((item) => {
    item.addEventListener("click", () => {
      state.ui.selectedNodeId = item.dataset.nodeId;
      renderNodeList();
      renderSceneEditor();
    });
  });
}

function getSelectedNode() {
  return state.project.nodes.find((node) => node.id === state.ui.selectedNodeId);
}

function renderSceneEditor() {
  const node = getSelectedNode();
  if (!node) {
    els.sceneEditor.innerHTML = `<div class="empty-state">왼쪽에서 장면을 선택하세요.</div>`;
    return;
  }

  const nodeOptions = state.project.nodes
    .filter((item) => item.id !== node.id)
    .map(
      (item) =>
        `<option value="${escapeAttr(item.id)}" ${item.id === node.next ? "selected" : ""}>${escapeHtml(item.title)} (${escapeHtml(item.id)})</option>`,
    )
    .join("");

  els.sceneEditor.innerHTML = `
    <div class="editor-grid">
      <label class="field">
        <span>장면 ID</span>
        <input id="node-id" type="text" value="${escapeAttr(node.id)}" />
      </label>
      <label class="field">
        <span>유형</span>
        <select id="node-kind">
          <option value="scene" ${node.kind === "scene" ? "selected" : ""}>장면</option>
          <option value="ending" ${node.kind === "ending" ? "selected" : ""}>엔딩</option>
        </select>
      </label>
      <label class="field">
        <span>장면 제목</span>
        <input id="node-title" type="text" value="${escapeAttr(node.title)}" />
      </label>
      <label class="field">
        <span>화자</span>
        <input id="node-speaker" type="text" value="${escapeAttr(node.speaker)}" />
      </label>
      <label class="field field-wide">
        <span>본문</span>
        <textarea id="node-text" rows="10">${escapeHtml(node.text)}</textarea>
      </label>
      <label class="field field-wide">
        <span>작가 메모</span>
        <textarea id="node-note" rows="4">${escapeHtml(node.writer_note)}</textarea>
      </label>
      <label class="field ${node.kind === "ending" ? "field-wide" : ""}">
        <span>기본 다음 장면</span>
        <select id="node-next" ${node.kind === "ending" ? "disabled" : ""}>
          <option value="">직접 종료 / 선택지 사용</option>
          ${nodeOptions}
        </select>
      </label>
    </div>

    <div class="editor-toolbar">
      <button id="set-start-node-btn" class="btn btn-small" type="button">${node.id === state.project.meta.start_node_id ? "시작 장면" : "시작 장면으로 지정"}</button>
      <button id="add-choice-btn" class="btn btn-small" type="button" ${node.kind === "ending" ? "disabled" : ""}>선택지 추가</button>
      <button id="delete-node-btn" class="btn btn-small btn-danger" type="button">장면 삭제</button>
    </div>

    <h3 class="editor-section-title">선택지</h3>
    <div id="choice-stack" class="choice-stack">
      ${node.kind === "ending" ? `<div class="empty-state">엔딩은 선택지를 두지 않습니다.</div>` : renderChoiceStack(node)}
    </div>
  `;

  bindNodeEditorEvents(node);
}

function renderChoiceStack(node) {
  if (!node.choices.length) {
    return `<div class="empty-state">선택지가 없으면 기본 다음 장면만 사용해도 됩니다.</div>`;
  }

  return node.choices
    .map(
      (choice, index) => `
        <article class="choice-card" data-choice-index="${index}">
          <div class="choice-header">
            <div>
              <strong>${escapeHtml(choice.text || `선택지 ${index + 1}`)}</strong>
              <p class="tiny-caption">${escapeHtml(choice.id)}</p>
            </div>
            <button class="btn btn-small btn-danger" type="button" data-action="delete-choice">삭제</button>
          </div>
          <div class="choice-grid">
            <label class="field">
              <span>선택지 ID</span>
              <input data-field="id" type="text" value="${escapeAttr(choice.id)}" />
            </label>
            <label class="field">
              <span>다음 장면</span>
              <select data-field="next">
                <option value="">연결 없음</option>
                ${
                  state.project.nodes
                    .filter((item) => item.id !== node.id)
                    .map(
                      (item) =>
                        `<option value="${escapeAttr(item.id)}" ${item.id === choice.next ? "selected" : ""}>${escapeHtml(item.title)} (${escapeHtml(item.id)})</option>`,
                    )
                    .join("")
                }
              </select>
            </label>
            <label class="field field-wide">
              <span>선택지 문장</span>
              <textarea data-field="text" rows="3">${escapeHtml(choice.text)}</textarea>
            </label>
            <label class="field field-wide">
              <span>작가 메모</span>
              <textarea data-field="writer_note" rows="3">${escapeHtml(choice.writer_note)}</textarea>
            </label>
          </div>
        </article>
      `,
    )
    .join("");
}

function bindNodeEditorEvents(node) {
  const nodeIdInput = document.getElementById("node-id");
  const nodeKindInput = document.getElementById("node-kind");
  const nodeTitleInput = document.getElementById("node-title");
  const nodeSpeakerInput = document.getElementById("node-speaker");
  const nodeTextInput = document.getElementById("node-text");
  const nodeNoteInput = document.getElementById("node-note");
  const nodeNextInput = document.getElementById("node-next");
  const setStartNodeBtn = document.getElementById("set-start-node-btn");
  const addChoiceBtn = document.getElementById("add-choice-btn");
  const deleteNodeBtn = document.getElementById("delete-node-btn");

  nodeIdInput.addEventListener("change", (event) => {
    const nextId = createId(event.target.value, node.id);
    if (nextId === node.id) return;
    if (state.project.nodes.some((item) => item.id === nextId)) {
      window.alert("같은 장면 ID가 이미 있습니다.");
      event.target.value = node.id;
      return;
    }
    renameNode(node.id, nextId);
    state.ui.selectedNodeId = nextId;
    persistAndRender();
  });

  nodeKindInput.addEventListener("change", (event) => {
    node.kind = event.target.value === "ending" ? "ending" : "scene";
    if (node.kind === "ending") {
      node.next = "";
      node.choices = [];
    }
    persistAndRender();
  });

  nodeTitleInput.addEventListener("input", (event) => {
    node.title = event.target.value;
    saveProject(state.project);
    renderNodeList();
    if (state.playtest.currentNodeId === node.id) renderPlaytest();
  });

  nodeSpeakerInput.addEventListener("input", (event) => {
    node.speaker = event.target.value;
    saveProject(state.project);
    if (state.playtest.currentNodeId === node.id) renderPlaytest();
  });

  nodeTextInput.addEventListener("input", (event) => {
    node.text = event.target.value;
    saveProject(state.project);
    if (state.playtest.currentNodeId === node.id) renderPlaytest();
  });

  nodeNoteInput.addEventListener("input", (event) => {
    node.writer_note = event.target.value;
    saveProject(state.project);
  });

  nodeNextInput?.addEventListener("change", (event) => {
    node.next = event.target.value;
    persistAndRender();
  });

  setStartNodeBtn.addEventListener("click", () => {
    state.project.meta.start_node_id = node.id;
    persistAndRender();
  });

  addChoiceBtn?.addEventListener("click", () => {
    const choice = createChoice(node);
    node.choices.push(choice);
    renderSceneEditor();
    saveProject(state.project);
    if (state.playtest.currentNodeId === node.id) renderPlaytest();
    renderNodeList();
  });

  deleteNodeBtn.addEventListener("click", () => {
    if (state.project.nodes.length <= 1) {
      window.alert("최소 한 개의 장면은 남겨야 합니다.");
      return;
    }
    const nodeIndex = state.project.nodes.findIndex((item) => item.id === node.id);
    state.project.nodes.splice(nodeIndex, 1);
    if (state.project.meta.start_node_id === node.id) {
      state.project.meta.start_node_id = state.project.nodes[0]?.id || "";
    }
    pruneProject(state.project);
    state.ui.selectedNodeId = state.project.meta.start_node_id || state.project.nodes[0]?.id || "";
    persistAndRender();
  });

  els.sceneEditor.querySelectorAll("[data-choice-index]").forEach((choiceCard) => {
    const choiceIndex = Number(choiceCard.dataset.choiceIndex);
    const choice = node.choices[choiceIndex];
    if (!choice) return;

    choiceCard.querySelectorAll("input[data-field], select[data-field]").forEach((input) => {
      input.addEventListener("change", (event) => {
        const field = event.target.dataset.field;
        choice[field] = event.target.value;
        saveProject(state.project);
        if (state.playtest.currentNodeId === node.id) renderPlaytest();
        renderNodeList();
      });
    });

    choiceCard.querySelectorAll("textarea[data-field]").forEach((input) => {
      input.addEventListener("input", (event) => {
        const field = event.target.dataset.field;
        choice[field] = event.target.value;
        saveProject(state.project);
        if (state.playtest.currentNodeId === node.id) renderPlaytest();
      });
    });

    choiceCard.querySelector('[data-action="delete-choice"]').addEventListener("click", () => {
      node.choices.splice(choiceIndex, 1);
      renderSceneEditor();
      saveProject(state.project);
      renderNodeList();
      if (state.playtest.currentNodeId === node.id) renderPlaytest();
    });
  });
}

function renameNode(fromId, toId) {
  const node = state.project.nodes.find((item) => item.id === fromId);
  if (!node) return;
  node.id = toId;
  if (state.project.meta.start_node_id === fromId) {
    state.project.meta.start_node_id = toId;
  }
  state.project.nodes.forEach((item) => {
    if (item.next === fromId) item.next = toId;
    item.choices.forEach((choice) => {
      if (choice.next === fromId) choice.next = toId;
    });
  });
}

function createNode(kind) {
  const existingIds = state.project.nodes.map((item) => item.id);
  const id = ensureUniqueId(existingIds, kind === "ending" ? "ending" : "scene", "node");
  return {
    id,
    kind,
    title: kind === "ending" ? "새 엔딩" : "새 장면",
    speaker: "",
    text:
      kind === "ending"
        ? "[엔딩] 여기까지 왔을 때 어떤 장면으로 끝나는지 적으세요."
        : "[장면] 이 장면에서 무슨 일이 벌어지는지 적으세요.",
    writer_note:
      kind === "ending"
        ? "결말의 감정만 짧게 정리하세요."
        : "이 장면의 역할 하나만 먼저 적으세요.",
    next: "",
    choices: [],
  };
}

function createChoice(node) {
  return {
    id: ensureUniqueId(node.choices.map((choice) => choice.id), "choice", "choice"),
    text: "새 선택지",
    writer_note: "",
    next: "",
  };
}

function createPlaytestState(project) {
  return {
    currentNodeId: project.meta.start_node_id || project.nodes[0]?.id || "",
  };
}

function renderPlaytest() {
  const node = state.project.nodes.find((item) => item.id === state.playtest.currentNodeId);
  if (!node) {
    els.playtestPanel.innerHTML = `
      <div class="playtest-card-inner">
        <div class="empty-state">시작 장면을 찾을 수 없습니다.</div>
      </div>
    `;
    return;
  }

  const isEnding = node.kind === "ending" || (!node.choices.length && !node.next);
  const actionsHtml = isEnding
    ? `<button class="btn btn-strong playtest-choice" type="button" data-action="restart">처음부터</button>`
    : node.choices.length
      ? node.choices
          .map(
            (choice, index) => `
              <button class="btn playtest-choice" type="button" data-choice-index="${index}">
                ${escapeHtml(choice.text || `선택지 ${index + 1}`)}
              </button>
            `,
          )
          .join("")
      : `<button class="btn btn-strong playtest-choice" type="button" data-action="next">다음 장면</button>`;

  els.playtestPanel.innerHTML = `
    <div class="playtest-card-inner">
      <div class="playtest-head">
        <div>
          <span class="kind-badge ${node.kind === "ending" ? "kind-ending" : ""}">${node.kind === "ending" ? "엔딩" : "장면"}</span>
          <h3 class="playtest-title">${escapeHtml(node.title || node.id)}</h3>
        </div>
        <div class="tiny-caption">${escapeHtml(node.speaker || "화자 없음")}</div>
      </div>
      <div class="playtest-body">${escapeHtml(node.text || "")}</div>
      <div class="playtest-actions">${actionsHtml}</div>
    </div>
  `;

  els.playtestPanel.querySelectorAll("[data-choice-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const choice = node.choices[Number(button.dataset.choiceIndex)];
      if (!choice) return;
      advanceTo(choice.next);
    });
  });

  els.playtestPanel.querySelector('[data-action="next"]')?.addEventListener("click", () => {
    advanceTo(node.next);
  });

  els.playtestPanel.querySelector('[data-action="restart"]')?.addEventListener("click", () => {
    state.playtest = createPlaytestState(state.project);
    renderPlaytest();
  });
}

function advanceTo(nextNodeId) {
  if (!nextNodeId) {
    renderPlaytest();
    return;
  }
  state.playtest.currentNodeId = nextNodeId;
  renderPlaytest();
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
