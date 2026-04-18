const STORAGE_KEY = "text-choice-template-v3";
const MAX_VISIBLE_ISSUES = 6;

const dom = {
  newProjectBtn: document.querySelector("#new-project-btn"),
  importBtn: document.querySelector("#import-btn"),
  exportBtn: document.querySelector("#export-btn"),
  importInput: document.querySelector("#import-input"),
  addSceneBtn: document.querySelector("#add-scene-btn"),
  addEndingBtn: document.querySelector("#add-ending-btn"),
  restartPlaytestBtn: document.querySelector("#restart-playtest-btn"),
  projectTitle: document.querySelector("#project-title"),
  projectAuthor: document.querySelector("#project-author"),
  projectPremise: document.querySelector("#project-premise"),
  nodeSearch: document.querySelector("#node-search"),
  saveState: document.querySelector("#save-state"),
  projectSummary: document.querySelector("#project-summary"),
  projectOutline: document.querySelector("#project-outline"),
  storyMapSummary: document.querySelector("#story-map-summary"),
  storyMap: document.querySelector("#story-map"),
  editorSubtitle: document.querySelector("#editor-subtitle"),
  nodeList: document.querySelector("#node-list"),
  sceneEditor: document.querySelector("#scene-editor"),
  diagnosticsSummary: document.querySelector("#diagnostics-summary"),
  diagnosticsPanel: document.querySelector("#diagnostics-panel"),
  playSelectedBtn: document.querySelector("#play-selected-btn"),
  playtestSummary: document.querySelector("#playtest-summary"),
  playtestPanel: document.querySelector("#playtest-panel"),
};

const state = {
  project: null,
  selectedNodeId: "",
  playtest: {
    currentNodeId: "",
    originNodeId: "",
    history: [],
  },
  nodeFilter: "",
  saveTimer: null,
};

boot();

function boot() {
  state.project = loadStoredProject() || createTemplateProject();
  repairProject(state.project);
  state.selectedNodeId = state.project.meta.start_node_id;
  resetPlaytest();
  applyViewStateFromUrl();
  bindEvents();
  renderAll();
  updateDocumentTitle();
  setSaveState("Ready. Local autosave is on.", "save-state-wait");
}

function bindEvents() {
  dom.newProjectBtn.addEventListener("click", () => {
    state.project = createTemplateProject();
    state.selectedNodeId = state.project.meta.start_node_id;
    ensureSelectedNodeVisibleInFilter();
    resetPlaytest();
    renderAll();
    saveProject(true);
  });

  dom.importBtn.addEventListener("click", () => dom.importInput.click());
  dom.exportBtn.addEventListener("click", exportProject);
  dom.importInput.addEventListener("change", importProject);

  dom.addSceneBtn.addEventListener("click", () => insertNode(createNode("scene")));
  dom.addEndingBtn.addEventListener("click", () => insertNode(createNode("ending")));
  dom.restartPlaytestBtn.addEventListener("click", () => {
    resetPlaytest();
    renderPlaytest();
  });
  dom.playSelectedBtn.addEventListener("click", () => {
    startPlaytestFrom(state.selectedNodeId || state.project.meta.start_node_id);
  });

  dom.projectTitle.addEventListener("input", () => {
    state.project.meta.title = dom.projectTitle.value;
    saveProject(true);
  });
  dom.projectAuthor.addEventListener("input", () => {
    state.project.meta.author = dom.projectAuthor.value;
    saveProject(false);
  });
  dom.projectPremise.addEventListener("input", () => {
    state.project.meta.premise = dom.projectPremise.value;
    saveProject(false);
  });
  dom.nodeSearch.addEventListener("input", () => {
    state.nodeFilter = dom.nodeSearch.value.trim().toLowerCase();
    renderNodeList();
    renderStoryMap();
    refreshEditorFilterBanner();
    syncViewStateToUrl();
  });

  dom.nodeList.addEventListener("click", (event) => {
    const clearButton = event.target.closest("[data-clear-filter]");
    if (clearButton) {
      clearNodeFilter();
      return;
    }

    const button = event.target.closest("[data-node-id]");
    if (!button) return;
    selectNode(button.dataset.nodeId);
  });

  dom.projectOutline.addEventListener("click", (event) => {
    const button = event.target.closest("[data-node-id]");
    if (!button) return;
    selectNode(button.dataset.nodeId);
  });

  dom.storyMap.addEventListener("click", (event) => {
    const clearButton = event.target.closest("[data-clear-filter]");
    if (clearButton) {
      clearNodeFilter();
      return;
    }

    const playButton = event.target.closest("[data-map-play]");
    if (playButton) {
      startPlaytestFrom(playButton.dataset.mapPlay);
      return;
    }

    const button = event.target.closest("[data-node-id]");
    if (!button) return;
    selectNode(button.dataset.nodeId);
  });

  dom.diagnosticsPanel.addEventListener("click", (event) => {
    const routeButton = event.target.closest("[data-play-from][data-node-id]");
    if (routeButton) {
      selectNode(routeButton.dataset.nodeId);
      startPlaytestFrom(routeButton.dataset.playFrom);
      return;
    }

    const playButton = event.target.closest("[data-play-from]");
    if (playButton) {
      startPlaytestFrom(playButton.dataset.playFrom);
      return;
    }

    const button = event.target.closest("[data-node-id]");
    if (!button) return;
    selectNode(button.dataset.nodeId);
  });

  dom.sceneEditor.addEventListener("input", handleEditorInput);
  dom.sceneEditor.addEventListener("change", handleEditorInput);
  dom.sceneEditor.addEventListener("click", handleEditorClick);
  dom.playtestPanel.addEventListener("click", handlePlaytestClick);
}

function createTemplateProject() {
  return {
    version: 1,
    meta: {
      title: "Seven Beat Episode",
      author: "",
      premise: "Fill in the scene text, choices, and endings. The frame stays simple on purpose.",
      start_node_id: "intro",
    },
    nodes: [
      scene(
        "intro",
        "Intro",
        "[Hook] Show what starts slipping away if the player hesitates.\n\n[Mood] Let the opening promise the kind of pressure this episode will keep.",
        "Keep the first scene short. Curiosity should land before exposition does.",
        "incident",
      ),
      {
        id: "incident",
        kind: "scene",
        title: "Incident",
        speaker: "",
        text: "[Disruption] Write the event that breaks the normal rhythm.\n\n[Split] Make one option chase truth and the other protect something at risk.",
        writer_note: "The first branch should reveal two different instincts, not two versions of the same move.",
        next: "",
        choices: [
          choice("incident_to_clue", "Chase the hidden clue before it disappears.", "Truth-first branch.", "clue"),
          choice("incident_to_pressure", "Contain the damage before it spreads.", "Protection-first branch.", "pressure"),
        ],
      },
      scene(
        "clue",
        "Clue",
        "[Clue] Reveal the detail that makes the problem deeper, stranger, or more personal.",
        "One sharp clue is enough. Use it to change the player's understanding, not just add lore.",
        "decision",
      ),
      scene(
        "pressure",
        "Pressure",
        "[Pressure] Write what will be lost if the player waits any longer.",
        "This scene should make the final choice feel urgent, not merely procedural.",
        "decision",
      ),
      {
        id: "decision",
        kind: "scene",
        title: "Decision",
        speaker: "",
        text: "[Decision] Frame the final choice as two costs the player can understand immediately.",
        writer_note: "The endings should disagree in sacrifice, not just in flavor text.",
        next: "",
        choices: [
          choice("decision_to_ending_a", "Expose the truth and accept the fallout.", "Clarity-first ending.", "ending_a"),
          choice("decision_to_ending_b", "Shield what remains and live with the doubt.", "Protection-first ending.", "ending_b"),
        ],
      },
      ending(
        "ending_a",
        "Ending A",
        "[Ending A] Show what changes because the player chose revelation over safety.",
        "Let the player feel both the release and the damage it caused.",
      ),
      ending(
        "ending_b",
        "Ending B",
        "[Ending B] Show the quieter result of choosing protection over disclosure.",
        "Keep the tradeoff visible so restraint still feels like a real ending.",
      ),
    ],
  };
}

function scene(id, title, text, writerNote, next) {
  return {
    id,
    kind: "scene",
    title,
    speaker: "",
    text,
    writer_note: writerNote,
    next,
    choices: [],
  };
}

function ending(id, title, text, writerNote) {
  return {
    id,
    kind: "ending",
    title,
    speaker: "",
    text,
    writer_note: writerNote,
    next: "",
    choices: [],
  };
}

function choice(id, text, writerNote, next) {
  return {
    id,
    text,
    writer_note: writerNote,
    next,
  };
}

function createNode(kind) {
  const isEnding = kind === "ending";
  return {
    id: uniqueNodeId(isEnding ? "ending" : "scene"),
    kind: isEnding ? "ending" : "scene",
    title: isEnding ? "New Ending" : "New Scene",
    speaker: "",
    text: "",
    writer_note: "",
    next: "",
    choices: [],
  };
}

function loadStoredProject() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? sanitizeProject(JSON.parse(raw)) : null;
  } catch (error) {
    console.warn(error);
    return null;
  }
}

function saveProject(updateTitle) {
  repairProject(state.project);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeProject(state.project)));
    if (updateTitle) updateDocumentTitle();
    renderProjectSummary();
    renderPlaytest();
    setSaveState("Saved to this browser.", "save-state-live");
  } catch (error) {
    console.error(error);
    setSaveState("Save failed in this browser.", "save-state-warn");
  }
}

function updateDocumentTitle() {
  const title = (state.project.meta.title || "").trim();
  document.title = title ? `${title} - Text Choice Studio` : "Text Choice Studio";
}

function setSaveState(message, className) {
  if (state.saveTimer) window.clearTimeout(state.saveTimer);
  dom.saveState.textContent = message;
  dom.saveState.className = `card-note ${className}`;

  if (className !== "save-state-warn") {
    state.saveTimer = window.setTimeout(() => {
      dom.saveState.textContent = "Ready. Local autosave is on.";
      dom.saveState.className = "card-note save-state-wait";
    }, 1500);
  }
}

function sanitizeProject(input) {
  const sourceNodes = Array.isArray(input?.nodes)
    ? input.nodes
    : Array.isArray(input?.scenes)
      ? input.scenes
      : [];

  const project = {
    version: 1,
    meta: {
      title: normalizeText(input?.meta?.title ?? input?.title) || "Imported Project",
      author: normalizeText(input?.meta?.author ?? input?.author),
      premise: normalizeText(input?.meta?.premise ?? input?.premise ?? input?.pitch ?? input?.meta?.pitch),
      start_node_id: normalizeId(input?.meta?.start_node_id ?? input?.start_node_id),
    },
    nodes: sourceNodes.map((node, nodeIndex) => ({
      id: normalizeId(node?.id) || `scene-${nodeIndex + 1}`,
      kind: node?.kind === "ending" || node?.type === "ending" ? "ending" : "scene",
      title: normalizeText(node?.title ?? node?.name),
      speaker: normalizeText(node?.speaker),
      text: normalizeText(node?.text ?? node?.body ?? node?.content),
      writer_note: normalizeText(node?.writer_note ?? node?.writerNote ?? node?.note),
      next: normalizeId(node?.next),
      choices: Array.isArray(node?.choices)
        ? node.choices.map((item, choiceIndex) => ({
            id: normalizeId(item?.id) || `choice-${nodeIndex + 1}-${choiceIndex + 1}`,
            text: normalizeText(item?.text ?? item?.label),
            writer_note: normalizeText(item?.writer_note ?? item?.writerNote ?? item?.note),
            next: normalizeId(item?.next),
          }))
        : [],
    })),
  };

  repairProject(project);
  return project.nodes.length ? project : createTemplateProject();
}

function repairProject(project) {
  if (!project.meta || typeof project.meta !== "object") project.meta = {};
  if (!Array.isArray(project.nodes)) project.nodes = [];

  const seen = new Set();
  project.nodes = project.nodes.map((node, index) => {
    let id = normalizeId(node?.id) || `scene-${index + 1}`;
    while (seen.has(id)) id = `${id}-${index + 1}`;
    seen.add(id);

    const kind = node?.kind === "ending" ? "ending" : "scene";
    return {
      id,
      kind,
      title: normalizeText(node?.title),
      speaker: normalizeText(node?.speaker),
      text: normalizeText(node?.text),
      writer_note: normalizeText(node?.writer_note),
      next: kind === "ending" ? "" : normalizeId(node?.next),
      choices: kind === "ending" ? [] : normalizeChoices(node?.choices, id),
    };
  });

  if (!project.nodes.length) {
    const fresh = createTemplateProject();
    project.meta = { ...fresh.meta };
    project.nodes = fresh.nodes.map(cloneNode);
  }

  const validIds = new Set(project.nodes.map((node) => node.id));
  project.nodes.forEach((node) => {
    if (!validIds.has(node.next)) node.next = "";
    node.choices = node.choices.map((item, index) => ({
      id: normalizeId(item?.id) || `${node.id}-choice-${index + 1}`,
      text: normalizeText(item?.text),
      writer_note: normalizeText(item?.writer_note),
      next: validIds.has(item?.next) ? item.next : "",
    }));
  });

  project.meta.title = normalizeText(project.meta.title);
  project.meta.author = normalizeText(project.meta.author);
  project.meta.premise = normalizeText(project.meta.premise);
  project.meta.start_node_id = validIds.has(project.meta.start_node_id)
    ? project.meta.start_node_id
    : project.nodes[0].id;
}

function normalizeChoices(choices, nodeId) {
  if (!Array.isArray(choices)) return [];
  return choices.map((item, index) => ({
    id: normalizeId(item?.id) || `${nodeId}-choice-${index + 1}`,
    text: normalizeText(item?.text),
    writer_note: normalizeText(item?.writer_note),
    next: normalizeId(item?.next),
  }));
}

function serializeProject(project) {
  repairProject(project);
  return {
    version: 1,
    meta: {
      title: project.meta.title,
      author: project.meta.author,
      premise: project.meta.premise,
      start_node_id: project.meta.start_node_id,
    },
    nodes: project.nodes.map((node) => ({
      id: node.id,
      kind: node.kind,
      title: node.title,
      speaker: node.speaker,
      text: node.text,
      writer_note: node.writer_note,
      next: node.kind === "ending" ? "" : node.next,
      choices:
        node.kind === "ending"
          ? []
          : node.choices.map((item) => ({
              id: item.id,
              text: item.text,
              writer_note: item.writer_note,
              next: item.next,
            })),
    })),
  };
}

function normalizeText(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(normalizeText).filter(Boolean).join("\n");
  if (value && typeof value === "object") {
    if (typeof value.text === "string" && value.text.trim()) return value.text;
    if (typeof value.ko === "string" && value.ko.trim()) return value.ko;
    const firstText = Object.values(value).find((item) => typeof item === "string" && item.trim());
    if (typeof firstText === "string") return firstText;
  }
  return "";
}

function normalizeId(value) {
  return value ? String(value).trim() : "";
}

function uniqueNodeId(base) {
  const taken = new Set(state.project.nodes.map((node) => node.id));
  const root = slugify(base) || "scene";
  let id = root;
  let count = 2;
  while (taken.has(id)) {
    id = `${root}-${count}`;
    count += 1;
  }
  return id;
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function cloneNode(node) {
  return {
    id: node.id,
    kind: node.kind,
    title: node.title,
    speaker: node.speaker,
    text: node.text,
    writer_note: node.writer_note,
    next: node.next,
    choices: node.choices.map((item) => ({ ...item })),
  };
}

function applyViewStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const focus = params.get("focus");
  const origin = params.get("origin");
  const play = params.get("play");
  const trail = params.get("trail");
  const filter = params.get("filter");

  if (filter) {
    state.nodeFilter = filter.toLowerCase();
    if (dom.nodeSearch) dom.nodeSearch.value = filter;
  }

  if (findNode(focus)) {
    state.selectedNodeId = focus;
  }

  const resolvedOrigin = findNode(origin) ? origin : findNode(play) ? play : "";
  const resolvedPlay = findNode(play) ? play : resolvedOrigin;

  if (resolvedOrigin) {
    state.playtest.originNodeId = resolvedOrigin;
    state.playtest.currentNodeId = resolvedPlay;
    state.playtest.history = buildRestoredPlaytestHistory(resolvedOrigin, resolvedPlay, trail);
  }
}

function selectNode(nodeId) {
  state.selectedNodeId = nodeId;
  renderProjectOutline();
  renderNodeList();
  renderStoryMap();
  renderSceneEditor();
  renderDiagnostics();
  syncViewStateToUrl();
}

function startPlaytestFrom(nodeId) {
  const resolved = findNode(nodeId) ? nodeId : state.project.meta.start_node_id;
  state.playtest.originNodeId = resolved;
  state.playtest.currentNodeId = resolved;
  state.playtest.history = [createPlaytestHistoryStep(resolved, findNode(resolved)?.title || resolved)];
  renderPlaytest();
}

function syncViewStateToUrl() {
  const params = new URLSearchParams();

  if (state.selectedNodeId && findNode(state.selectedNodeId)) {
    params.set("focus", state.selectedNodeId);
  }

  if (state.playtest.originNodeId && findNode(state.playtest.originNodeId)) {
    params.set("origin", state.playtest.originNodeId);
  }

  if (state.playtest.currentNodeId && findNode(state.playtest.currentNodeId)) {
    params.set("play", state.playtest.currentNodeId);
  }

  const trail = serializePlaytestTrail();
  if (trail) {
    params.set("trail", trail);
  }

  if (state.nodeFilter) {
    params.set("filter", state.nodeFilter);
  }

  const query = params.toString();
  const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  window.history.replaceState({}, "", nextUrl);
}

function renderAll() {
  repairProject(state.project);
  renderProjectFields();
  renderProjectSummary();
  renderProjectOutline();
  renderNodeList();
  renderStoryMap();
  renderSceneEditor();
  renderDiagnostics();
  renderPlaytest();
}

function renderProjectFields() {
  dom.projectTitle.value = state.project.meta.title || "";
  dom.projectAuthor.value = state.project.meta.author || "";
  dom.projectPremise.value = state.project.meta.premise || "";
}

function renderProjectSummary() {
  const summary = summarizeProject();
  dom.projectSummary.textContent = [
    `${summary.sceneCount} scenes`,
    `${summary.endingCount} endings`,
    `${summary.choiceCount} choices`,
    `${summary.issueCount} issues`,
  ].join(" / ");
}

function renderProjectOutline() {
  const summary = summarizeProject();
  const reachableRate = state.project.nodes.length
    ? Math.round((summary.reachableCount / state.project.nodes.length) * 100)
    : 0;

  const items = [
    {
      label: "Start",
      value: state.project.meta.start_node_id,
      tone: "neutral",
    },
    {
      label: "Branches",
      value: `${summary.branchSceneCount} scene${summary.branchSceneCount === 1 ? "" : "s"}`,
      tone: summary.branchSceneCount ? "warm" : "neutral",
    },
    {
      label: "Reachable",
      value: `${reachableRate}%`,
      tone: reachableRate === 100 ? "good" : "warn",
    },
    {
      label: "Dead Ends",
      value: `${summary.deadEndCount}`,
      tone: summary.deadEndCount ? "warn" : "good",
    },
  ];

  dom.projectOutline.innerHTML = `
    <div class="outline-metrics">
      ${items
        .map(
          (item) => `
            <article class="outline-pill" data-tone="${item.tone}">
              <span>${escapeHtml(item.label)}</span>
              <strong>${escapeHtml(item.value)}</strong>
            </article>
          `,
        )
        .join("")}
    </div>
    <div class="story-strip">
      ${state.project.nodes
        .map((node, index) => {
          const isStart = node.id === state.project.meta.start_node_id;
          const isSelected = node.id === state.selectedNodeId;
          const classes = ["story-strip__node"];
          if (isStart) classes.push("is-start");
          if (isSelected) classes.push("is-selected");
          return `
            <button class="${classes.join(" ")}" type="button" data-node-id="${escapeHtml(node.id)}">
              <small>${index + 1}</small>
              <strong>${escapeHtml(node.title || node.id)}</strong>
            </button>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderStoryMap() {
  const filteredNodes = filteredProjectNodes();
  const depthMap = computeDepthMap();
  const selectedId = state.selectedNodeId;
  const columns = buildStoryColumns(filteredNodes, depthMap);

  dom.storyMapSummary.textContent = state.nodeFilter
    ? `${filteredNodes.length} match "${state.nodeFilter}" / ${state.project.nodes.length} total / selected ${selectedId || "none"}`
    : `${filteredNodes.length} visible / ${state.project.nodes.length} total / selected ${selectedId || "none"}`;

  if (!filteredNodes.length) {
    dom.storyMap.innerHTML = `
      <div class="empty-state">
        No node matches this filter.
        <div class="button-row">
          <button class="btn btn-small" type="button" data-clear-filter="true">Clear search</button>
        </div>
      </div>
    `;
    return;
  }

  dom.storyMap.innerHTML = `
    <div class="story-map-grid">
      ${columns
        .map(
          (column) => `
            <section class="story-column">
              <div class="story-column__head">
                <h3>${escapeHtml(column.label)}</h3>
                <span>${column.nodes.length}</span>
              </div>
              ${column.nodes
                .map((node) => {
                  const classes = ["map-card"];
                  if (node.id === state.selectedNodeId) classes.push("is-selected");
                  if (node.id === state.project.meta.start_node_id) classes.push("is-start");
                  if (!depthMap.has(node.id)) classes.push("is-unreachable");
                  const relation = nodeRelations(node.id);
                  return `
                    <article class="${classes.join(" ")}">
                      <button class="map-card__top" type="button" data-node-id="${escapeHtml(node.id)}">
                        <strong class="map-card__title">${escapeHtml(node.title || "Untitled node")}</strong>
                        <span class="kind-pill" data-kind="${escapeHtml(node.kind)}">${node.kind === "ending" ? "ending" : "scene"}</span>
                      </button>
                      <p class="map-card__preview">${escapeHtml(truncateText(node.text || node.writer_note || "", 108) || "No text yet.")}</p>
                      <div class="map-card__row">
                        <span class="map-chip">in ${relation.incoming.length}</span>
                        <span class="map-chip">out ${relation.outgoing.length}</span>
                        ${node.id === state.project.meta.start_node_id ? '<span class="tag-pill">start</span>' : ""}
                      </div>
                      <div class="map-card__meta">
                        <span>${escapeHtml(node.id)}</span>
                        <button class="btn btn-small" type="button" data-map-play="${escapeHtml(node.id)}">Play here</button>
                      </div>
                    </article>
                  `;
                })
                .join("")}
            </section>
          `,
        )
        .join("")}
    </div>
  `;
}

function buildStoryColumns(nodes, depthMap) {
  const buckets = new Map();
  nodes.forEach((node) => {
    const depth = depthMap.has(node.id) ? depthMap.get(node.id) : "parking";
    if (!buckets.has(depth)) buckets.set(depth, []);
    buckets.get(depth).push(node);
  });

  const orderedKeys = [...buckets.keys()].sort((left, right) => {
    if (left === "parking") return 1;
    if (right === "parking") return -1;
    return Number(left) - Number(right);
  });

  return orderedKeys.map((key) => ({
    label: key === "parking" ? "Parking / Unreachable" : `Depth ${Number(key) + 1}`,
    nodes: buckets.get(key),
  }));
}

function renderNodeList() {
  const issueMap = issueCountByNode();
  const filteredNodes = filteredProjectNodes();

  if (!filteredNodes.length) {
    dom.nodeList.innerHTML = `
      <div class="empty-state">
        No node matches this search.
        <div class="button-row">
          <button class="btn btn-small" type="button" data-clear-filter="true">Clear search</button>
        </div>
      </div>
    `;
    return;
  }

  dom.nodeList.innerHTML = filteredNodes
    .map((node) => {
      const classes = ["node-card"];
      if (node.id === state.selectedNodeId) classes.push("is-selected");

      const tags = [node.id];
      if (node.id === state.project.meta.start_node_id) tags.push("start");

      const issueTag = issueMap[node.id]
        ? `<span class="issue-pill">${issueMap[node.id]} issue${issueMap[node.id] > 1 ? "s" : ""}</span>`
        : "";
      const preview = truncateText(node.text || node.writer_note || "", 92);

      return `
        <button class="${classes.join(" ")}" type="button" data-node-id="${escapeHtml(node.id)}">
          <div class="node-card__top">
            <strong>${escapeHtml(node.title || "Untitled node")}</strong>
            <span class="kind-pill" data-kind="${escapeHtml(node.kind)}">${node.kind === "ending" ? "ending" : "scene"}</span>
          </div>
          <p class="node-card__preview">${escapeHtml(preview || "No text yet.")}</p>
          <div class="node-card__meta">
            <span>${escapeHtml(tags.join(" / "))}</span>
            ${issueTag}
          </div>
        </button>
      `;
    })
    .join("");
}

function filteredProjectNodes() {
  if (!state.nodeFilter) return [...state.project.nodes];
  return state.project.nodes.filter((node) => {
    const haystack = [node.id, node.title, node.text, node.writer_note, node.speaker].join(" ").toLowerCase();
    return haystack.includes(state.nodeFilter);
  });
}

function clearNodeFilter() {
  state.nodeFilter = "";
  dom.nodeSearch.value = "";
  renderNodeList();
  renderStoryMap();
  renderSceneEditor();
  syncViewStateToUrl();
}

function ensureSelectedNodeVisibleInFilter() {
  if (!state.nodeFilter) return;
  const node = selectedNode();
  if (!node) return;
  if (filteredProjectNodes().some((item) => item.id === node.id)) return;
  state.nodeFilter = "";
  dom.nodeSearch.value = "";
}

function renderSceneEditor() {
  const node = selectedNode();
  if (!node) {
    dom.editorSubtitle.textContent = "Pick a node from the left.";
    dom.sceneEditor.innerHTML =
      '<div class="empty-state">Select a scene or ending to edit its text, note, routing, and choices.</div>';
    return;
  }

  const index = state.project.nodes.findIndex((item) => item.id === node.id) + 1;
  dom.editorSubtitle.textContent = `${index} of ${state.project.nodes.length} / ${node.kind} / ${node.id}`;
  const nodeIssues = collectIssues().filter((item) => item.nodeId === node.id);
  const nodeIssueBlock = nodeIssues.length
    ? `
      <section class="editor-issues">
        <h3>Current node issues</h3>
        <ul class="issue-list">
          ${nodeIssues.map((item) => `<li>${escapeHtml(item.message)}</li>`).join("")}
        </ul>
      </section>
    `
    : `
      <section class="editor-issues editor-issues--clean">
        <h3>Current node issues</h3>
        <p class="issue-empty">This node is structurally clean right now.</p>
      </section>
    `;

  const choiceGuidance = node.kind === "scene" ? renderChoiceGuidance(node) : "";
  const filterBanner = renderEditorFilterBanner(node);

  const flowSection =
    node.kind === "ending"
      ? '<div class="ending-note">Endings stop the route here. They do not show direct next links or choice blocks.</div>'
      : `
        <section class="route-block">
          <div class="block-head">
            <h3>Route Controls</h3>
          </div>
          <div class="route-grid">
            <label class="field">
              <span>Direct next</span>
              <select data-node-field="next">${nodeOptions(node.id, node.next)}</select>
            </label>
            <div class="field">
              <span>Quick actions</span>
              <div class="button-row">
                <button class="btn btn-small" type="button" data-action="play-here">Play from here</button>
                <button class="btn btn-small" type="button" data-action="open-start">Open start</button>
              </div>
            </div>
          </div>
          <p class="inline-note">If a scene has both a direct next node and choices, the route console will flag it.</p>
        </section>
        <section class="choices-block">
          <div class="block-head">
            <h3>Choices</h3>
            <button class="btn btn-small" type="button" data-action="add-choice">Add choice</button>
          </div>
          ${choiceGuidance}
          <div class="choices-stack">
            ${
              node.choices.length
                ? node.choices
                    .map(
                      (item, index) => `
                        <article class="choice-card" data-choice-id="${escapeHtml(item.id)}">
                          <div class="choice-card__head">
                            <strong>Choice ${index + 1}</strong>
                            <button class="btn btn-small btn-muted" type="button" data-action="delete-choice">Delete</button>
                          </div>
                          <div class="choice-grid">
                            <label class="field field-wide">
                              <span>Choice text</span>
                              <textarea rows="3" data-choice-field="text">${escapeHtml(item.text)}</textarea>
                            </label>
                            <label class="field field-wide">
                              <span>Writer note</span>
                              <textarea rows="2" data-choice-field="writer_note">${escapeHtml(item.writer_note)}</textarea>
                            </label>
                            <label class="field field-wide">
                              <span>Next node</span>
                              <select data-choice-field="next">${nodeOptions(node.id, item.next)}</select>
                            </label>
                          </div>
                        </article>
                      `,
                    )
                    .join("")
                : '<div class="empty-state">This scene currently flows forward without a branch.</div>'
            }
          </div>
        </section>
      `;

  dom.sceneEditor.innerHTML = `
    <div class="editor-shell">
      <div class="editor-toolbar">
        <div class="editor-toolbar__meta">
          <span class="kind-pill" data-kind="${escapeHtml(node.kind)}">${node.kind === "ending" ? "ending" : "scene"}</span>
          <span class="mono">ID ${escapeHtml(node.id)}</span>
        </div>
        <div class="button-row">
          <button class="btn btn-small" type="button" data-action="set-start">Set start</button>
          <button class="btn btn-small" type="button" data-action="move-up">Move up</button>
          <button class="btn btn-small" type="button" data-action="move-down">Move down</button>
          <button class="btn btn-small" type="button" data-action="duplicate-node">Duplicate</button>
          <button class="btn btn-small btn-muted" type="button" data-action="delete-node">Delete</button>
        </div>
      </div>

      <div id="editor-filter-banner-slot">${filterBanner}</div>
      ${nodeIssueBlock}

      <div class="field-grid">
        <label class="field">
          <span>Title</span>
          <input type="text" data-node-field="title" value="${escapeHtml(node.title)}" />
        </label>
        <label class="field">
          <span>Speaker</span>
          <input type="text" data-node-field="speaker" value="${escapeHtml(node.speaker)}" />
        </label>
      </div>

      <div class="editor-split">
        <section class="editor-panel script-textarea">
          <h3>Script</h3>
          <label class="field">
            <span>Player-facing text</span>
            <textarea rows="13" data-node-field="text">${escapeHtml(node.text)}</textarea>
          </label>
        </section>
        <section class="editor-panel note-textarea">
          <h3>Writer Note</h3>
          <label class="field">
            <span>Private note for revision, pacing, or intent</span>
            <textarea rows="13" data-node-field="writer_note">${escapeHtml(node.writer_note)}</textarea>
          </label>
        </section>
      </div>

      ${renderLinkedTargets(node)}
      ${flowSection}
    </div>
  `;
}

function renderEditorFilterBanner(node) {
  if (!state.nodeFilter) return "";
  const visibleNodes = filteredProjectNodes();
  if (visibleNodes.some((item) => item.id === node.id)) return "";

  return `
    <section class="filter-banner">
      <div>
        <h3>Current node is hidden by the active search</h3>
        <p>
          You are still editing <strong>${escapeHtml(node.title || node.id)}</strong>, but the left-side results only show matches for
          "${escapeHtml(state.nodeFilter)}".
        </p>
      </div>
      <div class="button-row">
        ${
          visibleNodes.length
            ? '<button class="btn btn-small" type="button" data-action="show-first-match">Open first visible result</button>'
            : ""
        }
        <button class="btn btn-small btn-muted" type="button" data-action="clear-filter">Clear search</button>
      </div>
    </section>
  `;
}

function refreshEditorFilterBanner() {
  const node = selectedNode();
  const slot = dom.sceneEditor.querySelector("#editor-filter-banner-slot");
  if (!node || !slot) return;
  slot.innerHTML = renderEditorFilterBanner(node);
}

function renderChoiceGuidance(node) {
  const report = analyzeChoiceExperience(node);
  if (!report) return "";

  return `
    <section class="choice-guidance" data-tone="${escapeHtml(report.tone)}">
      <div class="block-head">
        <h3>Choice tension check</h3>
        <span class="guidance-badge">${escapeHtml(report.label)}</span>
      </div>
      <ul class="issue-list">
        ${report.notes.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </section>
  `;
}

function renderLinkedTargets(node) {
  const links = [];
  if (node.next) {
    links.push({ label: "Direct next", target: node.next });
  }
  node.choices.forEach((item, index) => {
    if (!item.next) return;
    links.push({ label: item.text || `Choice ${index + 1}`, target: item.next });
  });

  if (!links.length) {
    return `
      <section class="linked-targets">
        <h3>Linked targets</h3>
        <p class="card-note">Connect this node to another scene or ending to jump quickly while editing.</p>
      </section>
    `;
  }

  return `
    <section class="linked-targets">
      <div class="block-head">
        <h3>Linked targets</h3>
      </div>
      <div class="jump-row">
        ${links
          .map(
            (item) => `
              <button class="jump-pill" type="button" data-node-id="${escapeHtml(item.target)}">
                <span>${escapeHtml(item.label)}</span>
                <strong>${escapeHtml(findNode(item.target)?.title || item.target)}</strong>
              </button>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderDiagnostics() {
  const summary = summarizeProject();
  const selected = selectedNode() || findNode(state.project.meta.start_node_id);
  const allIssues = collectIssues();
  const selectedRelations = selected ? nodeRelations(selected.id) : { incoming: [], outgoing: [] };
  const endingRoutes = selected ? enumerateEndingRoutes(selected.id, 5) : [];

  dom.diagnosticsSummary.textContent = [
    `${allIssues.length} issues`,
    `${summary.deadEndCount} dead ends`,
    `${summary.branchSceneCount} branches`,
  ].join(" / ");

  dom.diagnosticsPanel.innerHTML = `
    <div class="diagnostics-shell">
      <section class="diagnostic-block">
        <h3>Issue Browser</h3>
        <div class="issue-browser">
          ${
            allIssues.length
              ? allIssues
                  .slice(0, 8)
                  .map((issue) => `
                    <button class="issue-jump" type="button" data-node-id="${escapeHtml(issue.nodeId || state.project.meta.start_node_id)}">
                      <span>${escapeHtml(issue.nodeId || "project")}</span>
                      <strong>${escapeHtml(issue.message)}</strong>
                    </button>
                  `)
                  .join("")
              : '<p class="issue-empty">No blocking structure issue is visible right now.</p>'
          }
        </div>
      </section>

      <section class="diagnostic-block">
        <h3>Selected Connections</h3>
        <div class="linked-list">
          <article class="linked-pill">
            <span>Incoming</span>
            <strong>${selectedRelations.incoming.length}</strong>
          </article>
          <article class="linked-pill">
            <span>Outgoing</span>
            <strong>${selectedRelations.outgoing.length}</strong>
          </article>
          <article class="linked-pill">
            <span>Current node</span>
            <strong>${escapeHtml(selected?.title || "None")}</strong>
          </article>
        </div>
      </section>

      <section class="diagnostic-block">
        <h3>Jump To Linked Nodes</h3>
        <div class="jump-row">
          ${
            selectedRelations.outgoing.length
              ? selectedRelations.outgoing
                  .map((item) => `
                    <button class="jump-pill" type="button" data-node-id="${escapeHtml(item.id)}">
                      <span>${escapeHtml(item.label)}</span>
                      <strong>${escapeHtml(findNode(item.id)?.title || item.id)}</strong>
                    </button>
                  `)
                  .join("")
              : '<p class="card-note">No outgoing links from the current node.</p>'
          }
        </div>
      </section>

      <section class="diagnostic-block">
        <h3>Ending Routes From Current Node</h3>
        <div class="route-list">
          ${
            endingRoutes.length
              ? endingRoutes
                  .map((route) => `
                    <button class="route-pill" type="button" data-node-id="${escapeHtml(route.lastNodeId)}" data-play-from="${escapeHtml(route.path[0])}">
                      <span>${escapeHtml(route.path.join(" -> "))}</span>
                      <strong>${escapeHtml(route.label)}</strong>
                    </button>
                  `)
                  .join("")
              : '<p class="card-note">No complete ending route is reachable from the current node yet.</p>'
          }
        </div>
      </section>
    </div>
  `;
}

function renderPlaytest() {
  const summary = summarizeProject();
  dom.playtestSummary.textContent = `${summary.reachableCount} reachable / ${summary.endingCount} endings / origin ${state.playtest.originNodeId || state.project.meta.start_node_id}`;

  const issues = collectIssues();
  const visibleIssues = issues.slice(0, MAX_VISIBLE_ISSUES);
  const hiddenCount = Math.max(0, issues.length - visibleIssues.length);
  const node = findNode(state.playtest.currentNodeId) || findNode(state.project.meta.start_node_id);
  const selected = selectedNode();
  const depthMap = computeDepthMap();

  const issueBlock = issues.length
    ? `
      <section class="issue-block">
        <h3>Author checks</h3>
        <ul class="issue-list">
          ${visibleIssues.map((item) => `<li>${escapeHtml(item.message)}</li>`).join("")}
          ${hiddenCount ? `<li>...and ${hiddenCount} more</li>` : ""}
        </ul>
      </section>
    `
    : `
      <section class="issue-block">
        <h3>Author checks</h3>
        <p class="issue-empty">No blocking structure issue is visible right now.</p>
      </section>
    `;

  const metrics = `
    <div class="metric-row">
      <span class="metric-pill">${summary.sceneCount} scenes</span>
      <span class="metric-pill">${summary.endingCount} endings</span>
      <span class="metric-pill">${summary.choiceCount} choices</span>
      <span class="metric-pill">${summary.reachableCount} reachable</span>
    </div>
  `;

  if (!node) {
    dom.playtestPanel.innerHTML = `
      <div class="playtest-shell">
        ${metrics}
        ${issueBlock}
        <div class="empty-state">The start node is missing.</div>
      </div>
    `;
    return;
  }

  const depth = depthMap.get(node.id);
  const pulseText = describePlaytestPulse(node);
  const stepCount = Math.max(0, state.playtest.history.length - 1);
  const progressBlock = `
    <div class="playtest-progress">
      <span class="progress-pill">${typeof depth === "number" ? `Beat ${depth + 1}` : "Off route"}</span>
      <span class="progress-pill">${node.kind === "ending" ? "Ending beat" : node.choices.length ? "Decision beat" : "Forward beat"}</span>
      <span class="progress-pill">${stepCount} step${stepCount === 1 ? "" : "s"} taken</span>
    </div>
    <p class="playtest-pulse">${escapeHtml(pulseText)}</p>
  `;
  const contextBanner =
    selected && selected.id !== node.id
      ? `
        <section class="playtest-context-banner">
          <div>
            <h3>Compose and Play Mode are looking at different nodes</h3>
            <p>
              Compose is focused on <strong>${escapeHtml(selected.title || selected.id)}</strong>,
              while Play Mode is currently on <strong>${escapeHtml(node.title || node.id)}</strong>.
            </p>
          </div>
          <div class="button-row">
            <button class="btn btn-small" type="button" data-playtest-from-selected="true">Play selected node</button>
            <button class="btn btn-small btn-muted" type="button" data-playtest-focus="true">Open play node in editor</button>
          </div>
        </section>
      `
      : "";

  const buttons = [];
  if (node.kind === "scene" && node.choices.length) {
    node.choices.forEach((item, index) => {
      buttons.push(`
        <button
          class="btn"
          type="button"
          data-playtest-target="${escapeHtml(item.next)}"
          data-playtest-label="${escapeHtml(item.text || `Choice ${index + 1}`)}"
        >
          ${escapeHtml(item.text || `Choice ${index + 1}`)}
        </button>
      `);
    });
  } else if (node.kind === "scene" && node.next) {
    buttons.push(`
      <button
        class="btn"
        type="button"
        data-playtest-target="${escapeHtml(node.next)}"
        data-playtest-label="Continue"
      >
        Continue
      </button>
    `);
  } else if (node.kind === "ending") {
    buttons.push(`
      <button
        class="btn btn-strong"
        type="button"
        data-playtest-target="${escapeHtml(state.project.meta.start_node_id)}"
        data-playtest-label="Restart"
      >
        Restart from start
      </button>
    `);
  }

  dom.playtestPanel.innerHTML = `
    <div class="playtest-shell">
      ${metrics}
      ${contextBanner}
      <article class="playtest-node">
        <h3>${escapeHtml(node.title || "Untitled node")}</h3>
        ${progressBlock}
        ${node.speaker ? `<p class="playtest-node__speaker">${escapeHtml(node.speaker)}</p>` : ""}
        <p class="playtest-node__text">${escapeHtml(node.text || "This node is empty.")}</p>
      </article>
      <div class="button-row">
        ${state.playtest.history.length > 1 ? '<button class="btn btn-small" type="button" data-playtest-back="true">Back one beat</button>' : ""}
        <button class="btn btn-small" type="button" data-playtest-focus="true">Open this node in editor</button>
        <button class="btn btn-small" type="button" data-playtest-target="${escapeHtml(state.project.meta.start_node_id)}" data-playtest-label="Start node">Jump to start node</button>
      </div>
      <div class="playtest-actions">
        ${buttons.join("") || '<div class="empty-state">No next route is connected yet.</div>'}
      </div>
      <div class="history-row">
        ${state.playtest.history
          .map((item, index) => `
            <button
              class="history-pill ${index === state.playtest.history.length - 1 ? "is-current" : ""}"
              type="button"
              data-playtest-history-index="${index}"
            >
              ${escapeHtml(item.label)}
            </button>
          `)
          .join("")}
      </div>
      ${issueBlock}
    </div>
  `;
  syncViewStateToUrl();
}

function summarizeProject() {
  const reachable = reachableIds();
  const issues = collectIssues();
  return {
    sceneCount: state.project.nodes.filter((node) => node.kind === "scene").length,
    endingCount: state.project.nodes.filter((node) => node.kind === "ending").length,
    choiceCount: state.project.nodes.reduce((count, node) => count + node.choices.length, 0),
    branchSceneCount: state.project.nodes.filter((node) => node.kind === "scene" && node.choices.length > 0).length,
    deadEndCount: state.project.nodes.filter(
      (node) => node.kind === "scene" && !node.next && node.choices.length === 0,
    ).length,
    reachableCount: reachable.size,
    issueCount: issues.length,
  };
}

function computeDepthMap() {
  const depths = new Map();
  const queue = [{ id: state.project.meta.start_node_id, depth: 0 }];

  while (queue.length) {
    const current = queue.shift();
    if (!current?.id || depths.has(current.id)) continue;
    const node = findNode(current.id);
    if (!node) continue;
    depths.set(current.id, current.depth);

    if (node.next) queue.push({ id: node.next, depth: current.depth + 1 });
    node.choices.forEach((item) => {
      if (item.next) queue.push({ id: item.next, depth: current.depth + 1 });
    });
  }

  return depths;
}

function nodeRelations(nodeId) {
  const incoming = [];
  const outgoing = [];

  state.project.nodes.forEach((node) => {
    if (node.next === nodeId) {
      incoming.push({ id: node.id, label: "Direct next" });
    }
    node.choices.forEach((item, index) => {
      if (item.next === nodeId) {
        incoming.push({ id: node.id, label: item.text || `Choice ${index + 1}` });
      }
    });
  });

  const node = findNode(nodeId);
  if (node?.next) outgoing.push({ id: node.next, label: "Direct next" });
  node?.choices.forEach((item, index) => {
    if (item.next) outgoing.push({ id: item.next, label: item.text || `Choice ${index + 1}` });
  });

  return { incoming, outgoing };
}

function enumerateEndingRoutes(startId, limit) {
  const routes = [];

  function walk(nodeId, path, seen) {
    if (!nodeId || routes.length >= limit || seen.has(nodeId)) return;
    const node = findNode(nodeId);
    if (!node) return;

    const nextPath = [...path, node.id];
    const nextSeen = new Set(seen);
    nextSeen.add(node.id);

    if (node.kind === "ending") {
      routes.push({
        label: node.title || node.id,
        path: nextPath,
        lastNodeId: node.id,
      });
      return;
    }

    if (node.next) walk(node.next, nextPath, nextSeen);
    node.choices.forEach((item) => {
      if (routes.length < limit && item.next) walk(item.next, nextPath, nextSeen);
    });
  }

  walk(startId, [], new Set());
  return routes;
}

function collectIssues() {
  const issues = [];
  const ids = new Set(state.project.nodes.map((node) => node.id));
  const reachable = reachableIds();

  if (!ids.has(state.project.meta.start_node_id)) {
    issues.push({ nodeId: "", message: "The start node does not exist." });
  }

  if (!state.project.nodes.some((node) => node.kind === "ending")) {
    issues.push({ nodeId: "", message: "Add at least one ending node." });
  }

  state.project.nodes.forEach((node) => {
    if (!node.title.trim()) issues.push({ nodeId: node.id, message: `${node.id}: title is empty.` });
    if (!node.text.trim()) issues.push({ nodeId: node.id, message: `${node.id}: text is empty.` });
    if (!reachable.has(node.id)) issues.push({ nodeId: node.id, message: `${node.id}: unreachable from the start node.` });

    if (node.kind === "scene") {
      if (!node.next && node.choices.length === 0) {
        issues.push({ nodeId: node.id, message: `${node.id}: no direct next node and no choices.` });
      }
      if (node.next && node.choices.length) {
        issues.push({ nodeId: node.id, message: `${node.id}: direct next and choices are both set.` });
      }
      if (node.next && !ids.has(node.next)) {
        issues.push({ nodeId: node.id, message: `${node.id}: direct next points to a missing node.` });
      }
      node.choices.forEach((item, index) => {
        if (!item.text.trim()) {
          issues.push({ nodeId: node.id, message: `${node.id}: choice ${index + 1} text is empty.` });
        }
        if (!item.next.trim()) {
          issues.push({ nodeId: node.id, message: `${node.id}: choice ${index + 1} has no next node.` });
        }
        if (item.next && !ids.has(item.next)) {
          issues.push({ nodeId: node.id, message: `${node.id}: choice ${index + 1} points to a missing node.` });
        }
      });
    }
  });

  return issues;
}

function analyzeChoiceExperience(node) {
  if (!node || node.kind !== "scene") return null;

  if (!node.choices.length) {
    return {
      tone: node.next ? "steady" : "warn",
      label: node.next ? "Linear beat" : "No route yet",
      notes: [
        node.next
          ? "This scene currently rewards momentum over deliberation. Keep it linear only if that pace is intentional."
          : "This scene has no playable route yet. Add a direct next node or at least two meaningful choices.",
      ],
    };
  }

  const notes = [];
  const filledChoices = node.choices.filter((item) => item.text.trim());
  const normalizedTexts = filledChoices.map((item) => normalizeChoiceText(item.text));
  const uniqueTexts = new Set(normalizedTexts.filter(Boolean));
  const routedChoices = node.choices.filter((item) => item.next.trim());
  const uniqueTargets = new Set(routedChoices.map((item) => item.next.trim()));
  const openingWords = normalizedTexts.map((text) => text.split(/\s+/)[0]).filter(Boolean);

  if (node.choices.length === 1) {
    notes.push("One visible choice rarely feels like a real decision. Add a second pull or convert this beat to a direct next route.");
  }

  if (filledChoices.length >= 2 && uniqueTexts.size < filledChoices.length) {
    notes.push("Some choice lines read almost the same. Push each option toward a different instinct or value.");
  }

  if (routedChoices.length >= 2 && uniqueTargets.size === 1) {
    notes.push("Multiple choices land on the same next node, so the branch may feel cosmetic unless the following text reacts to the choice.");
  }

  if (openingWords.length >= 2 && new Set(openingWords).size === 1) {
    notes.push("Most choices begin with the same action word. Different verbs usually make the contrast clearer on first read.");
  }

  if (!notes.length) {
    notes.push("These options currently point toward different actions or costs. Keep the scene text reinforcing why each path matters.");
  }

  const tone = notes.length === 1 && notes[0].startsWith("These options currently")
    ? "good"
    : notes.some((item) => item.includes("rarely feels") || item.includes("cosmetic"))
      ? "warn"
      : "warm";

  return {
    tone,
    label: tone === "good" ? "Distinct pull" : tone === "warn" ? "Needs contrast" : "Refine contrast",
    notes,
  };
}

function normalizeChoiceText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function describePlaytestPulse(node) {
  if (!node) return "The route cannot start until a valid node is selected.";
  if (node.kind === "ending") {
    return "This route has landed. Check whether the emotional cost feels different enough before restarting.";
  }
  if (node.choices.length >= 2) {
    return "A real choice lives here. The player should feel two different costs before picking one.";
  }
  if (node.next) {
    return "This beat is carrying momentum forward. The next click should feel inevitable, not arbitrary.";
  }
  return "This beat currently stalls the route. Add a next step so the player is not stranded here.";
}

function createPlaytestHistoryStep(nodeId, label) {
  return {
    nodeId,
    label: label || nodeId,
  };
}

function serializePlaytestTrail() {
  const ids = state.playtest.history
    .map((item) => item?.nodeId)
    .filter((id) => findNode(id));
  return ids.length ? ids.join(",") : "";
}

function resolveHistoryIds(originId, currentId, trail) {
  const ids = [];

  if (trail) {
    trail
      .split(",")
      .map((item) => item.trim())
      .forEach((id) => {
        if (!id || !findNode(id)) return;
        ids.push(id);
      });
  }

  if (originId && (!ids.length || ids[0] !== originId)) {
    ids.unshift(originId);
  }

  if (currentId && ids[ids.length - 1] !== currentId && findNode(currentId)) {
    ids.push(currentId);
  }

  return ids;
}

function buildRestoredPlaytestHistory(originId, currentId, trail) {
  const ids = resolveHistoryIds(originId, currentId, trail);
  if (!ids.length) {
    return [createPlaytestHistoryStep(originId, findNode(originId)?.title || originId)];
  }

  return buildRestoredPlaytestHistoryFromIds(ids);
}

function buildRestoredPlaytestHistoryFromIds(ids) {
  return ids.map((id) => createPlaytestHistoryStep(id, findNode(id)?.title || id));
}

function issueCountByNode() {
  return collectIssues().reduce((acc, item) => {
    if (!item.nodeId) return acc;
    acc[item.nodeId] = (acc[item.nodeId] || 0) + 1;
    return acc;
  }, {});
}

function reachableIds() {
  const reached = new Set();
  const queue = [state.project.meta.start_node_id];

  while (queue.length) {
    const id = queue.shift();
    if (!id || reached.has(id)) continue;

    const node = findNode(id);
    if (!node) continue;

    reached.add(id);
    if (node.next) queue.push(node.next);
    node.choices.forEach((item) => {
      if (item.next) queue.push(item.next);
    });
  }

  return reached;
}

function handleEditorInput(event) {
  const node = selectedNode();
  if (!node) return;

  const nodeField = event.target.closest("[data-node-field]");
  if (nodeField) {
    const field = nodeField.dataset.nodeField;
    node[field] = nodeField.value;
    repairProject(state.project);
    const filterSensitiveFields = new Set(["title", "text", "writer_note", "speaker"]);

    if (field === "title" || field === "next" || field === "text") {
      renderProjectOutline();
    }

    if (filterSensitiveFields.has(field) || field === "next") {
      renderNodeList();
      renderStoryMap();
    }

    if (filterSensitiveFields.has(field)) {
      refreshEditorFilterBanner();
    }

    if (field === "title" || field === "text" || field === "next") {
      renderDiagnostics();
      renderPlaytest();
    }

    saveProject(field === "title");
    return;
  }

  const choiceField = event.target.closest("[data-choice-field]");
  if (!choiceField) return;

  const card = event.target.closest("[data-choice-id]");
  const choiceItem = node.choices.find((item) => item.id === card?.dataset.choiceId);
  if (!choiceItem) return;

  choiceItem[choiceField.dataset.choiceField] = choiceField.value;
  if (choiceField.dataset.choiceField === "next" && event.type === "change") {
    renderSceneEditor();
  }
  renderStoryMap();
  renderDiagnostics();
  renderPlaytest();
  saveProject(false);
}

function handleEditorClick(event) {
  const node = selectedNode();
  if (!node) return;

  const jumpButton = event.target.closest("[data-node-id]");
  if (jumpButton && !jumpButton.matches(".node-card")) {
    state.selectedNodeId = jumpButton.dataset.nodeId;
    renderProjectOutline();
    renderNodeList();
    renderSceneEditor();
    return;
  }

  const button = event.target.closest("[data-action]");
  if (!button) return;

  const action = button.dataset.action;

  if (action === "set-start") {
    state.project.meta.start_node_id = node.id;
    resetPlaytest();
    renderNodeList();
    renderProjectOutline();
    renderStoryMap();
    renderDiagnostics();
    renderPlaytest();
    saveProject(false);
    return;
  }

  if (action === "play-here") {
    startPlaytestFrom(node.id);
    return;
  }

  if (action === "clear-filter") {
    clearNodeFilter();
    return;
  }

  if (action === "show-first-match") {
    const firstVisible = filteredProjectNodes()[0];
    if (firstVisible) selectNode(firstVisible.id);
    return;
  }

  if (action === "open-start") {
    selectNode(state.project.meta.start_node_id);
    return;
  }

  if (action === "move-up" || action === "move-down") {
    const currentIndex = state.project.nodes.findIndex((item) => item.id === node.id);
    const offset = action === "move-up" ? -1 : 1;
    const targetIndex = currentIndex + offset;
    if (targetIndex < 0 || targetIndex >= state.project.nodes.length) return;
    const [moved] = state.project.nodes.splice(currentIndex, 1);
    state.project.nodes.splice(targetIndex, 0, moved);
    renderAll();
    saveProject(false);
    return;
  }

  if (action === "duplicate-node") {
    const copyId = uniqueNodeId(`${node.id}-copy`);
    const copyNode = {
      ...cloneNode(node),
      id: copyId,
      title: `${node.title || "Node"} Copy`,
      choices: node.choices.map((item, index) => ({
        id: `${copyId}-choice-${index + 1}`,
        text: item.text,
        writer_note: item.writer_note,
        next: item.next,
      })),
    };
    insertNode(copyNode);
    return;
  }

  if (action === "delete-node") {
    if (state.project.nodes.length === 1) {
      setSaveState("The last node cannot be deleted.", "save-state-warn");
      return;
    }

    const removeId = node.id;
    const currentIndex = state.project.nodes.findIndex((item) => item.id === removeId);

    state.project.nodes = state.project.nodes.filter((item) => item.id !== removeId);
    state.project.nodes.forEach((item) => {
      if (item.next === removeId) item.next = "";
      item.choices = item.choices.map((choiceItem) => ({
        ...choiceItem,
        next: choiceItem.next === removeId ? "" : choiceItem.next,
      }));
    });

    repairProject(state.project);
    state.selectedNodeId = state.project.nodes[Math.max(0, currentIndex - 1)].id;
    if (state.project.meta.start_node_id === removeId) {
      state.project.meta.start_node_id = state.project.nodes[0].id;
    }
    if (!findNode(state.playtest.currentNodeId)) resetPlaytest();
    renderAll();
    saveProject(false);
    return;
  }

  if (action === "add-choice") {
    if (node.kind === "ending") return;
    node.choices.push({
      id: `${node.id}-choice-${node.choices.length + 1}`,
      text: "",
      writer_note: "",
      next: "",
    });
    renderSceneEditor();
    renderDiagnostics();
    saveProject(false);
    return;
  }

  if (action === "delete-choice") {
    const card = event.target.closest("[data-choice-id]");
    if (!card) return;
    node.choices = node.choices.filter((item) => item.id !== card.dataset.choiceId);
    renderSceneEditor();
    renderDiagnostics();
    saveProject(false);
  }
}

function handlePlaytestClick(event) {
  const fromSelectedButton = event.target.closest("[data-playtest-from-selected]");
  if (fromSelectedButton) {
    startPlaytestFrom(state.selectedNodeId || state.project.meta.start_node_id);
    return;
  }

  const historyButton = event.target.closest("[data-playtest-history-index]");
  if (historyButton) {
    jumpPlaytestHistory(Number(historyButton.dataset.playtestHistoryIndex));
    return;
  }

  const backButton = event.target.closest("[data-playtest-back]");
  if (backButton) {
    rewindPlaytestOneStep();
    return;
  }

  const focusButton = event.target.closest("[data-playtest-focus]");
  if (focusButton) {
    selectNode(state.playtest.currentNodeId);
    return;
  }

  const button = event.target.closest("[data-playtest-target]");
  if (!button) return;

  const target = button.dataset.playtestTarget;
  if (!findNode(target)) return;

  state.playtest.currentNodeId = target;
  state.playtest.history.push(
    createPlaytestHistoryStep(target, button.dataset.playtestLabel || findNode(target)?.title || target),
  );
  renderDiagnostics();
  renderPlaytest();
}

function insertNode(node) {
  const currentIndex = state.project.nodes.findIndex((item) => item.id === state.selectedNodeId);
  const insertAt = currentIndex >= 0 ? currentIndex + 1 : state.project.nodes.length;
  state.project.nodes.splice(insertAt, 0, node);

  const activeNode = selectedNode();
  if (activeNode && activeNode.kind === "scene" && !activeNode.next && activeNode.choices.length === 0) {
    activeNode.next = node.id;
  }

  repairProject(state.project);
  state.selectedNodeId = node.id;
  ensureSelectedNodeVisibleInFilter();
  renderAll();
  saveProject(false);
}

function selectedNode() {
  return findNode(state.selectedNodeId);
}

function findNode(id) {
  return state.project.nodes.find((node) => node.id === id) || null;
}

function resetPlaytest() {
  state.playtest.originNodeId = state.project.meta.start_node_id;
  state.playtest.currentNodeId = state.project.meta.start_node_id;
  state.playtest.history = [
    createPlaytestHistoryStep(state.project.meta.start_node_id, findNode(state.project.meta.start_node_id)?.title || state.project.meta.start_node_id),
  ];
}

function rewindPlaytestOneStep() {
  if (state.playtest.history.length <= 1) return;
  state.playtest.history.pop();
  const previous = state.playtest.history[state.playtest.history.length - 1];
  if (!previous || !findNode(previous.nodeId)) {
    resetPlaytest();
  } else {
    state.playtest.currentNodeId = previous.nodeId;
  }
  renderDiagnostics();
  renderPlaytest();
}

function jumpPlaytestHistory(index) {
  if (!Number.isInteger(index) || index < 0 || index >= state.playtest.history.length) return;

  const nextHistory = state.playtest.history.slice(0, index + 1);
  const nextStep = nextHistory[nextHistory.length - 1];
  if (!nextStep || !findNode(nextStep.nodeId)) return;

  state.playtest.history = nextHistory;
  state.playtest.currentNodeId = nextStep.nodeId;
  renderDiagnostics();
  renderPlaytest();
}

function nodeOptions(skipId, selectedValue) {
  const options = ['<option value="">No link</option>'];
  state.project.nodes.forEach((node) => {
    if (node.id === skipId) return;
    const selected = node.id === selectedValue ? "selected" : "";
    options.push(
      `<option value="${escapeHtml(node.id)}" ${selected}>${escapeHtml(node.title || node.id)} (${escapeHtml(node.id)})</option>`,
    );
  });
  return options.join("");
}

function importProject(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      state.project = sanitizeProject(JSON.parse(String(reader.result || "{}")));
      state.selectedNodeId = state.project.meta.start_node_id;
      ensureSelectedNodeVisibleInFilter();
      resetPlaytest();
      renderAll();
      saveProject(true);
      setSaveState("JSON imported.", "save-state-live");
    } catch (error) {
      console.error(error);
      setSaveState("JSON could not be parsed.", "save-state-warn");
    }
  };
  reader.readAsText(file, "utf-8");
  event.target.value = "";
}

function exportProject() {
  const payload = JSON.stringify(serializeProject(state.project), null, 2);
  const filename = `${slugify(state.project.meta.title || "text-choice-project") || "text-choice-project"}.json`;
  const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setSaveState("JSON exported.", "save-state-live");
}

function truncateText(value, limit) {
  const cleaned = String(value || "").replace(/\s+/g, " ").trim();
  if (cleaned.length <= limit) return cleaned;
  return `${cleaned.slice(0, Math.max(0, limit - 1)).trimEnd()}...`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
