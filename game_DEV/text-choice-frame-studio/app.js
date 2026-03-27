const STORAGE_KEY = "text-choice-frame-studio-v1";
<<<<<<< Updated upstream

function createTemplateProject() {
  return {
    version: 1,
    meta: {
      title: "기본 텍스트 템플릿",
      author: "",
      start_node_id: "intro",
    },
=======
const NODE_STATUSES = [
  { value: "outline", label: "구상" },
  { value: "draft", label: "초안" },
  { value: "ready", label: "검수 대기" },
  { value: "done", label: "완료" },
];

function createStarterProject() {
  return {
    version: 1,
    meta: {
      title: "새 텍스트 프레임",
      author: "",
      pitch: "서울 2033 / 모험가 이야기처럼 사건과 선택으로 굴러가지만, 작성은 더 단순하게 유지하는 템플릿.",
      default_language: "ko",
      start_node_id: "intro",
    },
    stats: [
      { id: "survival", label: "생존", default: 1, min: 0, max: 5 },
      { id: "curiosity", label: "호기심", default: 1, min: 0, max: 5 },
      { id: "trust", label: "신뢰", default: 0, min: -3, max: 5 },
    ],
    flags: [
      { id: "met_scout", label: "정찰자와 만남", default: false },
      { id: "opened_archive", label: "폐기 문서 보관함 개방", default: false },
    ],
>>>>>>> Stashed changes
    nodes: [
      {
        id: "intro",
        kind: "scene",
<<<<<<< Updated upstream
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
=======
        title: "첫 사건",
        speaker: "기록관",
        text: {
          ko: "[상황] 플레이어가 지금 어디에 있는지 적으세요.\n[감각] 소리, 냄새, 조명처럼 장면의 질감을 적으세요.\n[압박] 왜 지금 선택해야 하는지 적으세요.",
          en: "",
        },
        writer_note:
          "이 장면은 세계관 소개보다도 첫 결정을 밀어붙이는 데 집중합니다. 사건 하나, 선택지 둘 정도로 유지하세요.",
        next: "",
        choices: [
          {
            id: "intro_follow_signal",
            text: { ko: "수상한 신호를 따라간다", en: "" },
            writer_note: "호기심형 선택. 다음 장면에서 위험과 정보 둘 다 열리게 설계합니다.",
            requirements: [],
            effects: [
              { type: "change_stat", stat_id: "curiosity", value: 1 },
              { type: "set_flag", flag_id: "met_scout", value: true },
            ],
            next: "signal_room",
          },
          {
            id: "intro_secure_supplies",
            text: { ko: "먼저 식량을 챙긴다", en: "" },
            writer_note: "안전형 선택. 짧은 보상과 무난한 엔딩으로 연결해도 좋습니다.",
            requirements: [],
            effects: [{ type: "change_stat", stat_id: "survival", value: 1 }],
            next: "supply_ending",
>>>>>>> Stashed changes
          },
        ],
      },
      {
<<<<<<< Updated upstream
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
=======
        id: "signal_room",
        kind: "scene",
        title: "신호실",
        speaker: "정찰자",
        text: {
          ko: "[반전] 플레이어가 따라간 결과 무엇을 보게 되는지 적으세요.\n[정보] 이후 분기에 영향을 줄 단서를 한 줄 넣으세요.\n[선택 직전] 지금 열 것인지, 물러날 것인지 압박을 다시 만드세요.",
          en: "",
        },
        writer_note:
          "여기서는 서울 2033식 사건-보상 감각과 모험가 이야기식 조건 분기를 아주 얇게만 흉내 냅니다. 시스템보다 텍스트 한 덩어리가 먼저입니다.",
        choices: [
          {
            id: "signal_open_archive",
            text: { ko: "잠긴 보관함을 연다", en: "" },
            writer_note: "호기심 2 이상일 때만 열리도록 샘플로 넣어둔 선택입니다.",
            requirements: [{ type: "stat_at_least", stat_id: "curiosity", value: 2 }],
            effects: [
              { type: "set_flag", flag_id: "opened_archive", value: true },
              { type: "change_stat", stat_id: "trust", value: 1 },
            ],
            next: "archive_ending",
          },
          {
            id: "signal_leave",
            text: { ko: "위험하니 물러난다", en: "" },
            writer_note: "짧은 후퇴 엔딩이나 중간 거점 장면으로 보내도 됩니다.",
            requirements: [],
            effects: [{ type: "change_stat", stat_id: "survival", value: 1 }],
            next: "quiet_exit",
>>>>>>> Stashed changes
          },
        ],
      },
      {
<<<<<<< Updated upstream
        id: "ending_a",
        kind: "ending",
        title: "엔딩 A",
        speaker: "",
        text: "[엔딩 A] 선택의 결과로 얻은 것과 남은 여운을 적으세요.",
        writer_note: "무엇이 달라졌는지, 무엇이 남았는지만 짧게 정리하세요.",
=======
        id: "supply_ending",
        kind: "ending",
        title: "식량을 챙긴 사람",
        speaker: "기록관",
        text: {
          ko: "[결말] 눈앞의 자원을 확보한 덕분에 무엇을 지켰는지 적으세요.\n[여운] 대신 어떤 기회나 진실을 놓쳤는지 남기세요.",
          en: "",
        },
        writer_note: "안전한 선택이 항상 최선은 아니라는 여운을 남기면 좋습니다.",
>>>>>>> Stashed changes
        next: "",
        choices: [],
      },
      {
<<<<<<< Updated upstream
        id: "ending_b",
        kind: "ending",
        title: "엔딩 B",
        speaker: "",
        text: "[엔딩 B] 다른 선택의 결과와 마지막 감정을 적으세요.",
        writer_note: "첫 엔딩과 결의 감정 차이가 보이도록 마무리하세요.",
=======
        id: "quiet_exit",
        kind: "ending",
        title: "조용한 철수",
        speaker: "기록관",
        text: {
          ko: "[결말] 플레이어가 무사히 빠져나가지만 무엇을 놓쳤는지 적으세요.\n[여운] 다음 회차에서 다른 선택을 해보고 싶게 만드는 힌트를 남기세요.",
          en: "",
        },
        writer_note: "짧은 엔딩도 괜찮습니다. 중요한 건 결말마다 플레이 감정이 달라지는 것입니다.",
        next: "",
        choices: [],
      },
      {
        id: "archive_ending",
        kind: "ending",
        title: "문서를 연 사람",
        speaker: "정찰자",
        text: {
          ko: "[결말] 플레이어가 알아낸 비밀과 그 대가를 적으세요.\n[회차 유도] 이 정보를 바탕으로 다른 분기로 이어질 확장 아이디어를 메모하세요.",
          en: "",
        },
        writer_note: "확장팩처럼 뻗어나갈 훅만 남겨도 충분합니다. 여기서 세계관을 다 설명할 필요는 없습니다.",
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
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
=======
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function bundleText(value) {
  return { ko: value || "", en: "" };
>>>>>>> Stashed changes
}

function loadProject() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
<<<<<<< Updated upstream
    if (!raw) return createTemplateProject();
    return normalizeProject(JSON.parse(raw));
  } catch (error) {
    console.warn("local project load failed", error);
    return createTemplateProject();
=======
    if (!raw) return normalizeProject(createStarterProject());
    return normalizeProject(JSON.parse(raw));
  } catch (error) {
    console.warn("local project load failed", error);
    return normalizeProject(createStarterProject());
>>>>>>> Stashed changes
  }
}

function saveProject(project) {
<<<<<<< Updated upstream
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeProject(project)));
=======
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
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
=======
function normalizeProject(raw) {
  const fallback = createStarterProject();
  const project = deepClone(fallback);
  if (!raw || typeof raw !== "object") return project;

  project.version = Number(raw.version) || 1;
  project.meta = { ...project.meta, ...(raw.meta || {}) };
  project.stats = Array.isArray(raw.stats) ? raw.stats.map(normalizeStat) : project.stats;
  project.flags = Array.isArray(raw.flags) ? raw.flags.map(normalizeFlag) : project.flags;
  project.nodes = Array.isArray(raw.nodes) ? raw.nodes.map(normalizeNode) : project.nodes;

  if (!project.meta.start_node_id && project.nodes[0]) {
    project.meta.start_node_id = project.nodes[0].id;
  }
  if (!project.nodes.some((node) => node.id === project.meta.start_node_id) && project.nodes[0]) {
    project.meta.start_node_id = project.nodes[0].id;
  }

  return project;
}

function normalizeStat(stat, index) {
  return {
    id: String(stat?.id || `stat-${index + 1}`),
    label: String(stat?.label || `능력치 ${index + 1}`),
    default: Number.isFinite(Number(stat?.default)) ? Number(stat.default) : 0,
    min: Number.isFinite(Number(stat?.min)) ? Number(stat.min) : 0,
    max: Number.isFinite(Number(stat?.max)) ? Number(stat.max) : 5,
  };
}

function normalizeFlag(flag, index) {
  return {
    id: String(flag?.id || `flag-${index + 1}`),
    label: String(flag?.label || `플래그 ${index + 1}`),
    default: Boolean(flag?.default),
  };
}

function normalizeNode(node, index) {
  return {
    id: String(node?.id || `node-${index + 1}`),
    kind: node?.kind === "ending" ? "ending" : "scene",
    title: String(node?.title || `장면 ${index + 1}`),
    status: normalizeNodeStatus(node?.status),
    tags: normalizeNodeTags(node?.tags),
    speaker: String(node?.speaker || ""),
    text: {
      ko: String(node?.text?.ko || ""),
      en: String(node?.text?.en || ""),
    },
    writer_note: String(node?.writer_note || ""),
    next: typeof node?.next === "string" ? node.next : "",
    choices: Array.isArray(node?.choices) ? node.choices.map(normalizeChoice) : [],
  };
}

function normalizeChoice(choice, index) {
  return {
    id: String(choice?.id || `choice-${index + 1}`),
    text: {
      ko: String(choice?.text?.ko || ""),
      en: String(choice?.text?.en || ""),
    },
    writer_note: String(choice?.writer_note || ""),
    next: typeof choice?.next === "string" ? choice.next : "",
    requirements: Array.isArray(choice?.requirements)
      ? choice.requirements.map(normalizeRequirement)
      : [],
    effects: Array.isArray(choice?.effects) ? choice.effects.map(normalizeEffect) : [],
  };
}

function normalizeNodeStatus(value) {
  const candidate = String(value || "").trim();
  return NODE_STATUSES.some((item) => item.value === candidate) ? candidate : "outline";
}

function normalizeNodeTags(value) {
  if (!Array.isArray(value)) return [];
  const unique = [];
  value.forEach((item) => {
    const clean = String(item || "").trim();
    if (!clean || unique.includes(clean)) return;
    unique.push(clean);
  });
  return unique.slice(0, 8);
}

function normalizeRequirement(rule) {
  const type = rule?.type === "flag_on" || rule?.type === "flag_off" ? rule.type : "stat_at_least";
  return {
    type,
    stat_id: String(rule?.stat_id || ""),
    flag_id: String(rule?.flag_id || ""),
    value: Number.isFinite(Number(rule?.value)) ? Number(rule.value) : 0,
  };
}

function normalizeEffect(effect) {
  const type = effect?.type === "set_flag" ? "set_flag" : "change_stat";
  return {
    type,
    stat_id: String(effect?.stat_id || ""),
    flag_id: String(effect?.flag_id || ""),
    value: type === "set_flag" ? Boolean(effect?.value) : Number.isFinite(Number(effect?.value)) ? Number(effect.value) : 0,
  };
}

function detectImportFormat(raw) {
  const root = raw?.project && typeof raw.project === "object" ? raw.project : raw;
  const nodes = Array.isArray(root?.nodes) ? root.nodes : [];
  const edges = Array.isArray(root?.edges) ? root.edges : [];

  if (
    nodes.length &&
    !edges.length &&
    nodes.every((node) => typeof node === "object" && node && ("kind" in node || "text" in node || "choices" in node))
  ) {
    return "frame";
  }

  if (
    nodes.length &&
    Array.isArray(edges) &&
    nodes.some((node) => {
      const type = legacyNodeType(node);
      return Boolean(type);
    })
  ) {
    return "legacy-ugc-graph";
  }

  return "unknown";
}

function importProjectPayload(raw) {
  const format = detectImportFormat(raw);
  if (format === "frame") {
    const project = normalizeProject(raw?.project && raw.project.nodes ? raw.project : raw);
    return {
      project,
      summary: {
        format,
        formatLabel: "단순 프레임 JSON",
        description: "현재 툴 포맷 그대로 불러왔습니다.",
        counts: {
          originalNodes: project.nodes.length,
          originalEdges: 0,
          frameNodes: project.nodes.length,
          stats: project.stats.length,
          flags: project.flags.length,
        },
        notes: ["추가 변환 없이 편집 포맷 그대로 유지했습니다."],
      },
    };
  }

  if (format === "legacy-ugc-graph") {
    return convertLegacyProjectPayload(raw);
  }

  throw new Error("지원하지 않는 JSON 형식입니다. 현재 툴 JSON 또는 60sec UGC 그래프 JSON만 불러올 수 있습니다.");
}

function extractLegacyProject(raw) {
  if (raw?.project && typeof raw.project === "object") {
    return raw.project;
  }
  return raw && typeof raw === "object" ? raw : {};
}

function legacyNodeType(node) {
  const dataType = String(node?.data?.type || "").trim().toLowerCase();
  if (dataType) return dataType;
  const rawType = String(node?.type || "").trim().toLowerCase();
  if (rawType.endsWith("node")) {
    return rawType.slice(0, -4);
  }
  return rawType;
}

function buildLegacyOutgoingMap(edges) {
  const grouped = new Map();

  function handleIndex(handle) {
    if (typeof handle !== "string") return 10000;
    if (handle.startsWith("choice-")) {
      const tail = Number(handle.split("-")[1]);
      return Number.isFinite(tail) ? tail : 10000;
    }
    if (handle === "success" || handle === "true") return 0;
    if (handle === "failure" || handle === "false") return 1;
    return 10000;
  }

  (Array.isArray(edges) ? edges : []).forEach((edge) => {
    const source = String(edge?.source || "").trim();
    const target = String(edge?.target || "").trim();
    if (!source || !target) return;
    if (!grouped.has(source)) grouped.set(source, []);
    grouped.get(source).push(edge);
  });

  grouped.forEach((sourceEdges, source) => {
    sourceEdges.sort((left, right) => {
      const handleOrder = handleIndex(left?.sourceHandle) - handleIndex(right?.sourceHandle);
      if (handleOrder !== 0) return handleOrder;
      const handleLabel = String(left?.sourceHandle || "").localeCompare(String(right?.sourceHandle || ""));
      if (handleLabel !== 0) return handleLabel;
      return String(left?.target || "").localeCompare(String(right?.target || ""));
    });
    grouped.set(source, sourceEdges);
  });

  return grouped;
}

function getLegacyEdgeTarget(edges, handle, fallbackIndex = 0) {
  if (!Array.isArray(edges) || !edges.length) return "";
  if (handle) {
    const direct = edges.find((edge) => String(edge?.sourceHandle || "") === handle);
    if (direct?.target) return String(direct.target);
  }
  const fallback = edges[fallbackIndex];
  return fallback?.target ? String(fallback.target) : "";
}

function pickLegacyStartNode(nodes, outgoingMap) {
  const list = Array.isArray(nodes) ? nodes : [];
  if (!list.length) return "";

  const startNode = list.find((node) => legacyNodeType(node) === "start");
  if (startNode?.id) {
    const outgoing = outgoingMap.get(startNode.id) || [];
    if (outgoing[0]?.target) return String(outgoing[0].target);
    return String(startNode.id);
  }

  const triggerNodes = list
    .filter((node) => legacyNodeType(node) === "trigger")
    .sort((left, right) => Number(left?.data?.minDay ?? 9999) - Number(right?.data?.minDay ?? 9999));
  if (triggerNodes[0]?.id) return String(triggerNodes[0].id);

  const incoming = new Map();
  list.forEach((node) => incoming.set(String(node?.id || ""), 0));
  outgoingMap.forEach((edges) => {
    edges.forEach((edge) => {
      const target = String(edge?.target || "");
      incoming.set(target, (incoming.get(target) || 0) + 1);
    });
  });

  const roots = list
    .map((node) => String(node?.id || ""))
    .filter((nodeId) => nodeId && (incoming.get(nodeId) || 0) === 0)
    .sort();
  if (roots[0]) return roots[0];
  return String(list[0]?.id || "");
}

function collectLegacyFlagIds(project) {
  const ids = new Set();

  (Array.isArray(project?.flags) ? project.flags : []).forEach((flag) => {
    const id = String(flag?.id || "").trim();
    if (id) ids.add(id);
  });

  (Array.isArray(project?.nodes) ? project.nodes : []).forEach((node) => {
    const data = node?.data || {};
    if (legacyNodeType(node) === "branch") {
      (Array.isArray(data?.conditions) ? data.conditions : []).forEach((condition) => {
        const id = String(condition?.flagId || "").trim();
        if (id) ids.add(id);
      });
    }

    if (legacyNodeType(node) === "flag") {
      const id = String(data?.flagId || "").trim();
      if (id) ids.add(id);
    }

    if (legacyNodeType(node) === "result") {
      [data?.onSuccess, data?.onFailure].forEach((result) => {
        (Array.isArray(result?.flagChanges) ? result.flagChanges : []).forEach((change) => {
          const id = String(change?.flagId || "").trim();
          if (id) ids.add(id);
        });
      });
    }
  });

  return ids;
}

function buildImportedFlags(project) {
  const usedIds = new Set();
  const flags = [];

  (Array.isArray(project?.flags) ? project.flags : []).forEach((flag, index) => {
    const rawId = String(flag?.id || `flag-${index + 1}`);
    const id = ensureUniqueId(Array.from(usedIds), rawId, "flag");
    usedIds.add(id);
    flags.push({
      id,
      label: String(flag?.nameKo || flag?.label || flag?.name || id),
      default: Boolean(flag?.defaultValue ?? flag?.default),
    });
  });

  Array.from(collectLegacyFlagIds(project)).forEach((flagId) => {
    if (usedIds.has(flagId)) return;
    usedIds.add(flagId);
    flags.push({
      id: flagId,
      label: flagId,
      default: false,
    });
  });

  return flags;
}

function buildImportedStats(project) {
  const usedIds = new Set();
  return (Array.isArray(project?.customStats) ? project.customStats : []).map((stat, index) => {
    const rawId = String(stat?.id || `stat-${index + 1}`);
    const id = ensureUniqueId(Array.from(usedIds), rawId, "stat");
    usedIds.add(id);
    return {
      id,
      label: String(stat?.nameKo || stat?.label || stat?.name || id),
      default: Number.isFinite(Number(stat?.defaultValue ?? stat?.default)) ? Number(stat?.defaultValue ?? stat?.default) : 0,
      min: Number.isFinite(Number(stat?.min)) ? Number(stat.min) : 0,
      max: Number.isFinite(Number(stat?.max)) ? Number(stat.max) : 100,
    };
  });
}

function convertLegacyConditionsToRequirements(conditions, invert = false) {
  return (Array.isArray(conditions) ? conditions : [])
    .map((condition) => {
      if (condition?.type !== "flag") return null;
      const flagId = String(condition?.flagId || "").trim();
      if (!flagId) return null;
      const positive = Boolean(condition?.value);
      return {
        type: positive !== invert ? "flag_on" : "flag_off",
        stat_id: "",
        flag_id: flagId,
        value: 0,
      };
    })
    .filter(Boolean);
}

function convertLegacyFlagChangesToEffects(flagChanges) {
  return (Array.isArray(flagChanges) ? flagChanges : [])
    .map((change) => {
      const flagId = String(change?.flagId || "").trim();
      if (!flagId) return null;
      return {
        type: "set_flag",
        stat_id: "",
        flag_id: flagId,
        value: Boolean(change?.value),
      };
    })
    .filter(Boolean);
}

function createImportedSceneBase(node, type) {
  const data = node?.data || {};
  const label = String(data?.label || data?.titleKo || data?.title || node?.id || "scene");

  if (type === "ending") {
    const title = String(data?.titleKo || data?.title || label || "엔딩");
    const reason = String(data?.reasonKo || data?.reason || "");
    return {
      id: "",
      kind: "ending",
      title,
      speaker: "결말",
      text: {
        ko: reason || `[엔딩] ${title}`,
        en: String(data?.reason || data?.title || label || ""),
      },
      writer_note: "60sec UGC ending 노드에서 가져온 장면입니다. 지금 툴의 결말 문장에 맞게 짧게 정리하세요.",
      next: "",
      choices: [],
    };
  }

  if (type === "dialogue") {
    return {
      id: "",
      kind: "scene",
      title: label,
      speaker: String(data?.speaker || data?.characterId || ""),
      text: {
        ko: String(data?.textKo || data?.text || `[대화] ${label}`),
        en: String(data?.text || ""),
      },
      writer_note: "60sec UGC dialogue 노드에서 가져온 장면입니다. 묘사와 압박을 더해 현재 프레임에 맞게 다듬으세요.",
      next: "",
      choices: [],
    };
  }

  if (type === "trigger") {
    const minDay = data?.minDay ?? "?";
    const maxDay = data?.maxDay ?? minDay;
    const probability = data?.probability ?? 1;
    return {
      id: "",
      kind: "scene",
      title: label,
      speaker: "트리거",
      text: {
        ko: `[트리거] ${label}\n[발생 구간] day ${minDay}${maxDay === minDay ? "" : ` ~ ${maxDay}`}\n[확률] ${probability}`,
        en: String(data?.label || label),
      },
      writer_note: "60sec UGC trigger 노드를 서두 장면으로 펼친 것입니다. 실제 사건 문장으로 다시 써 주세요.",
      next: "",
      choices: [],
    };
  }

  if (type === "choice") {
    return {
      id: "",
      kind: "scene",
      title: label,
      speaker: "선택",
      text: {
        ko: `[선택 장면] ${label}\n이 장면은 원본 60sec UGC choice 노드에서 가져왔습니다.`,
        en: String(data?.label || label),
      },
      writer_note: "선택 전 상황 설명을 먼저 채우고, 아래 선택지 문장만 남기세요.",
      next: "",
      choices: [],
    };
  }

  if (type === "result") {
    const successChance = data?.successChance;
    const successText = String(data?.onSuccess?.textKo || data?.onSuccess?.text || "");
    const failureText = String(data?.onFailure?.textKo || data?.onFailure?.text || "");
    return {
      id: "",
      kind: "scene",
      title: label,
      speaker: "결과",
      text: {
        ko: [
          `[결과 장면] ${label}`,
          Number.isFinite(Number(successChance)) ? `[원본 성공 확률] ${Math.round(Number(successChance) * 100)}%` : "",
          successText ? `[성공 요약] ${successText}` : "",
          failureText ? `[실패 요약] ${failureText}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
        en: String(data?.label || label),
      },
      writer_note: "60sec UGC result 노드는 확률 분기를 갖습니다. 이 툴에서는 수동 선택형 분기로 풀어 두었으니, 나중에 서술형 결과 장면으로 정리하세요.",
      next: "",
      choices: [],
    };
  }

  if (type === "branch") {
    return {
      id: "",
      kind: "scene",
      title: label,
      speaker: "분기",
      text: {
        ko: `[분기 체크] ${label}\n원본 60sec UGC branch 조건을 단순 선택지 분기로 펼쳐 두었습니다.`,
        en: String(data?.label || label),
      },
      writer_note: "조건이 복잡하면 수동으로 다시 정리하세요. 지금은 true/false 분기 틀만 남겨 둡니다.",
      next: "",
      choices: [],
    };
  }

  if (type === "flag") {
    return {
      id: "",
      kind: "scene",
      title: label,
      speaker: "상태 변경",
      text: {
        ko: String(data?.textKo || data?.text || `[플래그] ${label}`),
        en: String(data?.text || ""),
      },
      writer_note: "원본 60sec UGC flag 노드의 자동 효과를 '계속' 선택지에 붙여 두었습니다.",
      next: "",
      choices: [],
    };
  }

  return {
    id: "",
    kind: "scene",
    title: label,
    speaker: "",
    text: {
      ko: `[가져온 장면] ${label}`,
      en: String(data?.label || label),
    },
    writer_note: "정확한 타입을 알 수 없는 노드라 기본 장면으로 가져왔습니다.",
    next: "",
    choices: [],
  };
}

function convertLegacyProjectPayload(raw) {
  const project = extractLegacyProject(raw);
  const sourceNodes = Array.isArray(project?.nodes) ? project.nodes : [];
  const sourceEdges = Array.isArray(project?.edges) ? project.edges : [];

  if (!sourceNodes.length) {
    throw new Error("60sec UGC 그래프에 노드가 없습니다.");
  }

  const sourceNodeMap = new Map();
  sourceNodes.forEach((node) => {
    const id = String(node?.id || "").trim();
    if (id) sourceNodeMap.set(id, node);
  });

  const warnings = [];
  const outgoingMap = buildLegacyOutgoingMap(sourceEdges);
  const importedFlags = buildImportedFlags(project);
  const importedStats = buildImportedStats(project);
  const convertedNodes = [];
  let counter = 1;

  function nextImportedId(oldId) {
    const base = createId(String(oldId || "node"), "node");
    const nextId = `${base}-${String(counter).padStart(3, "0")}`;
    counter += 1;
    return nextId;
  }

  function emit(oldId, trail = [], depth = 0) {
    const oldNode = sourceNodeMap.get(oldId);
    if (!oldNode) {
      warnings.push(`존재하지 않는 60sec UGC 대상 노드를 만났습니다: ${oldId}`);
      const missingId = nextImportedId(oldId || "missing");
      convertedNodes.push(
        normalizeNode({
          id: missingId,
          kind: "ending",
          title: "누락된 노드",
          speaker: "시스템",
          text: { ko: `[누락] ${oldId} 노드를 찾지 못했습니다.`, en: "" },
          writer_note: "가져오기 과정에서 대상 노드를 찾지 못했습니다.",
          next: "",
          choices: [],
        }),
      );
      return missingId;
    }

    const type = legacyNodeType(oldNode);
    const outgoing = outgoingMap.get(oldId) || [];

    if (type === "start" || type === "note") {
      if (outgoing[0]?.target) {
        warnings.push(`${oldId} ${type} 노드는 본문이 없어 첫 연결 장면으로 넘겼습니다.`);
        return emit(String(outgoing[0].target), trail, depth);
      }
      warnings.push(`${oldId} ${type} 노드는 연결이 없어 비어 있는 장면으로 변환합니다.`);
    }

    if (depth >= 48) {
      warnings.push(`${oldId}에서 최대 깊이에 도달해 더 이상 펼치지 않았습니다.`);
    }
    if (trail.includes(oldId)) {
      warnings.push(`${oldId}에서 순환을 감지해 이 지점에서 연결을 잘랐습니다.`);
    }

    const converted = createImportedSceneBase(oldNode, type);
    converted.id = nextImportedId(oldId);
    converted.writer_note = `${converted.writer_note}\n원본 노드 ID: ${oldId}`;
    convertedNodes.push(normalizeNode(converted));

    const convertedNode = convertedNodes[convertedNodes.length - 1];
    if (depth >= 48 || trail.includes(oldId)) {
      return convertedNode.id;
    }

    const nextTrail = [...trail, oldId];

    if (type === "choice") {
      const rawChoices = Array.isArray(oldNode?.data?.choices) ? oldNode.data.choices : [];
      convertedNode.choices = rawChoices.map((choice, index) => {
        const targetId = getLegacyEdgeTarget(outgoing, `choice-${index}`, index);
        if (choice?.requiredItem) {
          warnings.push(`${oldId} choice-${index}는 requiredItem(${choice.requiredItem})을 사용합니다. 수동 정리가 필요합니다.`);
        }
        return normalizeChoice({
          id: createId(choice?.id || `choice-${index + 1}`, "choice"),
          text: {
            ko: String(choice?.textKo || choice?.text || `선택지 ${index + 1}`),
            en: String(choice?.text || ""),
          },
          writer_note: choice?.requiredItem
            ? `원본 requiredItem: ${choice.requiredItem}. 이 툴에서는 아이템 조건이 없어 수동 정리가 필요합니다.`
            : "",
          next: targetId ? emit(String(targetId), nextTrail, depth + 1) : "",
          requirements: [],
          effects: [],
        });
      });
      return convertedNode.id;
    }

    if (type === "result") {
      const successTarget = getLegacyEdgeTarget(outgoing, "success", 0);
      const failureTarget = getLegacyEdgeTarget(outgoing, "failure", 1);
      const successEffects = convertLegacyFlagChangesToEffects(oldNode?.data?.onSuccess?.flagChanges);
      const failureEffects = convertLegacyFlagChangesToEffects(oldNode?.data?.onFailure?.flagChanges);

      convertedNode.choices = [
        {
          id: "result-success",
          text: { ko: "성공 분기", en: "Success route" },
          writer_note: String(oldNode?.data?.onSuccess?.textKo || oldNode?.data?.onSuccess?.text || ""),
          next: successTarget ? emit(String(successTarget), nextTrail, depth + 1) : "",
          requirements: [],
          effects: successEffects,
        },
        {
          id: "result-failure",
          text: { ko: "실패 분기", en: "Failure route" },
          writer_note: String(oldNode?.data?.onFailure?.textKo || oldNode?.data?.onFailure?.text || ""),
          next: failureTarget ? emit(String(failureTarget), nextTrail, depth + 1) : "",
          requirements: [],
          effects: failureEffects,
        },
      ]
        .filter((choice) => choice.next || choice.writer_note || choice.effects.length)
        .map((choice) => normalizeChoice(choice));

      if (!convertedNode.choices.length && outgoing[0]?.target) {
        convertedNode.next = emit(String(outgoing[0].target), nextTrail, depth + 1);
      }

      return convertedNode.id;
    }

    if (type === "branch") {
      const conditions = Array.isArray(oldNode?.data?.conditions) ? oldNode.data.conditions : [];
      if (conditions.length > 1) {
        warnings.push(`${oldId} branch 노드는 조건이 ${conditions.length}개입니다. false 분기는 수동 정리가 필요할 수 있습니다.`);
      }

      convertedNode.choices = [
        {
          id: "branch-true",
          text: { ko: "조건 충족", en: "Condition met" },
          writer_note: "원본 branch 노드의 true 분기입니다.",
          next: getLegacyEdgeTarget(outgoing, "true", 0)
            ? emit(String(getLegacyEdgeTarget(outgoing, "true", 0)), nextTrail, depth + 1)
            : "",
          requirements: convertLegacyConditionsToRequirements(conditions, false),
          effects: [],
        },
        {
          id: "branch-false",
          text: { ko: "조건 미충족", en: "Condition not met" },
          writer_note: conditions.length === 1 ? "단일 flag 조건을 반전한 false 분기입니다." : "복합 조건의 false 분기라 수동 정리가 필요할 수 있습니다.",
          next: getLegacyEdgeTarget(outgoing, "false", 1)
            ? emit(String(getLegacyEdgeTarget(outgoing, "false", 1)), nextTrail, depth + 1)
            : "",
          requirements: conditions.length === 1 ? convertLegacyConditionsToRequirements(conditions, true) : [],
          effects: [],
        },
      ]
        .filter((choice) => choice.next || choice.requirements.length)
        .map((choice) => normalizeChoice(choice));

      return convertedNode.id;
    }

    if (type === "flag") {
      const flagId = String(oldNode?.data?.flagId || "").trim();
      if (!flagId) {
        warnings.push(`${oldId} flag 노드는 flagId가 비어 있습니다.`);
      }
      const nextTarget = outgoing[0]?.target ? String(outgoing[0].target) : "";
      convertedNode.choices = [
        normalizeChoice({
          id: "apply-flag",
          text: { ko: "변화 적용 후 계속", en: "Apply and continue" },
          writer_note: "자동 변화를 선택지 효과로 옮겼습니다.",
          next: nextTarget ? emit(nextTarget, nextTrail, depth + 1) : "",
          requirements: [],
          effects: flagId
            ? [
                {
                  type: "set_flag",
                  stat_id: "",
                  flag_id: flagId,
                  value: Boolean(oldNode?.data?.value),
                },
              ]
            : [],
        }),
      ];
      return convertedNode.id;
    }

    if (outgoing.length > 1) {
      warnings.push(`${oldId} ${type || "scene"} 노드는 다중 출구를 가집니다. 첫 연결만 기본 다음 장면으로 가져왔습니다.`);
    }

    if (outgoing[0]?.target) {
      convertedNode.next = emit(String(outgoing[0].target), nextTrail, depth + 1);
    }

    return convertedNode.id;
  }

  const startOldId = pickLegacyStartNode(sourceNodes, outgoingMap);
  const startNodeId = emit(startOldId);

  const importedProject = normalizeProject({
    version: 1,
    meta: {
      title: String(project?.meta?.title || project?.projectMeta?.title || "Converted 60sec Frame"),
      author: String(project?.meta?.author || project?.projectMeta?.author || ""),
      pitch: "60sec UGC 그래프 JSON을 단순 텍스트 프레임으로 접어 가져온 프로젝트입니다.",
      default_language: "ko",
      start_node_id: startNodeId,
      import_source_format: "legacy-ugc-graph",
      import_source_title: String(project?.meta?.title || project?.projectMeta?.title || ""),
    },
    stats: importedStats,
    flags: importedFlags,
    nodes: convertedNodes,
  });

  return {
    project: importedProject,
    summary: {
      format: "legacy-ugc-graph",
      formatLabel: "60sec UGC 그래프 JSON",
      description: "60sec Choice Game UGC의 레거시 그래프를 단순 장면 트리로 변환했습니다.",
      counts: {
        originalNodes: sourceNodes.length,
        originalEdges: sourceEdges.length,
        frameNodes: importedProject.nodes.length,
        stats: importedProject.stats.length,
        flags: importedProject.flags.length,
      },
      notes: warnings.slice(0, 8),
      hiddenNoteCount: Math.max(0, warnings.length - 8),
    },
  };
}

function buildRuntimeProject(project) {
  const normalized = normalizeProject(project);
  return {
    version: normalized.version,
    meta: {
      title: normalized.meta.title,
      author: normalized.meta.author,
      pitch: normalized.meta.pitch,
      default_language: normalized.meta.default_language,
      start_node_id: normalized.meta.start_node_id,
      export_kind: "runtime",
    },
    stats: normalized.stats.map((stat) => ({
      id: stat.id,
      label: stat.label,
      default: Number(stat.default),
      min: Number(stat.min),
      max: Number(stat.max),
    })),
    flags: normalized.flags.map((flag) => ({
      id: flag.id,
      label: flag.label,
      default: Boolean(flag.default),
    })),
    nodes: normalized.nodes.map((node) => ({
      id: node.id,
      kind: node.kind,
      title: node.title,
      speaker: node.speaker,
      text: {
        ko: node.text.ko,
        en: node.text.en,
      },
      next: node.next || "",
      choices: node.choices.map((choice) => ({
        id: choice.id,
        text: {
          ko: choice.text.ko,
          en: choice.text.en,
        },
        next: choice.next || "",
        requirements: choice.requirements.map((rule) => ({
          type: rule.type,
          stat_id: rule.stat_id,
          flag_id: rule.flag_id,
          value: Number(rule.value),
        })),
        effects: choice.effects.map((effect) => ({
          type: effect.type,
          stat_id: effect.stat_id,
          flag_id: effect.flag_id,
          value: effect.type === "set_flag" ? Boolean(effect.value) : Number(effect.value),
        })),
      })),
    })),
  };
>>>>>>> Stashed changes
}

const state = {
  project: loadProject(),
  ui: {
    selectedNodeId: "",
<<<<<<< Updated upstream
=======
    lastImportSummary: null,
    nodeSearch: "",
    nodeFilter: "all",
>>>>>>> Stashed changes
  },
  playtest: null,
};

state.ui.selectedNodeId = state.project.meta.start_node_id || state.project.nodes[0]?.id || "";
state.playtest = createPlaytestState(state.project);

const els = {
  projectTitle: document.getElementById("project-title"),
  projectAuthor: document.getElementById("project-author"),
<<<<<<< Updated upstream
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
=======
  projectPitch: document.getElementById("project-pitch"),
  statsList: document.getElementById("stats-list"),
  flagsList: document.getElementById("flags-list"),
  nodeList: document.getElementById("node-list"),
  sceneEditor: document.getElementById("scene-editor"),
  validationSummary: document.getElementById("validation-summary"),
  playtestPanel: document.getElementById("playtest-panel"),
  writingProgress: document.getElementById("writing-progress"),
  newProjectBtn: document.getElementById("new-project-btn"),
  loadSampleBtn: document.getElementById("load-sample-btn"),
  importBtn: document.getElementById("import-btn"),
  exportBtn: document.getElementById("export-btn"),
  runtimeExportBtn: document.getElementById("runtime-export-btn"),
  resetLocalBtn: document.getElementById("reset-local-btn"),
  addStatBtn: document.getElementById("add-stat-btn"),
  addFlagBtn: document.getElementById("add-flag-btn"),
  addSceneBtn: document.getElementById("add-scene-btn"),
  addEndingBtn: document.getElementById("add-ending-btn"),
  restartPlaytestBtn: document.getElementById("restart-playtest-btn"),
  resetRunBtn: document.getElementById("reset-run-btn"),
  importInput: document.getElementById("import-input"),
  flowOverview: document.getElementById("flow-overview"),
  importSummary: document.getElementById("import-summary"),
>>>>>>> Stashed changes
};

bindTopLevelEvents();
renderAll();

<<<<<<< Updated upstream
function bindTopLevelEvents() {
  els.newProjectBtn.addEventListener("click", () => {
    state.project = createTemplateProject();
    state.ui.selectedNodeId = state.project.meta.start_node_id;
=======
function persistAndRender() {
  saveProject(state.project);
  state.playtest = createPlaytestState(state.project);
  renderAll();
}

function renderAll() {
  renderProjectMeta();
  renderStats();
  renderFlags();
  renderNodeList();
  renderSceneEditor();
  renderWritingProgress();
  renderAuditPanels();
  renderImportSummary();
  renderPlaytest();
  saveProject(state.project);
}

function renderWritingProgress() {
  if (!els.writingProgress) return;

  const counts = NODE_STATUSES.map((status) => ({
    ...status,
    count: state.project.nodes.filter((node) => node.status === status.value).length,
  }));
  const incompleteNodes = state.project.nodes
    .map((node) => ({ node, checklist: getNodeChecklist(node) }))
    .filter(({ node, checklist }) => checklist.pendingCount > 0 || node.status !== "done")
    .slice(0, 5);

  const countHtml = counts
    .map(
      (status) => `
        <div class="status-card">
          <div class="stack-title">${status.count}</div>
          <div class="stack-caption">${escapeHtml(status.label)}</div>
        </div>
      `,
    )
    .join("");

  const taskHtml = incompleteNodes.length
    ? incompleteNodes
        .map(
          ({ node, checklist }) => `
            <div class="status-card">
              <div class="stack-title">${escapeHtml(node.title || node.id)}</div>
              <div class="stack-caption"><code>${escapeHtml(node.id)}</code> · ${escapeHtml(getStatusLabel(node.status))}</div>
              <p class="muted-copy">${escapeHtml(checklist.items[0] || "아직 완료 상태로 바꾸지 않았습니다.")}</p>
            </div>
          `,
        )
        .join("")
    : `<div class="status-card"><span class="validation-pill is-ok">정리 완료</span><p class="muted-copy">모든 장면이 완료 상태이거나 기본 체크를 통과했습니다.</p></div>`;

  els.writingProgress.innerHTML = `
    <div class="hint-stack">
      <div class="status-row compact">${countHtml}</div>
      ${taskHtml}
    </div>
  `;
}

function renderAuditPanels() {
  const audit = validateProject(state.project);
  renderValidation(audit);
  renderFlowOverview(audit);
}

function bindTopLevelEvents() {
  els.newProjectBtn.addEventListener("click", () => {
    state.project = createStarterProject();
    state.ui.selectedNodeId = state.project.meta.start_node_id;
    state.ui.lastImportSummary = null;
>>>>>>> Stashed changes
    state.playtest = createPlaytestState(state.project);
    renderAll();
  });

<<<<<<< Updated upstream
  els.importBtn.addEventListener("click", () => {
    els.importInput.click();
  });

  els.importInput.addEventListener("change", handleImportFile);

  els.exportBtn.addEventListener("click", () => {
    const payload = serializeProject(state.project);
    const filenameBase = createId(state.project.meta.title || "text-choice-template", "text-choice-template");
    downloadJson(payload, `${filenameBase}.json`);
  });

=======
  els.loadSampleBtn.addEventListener("click", () => {
    state.project = createStarterProject();
    state.ui.selectedNodeId = state.project.meta.start_node_id;
    state.ui.lastImportSummary = {
      format: "starter-sample",
      formatLabel: "내장 샘플",
      description: "기본 샘플 프레임을 다시 불러왔습니다.",
      counts: {
        originalNodes: state.project.nodes.length,
        frameNodes: state.project.nodes.length,
        originalEdges: 0,
        stats: state.project.stats.length,
        flags: state.project.flags.length,
      },
      notes: ["레거시 60sec UGC 변환 없이 현재 프레임 구조 그대로 불러왔습니다."],
    };
    state.playtest = createPlaytestState(state.project);
    renderAll();
  });

  els.importBtn.addEventListener("click", () => els.importInput.click());
  els.importInput.addEventListener("change", handleImportFile);

  els.exportBtn.addEventListener("click", () => {
    const payload = normalizeProject(state.project);
    const filenameBase = createId(state.project.meta.title || "text-frame", "text-frame");
    downloadJson(payload, `${filenameBase}.json`);
  });

  els.runtimeExportBtn.addEventListener("click", () => {
    const payload = buildRuntimeProject(state.project);
    const filenameBase = createId(state.project.meta.title || "text-frame", "text-frame");
    downloadJson(payload, `${filenameBase}-runtime.json`);
  });

  els.resetLocalBtn.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    state.project = createStarterProject();
    state.ui.selectedNodeId = state.project.meta.start_node_id;
    state.ui.lastImportSummary = null;
    state.playtest = createPlaytestState(state.project);
    renderAll();
  });

  els.addStatBtn.addEventListener("click", () => {
    const id = ensureUniqueId(
      state.project.stats.map((item) => item.id),
      "new-stat",
      "stat",
    );
    state.project.stats.push({ id, label: "새 능력치", default: 0, min: 0, max: 5 });
    persistAndRender();
  });

  els.addFlagBtn.addEventListener("click", () => {
    const id = ensureUniqueId(
      state.project.flags.map((item) => item.id),
      "new-flag",
      "flag",
    );
    state.project.flags.push({ id, label: "새 플래그", default: false });
    persistAndRender();
  });

>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
=======

  els.resetRunBtn.addEventListener("click", () => {
    state.playtest = createPlaytestState(state.project);
    renderPlaytest();
  });
>>>>>>> Stashed changes
}

function handleImportFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  file
    .text()
    .then((text) => {
      const parsed = JSON.parse(text);
<<<<<<< Updated upstream
      state.project = normalizeProject(parsed);
      state.ui.selectedNodeId = state.project.meta.start_node_id || state.project.nodes[0]?.id || "";
=======
      const imported = importProjectPayload(parsed);
      state.project = imported.project;
      state.ui.lastImportSummary = imported.summary;
      state.ui.selectedNodeId =
        state.project.meta.start_node_id || state.project.nodes[0]?.id || "";
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
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
=======
function ensureUniqueId(existingIds, base, fallback) {
  const clean = createId(base, fallback);
  if (!existingIds.includes(clean)) return clean;
  let index = 2;
  while (existingIds.includes(`${clean}-${index}`)) {
    index += 1;
  }
  return `${clean}-${index}`;
}

function createNode(kind) {
  const existingIds = state.project.nodes.map((item) => item.id);
  const id = ensureUniqueId(existingIds, kind === "ending" ? "ending" : "scene", "node");
  return {
    id,
    kind,
    title: kind === "ending" ? "새 엔딩" : "새 장면",
    status: "outline",
    tags: [],
    speaker: "",
    text: {
      ko:
        kind === "ending"
          ? "[결말] 여기 도달했을 때 어떤 장면으로 마무리되는지 적으세요.\n[여운] 다음 회차를 유도할 힌트를 남기세요."
          : "[상황] 이 장면에서 플레이어가 마주하는 사건을 적으세요.\n[압박] 왜 바로 선택해야 하는지 적으세요.",
      en: "",
    },
    writer_note:
      kind === "ending"
        ? "짧은 엔딩도 괜찮습니다. 대신 결말의 감정은 분명하게 남기세요."
        : "장면 목표를 먼저 적고, 실제 서사는 나중에 채우세요.",
    next: "",
    choices: [],
  };
>>>>>>> Stashed changes
}

function renderProjectMeta() {
  els.projectTitle.value = state.project.meta.title || "";
  els.projectAuthor.value = state.project.meta.author || "";
<<<<<<< Updated upstream
=======
  els.projectPitch.value = state.project.meta.pitch || "";
>>>>>>> Stashed changes

  els.projectTitle.onchange = (event) => {
    state.project.meta.title = event.target.value;
    saveProject(state.project);
<<<<<<< Updated upstream
  };

=======
    renderNodeList();
  };
>>>>>>> Stashed changes
  els.projectAuthor.onchange = (event) => {
    state.project.meta.author = event.target.value;
    saveProject(state.project);
  };
<<<<<<< Updated upstream
=======
  els.projectPitch.onchange = (event) => {
    state.project.meta.pitch = event.target.value;
    saveProject(state.project);
  };
}

function renderStats() {
  if (!state.project.stats.length) {
    els.statsList.innerHTML = `<div class="empty-state">능력치를 추가하면 선택지 해금과 결과 보정에 쓸 수 있습니다.</div>`;
    return;
  }

  els.statsList.innerHTML = state.project.stats
    .map(
      (stat, index) => `
        <article class="stack-item" data-stat-index="${index}">
          <div class="stack-header">
            <div>
              <div class="stack-title">${escapeHtml(stat.label)}</div>
              <div class="stack-caption">${escapeHtml(stat.id)}</div>
            </div>
            <button class="btn btn-small btn-danger" type="button" data-action="delete-stat">삭제</button>
          </div>
          <div class="stack-meta">
            <input class="mini-input" data-field="label" type="text" value="${escapeAttr(stat.label)}" placeholder="표시 이름" />
            <input class="mini-input" data-field="id" type="text" value="${escapeAttr(stat.id)}" placeholder="id" />
            <input class="mini-input" data-field="default" type="number" value="${stat.default}" />
            <input class="mini-input" data-field="min" type="number" value="${stat.min}" />
            <input class="mini-input" data-field="max" type="number" value="${stat.max}" />
          </div>
        </article>
      `,
    )
    .join("");

  els.statsList.querySelectorAll("[data-stat-index]").forEach((item) => {
    const index = Number(item.dataset.statIndex);
    item.querySelectorAll("[data-field]").forEach((input) => {
      input.addEventListener("change", (event) => {
        const field = event.target.dataset.field;
        const previousId = field === "id" ? state.project.stats[index].id : "";
        state.project.stats[index][field] =
          field === "default" || field === "min" || field === "max"
            ? Number(event.target.value)
            : event.target.value;
        if (field === "id") syncStatIds(index, previousId);
        persistAndRender();
      });
    });

    item.querySelector('[data-action="delete-stat"]').addEventListener("click", () => {
      state.project.stats.splice(index, 1);
      pruneBrokenReferences();
      persistAndRender();
    });
  });
}

function renderFlags() {
  if (!state.project.flags.length) {
    els.flagsList.innerHTML = `<div class="empty-state">플래그를 추가하면 과거 선택 여부를 가볍게 기억시킬 수 있습니다.</div>`;
    return;
  }

  els.flagsList.innerHTML = state.project.flags
    .map(
      (flag, index) => `
        <article class="stack-item" data-flag-index="${index}">
          <div class="stack-header">
            <div>
              <div class="stack-title">${escapeHtml(flag.label)}</div>
              <div class="stack-caption">${escapeHtml(flag.id)}</div>
            </div>
            <button class="btn btn-small btn-danger" type="button" data-action="delete-flag">삭제</button>
          </div>
          <div class="stack-meta">
            <input class="mini-input" data-field="label" type="text" value="${escapeAttr(flag.label)}" placeholder="표시 이름" />
            <input class="mini-input" data-field="id" type="text" value="${escapeAttr(flag.id)}" placeholder="id" />
            <select class="mini-input" data-field="default">
              <option value="false" ${!flag.default ? "selected" : ""}>기본 false</option>
              <option value="true" ${flag.default ? "selected" : ""}>기본 true</option>
            </select>
          </div>
        </article>
      `,
    )
    .join("");

  els.flagsList.querySelectorAll("[data-flag-index]").forEach((item) => {
    const index = Number(item.dataset.flagIndex);
    item.querySelectorAll("[data-field]").forEach((input) => {
      input.addEventListener("change", (event) => {
        const field = event.target.dataset.field;
        const previousId = field === "id" ? state.project.flags[index].id : "";
        state.project.flags[index][field] =
          field === "default" ? event.target.value === "true" : event.target.value;
        if (field === "id") syncFlagIds(index, previousId);
        persistAndRender();
      });
    });

    item.querySelector('[data-action="delete-flag"]').addEventListener("click", () => {
      state.project.flags.splice(index, 1);
      pruneBrokenReferences();
      persistAndRender();
    });
  });
}

function getStatusLabel(status) {
  return NODE_STATUSES.find((item) => item.value === status)?.label || "구상";
}

function parseTagInput(value) {
  return normalizeNodeTags(
    String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

function getNodeChecklist(node) {
  const items = [];
  const hasText = Boolean(node.text.ko.trim());
  const hasTitle = Boolean(String(node.title || "").trim());
  const hasWriterNote = Boolean(node.writer_note.trim());
  const connectedChoices = node.choices.filter((choice) => choice.next);
  const brokenChoices = node.choices.filter((choice) => !choice.next || !choice.text.ko.trim());

  if (!hasTitle) items.push("제목 비어 있음");
  if (!hasText) items.push("본문 비어 있음");
  if (!hasWriterNote) items.push("작가 메모 없음");
  if (node.kind !== "ending" && !node.next && connectedChoices.length === 0) {
    items.push("다음 연결 없음");
  }
  if (node.kind !== "ending" && brokenChoices.length) {
    items.push(`미완성 선택지 ${brokenChoices.length}개`);
  }
  if (node.kind === "ending" && node.choices.length) {
    items.push("엔딩에 선택지 남음");
  }

  const completedSteps = [hasTitle, hasText, hasWriterNote, node.kind === "ending" || node.next || connectedChoices.length > 0].filter(Boolean).length;
  return {
    pendingCount: items.length,
    items,
    progress: completedSteps,
    progressTotal: 4,
  };
}

function getFilteredNodes() {
  const search = state.ui.nodeSearch.trim().toLowerCase();
  return state.project.nodes.filter((node) => {
    const checklist = getNodeChecklist(node);
    const matchesSearch =
      !search ||
      [node.id, node.title, node.speaker, ...(node.tags || [])]
        .join(" ")
        .toLowerCase()
        .includes(search);

    if (!matchesSearch) return false;

    if (state.ui.nodeFilter === "incomplete") return checklist.pendingCount > 0 || node.status !== "done";
    if (state.ui.nodeFilter === "done") return node.status === "done";
    if (state.ui.nodeFilter === "scene") return node.kind === "scene";
    if (state.ui.nodeFilter === "ending") return node.kind === "ending";
    if (state.ui.nodeFilter === "ready") return node.status === "ready";
    return true;
  });
>>>>>>> Stashed changes
}

function renderNodeList() {
  if (!state.project.nodes.length) {
    els.nodeList.innerHTML = `<div class="empty-state">장면이 없습니다. 새 장면을 추가하세요.</div>`;
    return;
  }

  els.nodeList.innerHTML = state.project.nodes
    .map((node) => {
      const selected = node.id === state.ui.selectedNodeId;
<<<<<<< Updated upstream
=======
      const choiceCount = node.kind === "ending" ? "엔딩" : `선택지 ${node.choices.length}개`;
>>>>>>> Stashed changes
      return `
        <article class="node-card ${selected ? "is-selected" : ""}" data-node-id="${escapeAttr(node.id)}">
          <button type="button">
            <div class="node-row">
              <strong>${escapeHtml(node.title || node.id)}</strong>
              <div class="button-row">
<<<<<<< Updated upstream
                ${node.id === state.project.meta.start_node_id ? `<span class="status-pill">시작</span>` : ""}
                <span class="kind-badge ${node.kind === "ending" ? "kind-ending" : ""}">${node.kind === "ending" ? "엔딩" : "장면"}</span>
              </div>
            </div>
            <p class="tiny-caption">${escapeHtml(node.id)}</p>
=======
                ${
                  node.id === state.project.meta.start_node_id
                    ? `<span class="status-pill">시작</span>`
                    : ""
                }
                <span class="kind-badge ${node.kind === "ending" ? "kind-ending" : "kind-scene"}">${node.kind === "ending" ? "엔딩" : "장면"}</span>
              </div>
            </div>
            <p class="tiny-caption">${escapeHtml(node.id)}</p>
            <p class="tiny-caption">${escapeHtml(choiceCount)}</p>
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
          <option value="scene" ${node.kind === "scene" ? "selected" : ""}>장면</option>
=======
          <option value="scene" ${node.kind === "scene" ? "selected" : ""}>일반 장면</option>
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
        <span>본문</span>
        <textarea id="node-text" rows="10">${escapeHtml(node.text)}</textarea>
      </label>
      <label class="field field-wide">
        <span>작가 메모</span>
        <textarea id="node-note" rows="4">${escapeHtml(node.writer_note)}</textarea>
=======
        <span>본문 (ko)</span>
        <textarea id="node-text" rows="10">${escapeHtml(node.text.ko)}</textarea>
      </label>
      <label class="field field-wide">
        <span>작가 메모</span>
        <textarea id="node-note" rows="5">${escapeHtml(node.writer_note)}</textarea>
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
      <button id="add-choice-btn" class="btn btn-small" type="button" ${node.kind === "ending" ? "disabled" : ""}>선택지 추가</button>
=======
      <button id="insert-template-btn" class="btn btn-small" type="button">${node.kind === "ending" ? "결말 틀 넣기" : "장면 틀 넣기"}</button>
      <button id="add-choice-btn" class="btn btn-small" type="button" ${node.kind === "ending" ? "disabled" : ""}>선택지 추가</button>
      <button id="duplicate-node-btn" class="btn btn-small btn-muted" type="button">장면 복제</button>
>>>>>>> Stashed changes
      <button id="delete-node-btn" class="btn btn-small btn-danger" type="button">장면 삭제</button>
    </div>

    <h3 class="editor-section-title">선택지</h3>
    <div id="choice-stack" class="choice-stack">
<<<<<<< Updated upstream
      ${node.kind === "ending" ? `<div class="empty-state">엔딩은 선택지를 두지 않습니다.</div>` : renderChoiceStack(node)}
=======
      ${
        node.kind === "ending"
          ? `<div class="empty-state">엔딩은 선택지를 두지 않는 편이 이번 툴의 단순화 방향과 잘 맞습니다.</div>`
          : renderChoiceStack(node)
      }
>>>>>>> Stashed changes
    </div>
  `;

  bindNodeEditorEvents(node);
}

function renderChoiceStack(node) {
  if (!node.choices.length) {
<<<<<<< Updated upstream
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
=======
    return `<div class="empty-state">선택지가 없으면 기본 다음 장면만 써도 됩니다. 필요할 때만 추가하세요.</div>`;
  }

  return node.choices
    .map((choice, choiceIndex) => {
      return `
        <article class="choice-card" data-choice-index="${choiceIndex}">
          <div class="choice-header">
            <div>
              <strong>${escapeHtml(choice.text.ko || `선택지 ${choiceIndex + 1}`)}</strong>
              <p class="tiny-caption">${escapeHtml(choice.id)}</p>
            </div>
            <button class="btn btn-small btn-danger" type="button" data-action="delete-choice">선택지 삭제</button>
          </div>

>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
              <span>선택지 문장</span>
              <textarea data-field="text" rows="3">${escapeHtml(choice.text)}</textarea>
=======
              <span>선택지 문장 (ko)</span>
              <textarea data-field="text" rows="3">${escapeHtml(choice.text.ko)}</textarea>
>>>>>>> Stashed changes
            </label>
            <label class="field field-wide">
              <span>작가 메모</span>
              <textarea data-field="writer_note" rows="3">${escapeHtml(choice.writer_note)}</textarea>
            </label>
          </div>
<<<<<<< Updated upstream
        </article>
      `,
    )
=======

          <div class="substack">
            <div class="substack-head">
              <h4>해금 조건</h4>
              <button class="btn btn-small" type="button" data-action="add-requirement">조건 추가</button>
            </div>
            <div class="substack">
              ${renderRequirementCards(choice.requirements)}
            </div>
          </div>

          <div class="substack">
            <div class="substack-head">
              <h4>결과 효과</h4>
              <button class="btn btn-small" type="button" data-action="add-effect">효과 추가</button>
            </div>
            <div class="substack">
              ${renderEffectCards(choice.effects)}
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderRequirementCards(requirements) {
  if (!requirements.length) {
    return `<div class="empty-state">조건이 없으면 항상 보입니다.</div>`;
  }

  return requirements
    .map((rule, ruleIndex) => {
      const statOptions = state.project.stats
        .map((stat) => `<option value="${escapeAttr(stat.id)}" ${stat.id === rule.stat_id ? "selected" : ""}>${escapeHtml(stat.label)}</option>`)
        .join("");
      const flagOptions = state.project.flags
        .map((flag) => `<option value="${escapeAttr(flag.id)}" ${flag.id === rule.flag_id ? "selected" : ""}>${escapeHtml(flag.label)}</option>`)
        .join("");

      return `
        <div class="rule-card" data-rule-type="requirement" data-rule-index="${ruleIndex}">
          <div class="rule-header">
            <strong>${rule.type === "stat_at_least" ? "능력치 조건" : "플래그 조건"}</strong>
            <button class="btn btn-small btn-danger" type="button" data-action="delete-rule">삭제</button>
          </div>
          <div class="rule-grid">
            <label class="field">
              <span>종류</span>
              <select data-field="type">
                <option value="stat_at_least" ${rule.type === "stat_at_least" ? "selected" : ""}>능력치 이상</option>
                <option value="flag_on" ${rule.type === "flag_on" ? "selected" : ""}>플래그 true</option>
                <option value="flag_off" ${rule.type === "flag_off" ? "selected" : ""}>플래그 false</option>
              </select>
            </label>
            <label class="field">
              <span>${rule.type === "stat_at_least" ? "능력치" : "플래그"}</span>
              ${
                rule.type === "stat_at_least"
                  ? `<select data-field="stat_id"><option value="">선택</option>${statOptions}</select>`
                  : `<select data-field="flag_id"><option value="">선택</option>${flagOptions}</select>`
              }
            </label>
            ${
              rule.type === "stat_at_least"
                ? `<label class="field"><span>최소값</span><input data-field="value" type="number" value="${Number(rule.value) || 0}" /></label>`
                : ""
            }
          </div>
        </div>
      `;
    })
    .join("");
}

function renderEffectCards(effects) {
  if (!effects.length) {
    return `<div class="empty-state">효과가 없으면 이야기만 이동합니다.</div>`;
  }

  return effects
    .map((effect, effectIndex) => {
      const statOptions = state.project.stats
        .map((stat) => `<option value="${escapeAttr(stat.id)}" ${stat.id === effect.stat_id ? "selected" : ""}>${escapeHtml(stat.label)}</option>`)
        .join("");
      const flagOptions = state.project.flags
        .map((flag) => `<option value="${escapeAttr(flag.id)}" ${flag.id === effect.flag_id ? "selected" : ""}>${escapeHtml(flag.label)}</option>`)
        .join("");

      return `
        <div class="rule-card" data-rule-type="effect" data-rule-index="${effectIndex}">
          <div class="rule-header">
            <strong>${effect.type === "change_stat" ? "능력치 변화" : "플래그 설정"}</strong>
            <button class="btn btn-small btn-danger" type="button" data-action="delete-rule">삭제</button>
          </div>
          <div class="rule-grid">
            <label class="field">
              <span>종류</span>
              <select data-field="type">
                <option value="change_stat" ${effect.type === "change_stat" ? "selected" : ""}>능력치 증감</option>
                <option value="set_flag" ${effect.type === "set_flag" ? "selected" : ""}>플래그 설정</option>
              </select>
            </label>
            <label class="field">
              <span>${effect.type === "change_stat" ? "능력치" : "플래그"}</span>
              ${
                effect.type === "change_stat"
                  ? `<select data-field="stat_id"><option value="">선택</option>${statOptions}</select>`
                  : `<select data-field="flag_id"><option value="">선택</option>${flagOptions}</select>`
              }
            </label>
            ${
              effect.type === "change_stat"
                ? `<label class="field"><span>변화량</span><input data-field="value" type="number" value="${Number(effect.value) || 0}" /></label>`
                : `<label class="field"><span>설정값</span><select data-field="value"><option value="true" ${effect.value ? "selected" : ""}>true</option><option value="false" ${!effect.value ? "selected" : ""}>false</option></select></label>`
            }
          </div>
        </div>
      `;
    })
>>>>>>> Stashed changes
    .join("");
}

function bindNodeEditorEvents(node) {
  const nodeIdInput = document.getElementById("node-id");
  const nodeKindInput = document.getElementById("node-kind");
  const nodeTitleInput = document.getElementById("node-title");
<<<<<<< Updated upstream
  const nodeSpeakerInput = document.getElementById("node-speaker");
  const nodeTextInput = document.getElementById("node-text");
  const nodeNoteInput = document.getElementById("node-note");
  const nodeNextInput = document.getElementById("node-next");
  const setStartNodeBtn = document.getElementById("set-start-node-btn");
  const addChoiceBtn = document.getElementById("add-choice-btn");
  const deleteNodeBtn = document.getElementById("delete-node-btn");
=======
  const nodeStatusInput = document.getElementById("node-status");
  const nodeSpeakerInput = document.getElementById("node-speaker");
  const nodeTagsInput = document.getElementById("node-tags");
  const nodeTextInput = document.getElementById("node-text");
  const nodeNoteInput = document.getElementById("node-note");
  const nodeNextInput = document.getElementById("node-next");
  const insertTemplateBtn = document.getElementById("insert-template-btn");
  const addChoiceBtn = document.getElementById("add-choice-btn");
  const duplicateNodeBtn = document.getElementById("duplicate-node-btn");
  const deleteNodeBtn = document.getElementById("delete-node-btn");
  const setStartNodeBtn = document.getElementById("set-start-node-btn");
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
    if (state.playtest.currentNodeId === node.id) renderPlaytest();
=======
    renderWritingProgress();
  });

  nodeStatusInput?.addEventListener("change", (event) => {
    node.status = normalizeNodeStatus(event.target.value);
    persistAndRender();
>>>>>>> Stashed changes
  });

  nodeSpeakerInput.addEventListener("input", (event) => {
    node.speaker = event.target.value;
    saveProject(state.project);
<<<<<<< Updated upstream
    if (state.playtest.currentNodeId === node.id) renderPlaytest();
  });

  nodeTextInput.addEventListener("input", (event) => {
    node.text = event.target.value;
    saveProject(state.project);
    if (state.playtest.currentNodeId === node.id) renderPlaytest();
=======
  });

  nodeTagsInput?.addEventListener("change", (event) => {
    node.tags = parseTagInput(event.target.value);
    persistAndRender();
  });

  nodeTextInput.addEventListener("input", (event) => {
    node.text.ko = event.target.value;
    saveProject(state.project);
    renderNodeList();
    renderWritingProgress();
>>>>>>> Stashed changes
  });

  nodeNoteInput.addEventListener("input", (event) => {
    node.writer_note = event.target.value;
    saveProject(state.project);
<<<<<<< Updated upstream
=======
    renderNodeList();
    renderWritingProgress();
>>>>>>> Stashed changes
  });

  nodeNextInput?.addEventListener("change", (event) => {
    node.next = event.target.value;
<<<<<<< Updated upstream
=======
    saveProject(state.project);
    renderNodeList();
    renderWritingProgress();
    renderAuditPanels();
  });

  insertTemplateBtn.addEventListener("click", () => {
    if (node.kind === "ending") {
      node.text.ko =
        "[결말 상황] 여기까지 오게 된 마지막 장면을 적으세요.\n[감정의 마감] 플레이어가 어떤 기분으로 끝나는지 적으세요.\n[다음 회차 힌트] 다시 해보면 달라질 만한 떡밥을 남기세요.";
      node.writer_note =
        "엔딩은 짧아도 됩니다. 대신 왜 이 결말이 나왔는지, 무엇이 남는지는 분명하게 써 주세요.";
    } else {
      node.text.ko =
        "[상황] 지금 벌어진 사건을 적으세요.\n[감각 묘사] 공간, 소리, 분위기를 두세 줄로 적으세요.\n[선택 직전 압박] 플레이어가 왜 당장 결정을 내려야 하는지 적으세요.";
      node.writer_note =
        "장면 하나는 사건 하나만 담당합니다. 설명을 몰아넣기보다 선택 직전의 긴장만 분명하게 남기세요.";
    }
>>>>>>> Stashed changes
    persistAndRender();
  });

  setStartNodeBtn.addEventListener("click", () => {
    state.project.meta.start_node_id = node.id;
    persistAndRender();
  });

  addChoiceBtn?.addEventListener("click", () => {
<<<<<<< Updated upstream
    const choice = createChoice(node);
    node.choices.push(choice);
    renderSceneEditor();
    saveProject(state.project);
    if (state.playtest.currentNodeId === node.id) renderPlaytest();
    renderNodeList();
=======
    const existingIds = node.choices.map((choice) => choice.id);
    node.choices.push({
      id: ensureUniqueId(existingIds, "choice", "choice"),
      text: bundleText("새 선택지"),
      writer_note: "",
      next: "",
      requirements: [],
      effects: [],
    });
    persistAndRender();
  });

  duplicateNodeBtn.addEventListener("click", () => {
    const cloned = deepClone(node);
    cloned.id = ensureUniqueId(
      state.project.nodes.map((item) => item.id),
      `${node.id}-copy`,
      "node",
    );
    cloned.title = `${node.title} 복제`;
    cloned.choices = cloned.choices.map((choice, index) => ({
      ...choice,
      id: `${choice.id}-copy-${index + 1}`,
    }));
    state.project.nodes.push(cloned);
    state.ui.selectedNodeId = cloned.id;
    persistAndRender();
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    pruneProject(state.project);
=======
    pruneBrokenReferences();
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
        choice[field] = event.target.value;
        saveProject(state.project);
        if (state.playtest.currentNodeId === node.id) renderPlaytest();
        renderNodeList();
=======
        if (field === "text") {
          choice.text.ko = event.target.value;
        } else {
          choice[field] = event.target.value;
        }
        saveProject(state.project);
        renderNodeList();
        renderWritingProgress();
        renderAuditPanels();
>>>>>>> Stashed changes
      });
    });

    choiceCard.querySelectorAll("textarea[data-field]").forEach((input) => {
      input.addEventListener("input", (event) => {
        const field = event.target.dataset.field;
<<<<<<< Updated upstream
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
=======
        if (field === "text") {
          choice.text.ko = event.target.value;
        } else {
          choice[field] = event.target.value;
        }
        saveProject(state.project);
        renderNodeList();
        renderWritingProgress();
      });
    });

    choiceCard
      .querySelector('[data-action="delete-choice"]')
      .addEventListener("click", () => {
        node.choices.splice(choiceIndex, 1);
        persistAndRender();
      });

    choiceCard
      .querySelector('[data-action="add-requirement"]')
      .addEventListener("click", () => {
        choice.requirements.push({
          type: "stat_at_least",
          stat_id: state.project.stats[0]?.id || "",
          flag_id: "",
          value: 1,
        });
        persistAndRender();
      });

    choiceCard
      .querySelector('[data-action="add-effect"]')
      .addEventListener("click", () => {
        choice.effects.push({
          type: "change_stat",
          stat_id: state.project.stats[0]?.id || "",
          flag_id: "",
          value: 1,
        });
        persistAndRender();
      });

    bindRuleEditor(choiceCard, choice);
  });
}

function bindRuleEditor(choiceCard, choice) {
  choiceCard.querySelectorAll('[data-rule-type="requirement"]').forEach((ruleCard) => {
    const index = Number(ruleCard.dataset.ruleIndex);
    const rule = choice.requirements[index];
    if (!rule) return;
    ruleCard.querySelectorAll("[data-field]").forEach((input) => {
      input.addEventListener("change", (event) => {
        const field = event.target.dataset.field;
        if (field === "type") {
          rule.type = event.target.value;
          if (rule.type === "stat_at_least") {
            rule.stat_id = state.project.stats[0]?.id || "";
            rule.flag_id = "";
            rule.value = Number.isFinite(rule.value) ? rule.value : 1;
          } else {
            rule.flag_id = state.project.flags[0]?.id || "";
            rule.stat_id = "";
          }
        } else if (field === "value") {
          rule.value = Number(event.target.value);
        } else {
          rule[field] = event.target.value;
        }
        persistAndRender();
      });
    });

    ruleCard
      .querySelector('[data-action="delete-rule"]')
      .addEventListener("click", () => {
        choice.requirements.splice(index, 1);
        persistAndRender();
      });
  });

  choiceCard.querySelectorAll('[data-rule-type="effect"]').forEach((ruleCard) => {
    const index = Number(ruleCard.dataset.ruleIndex);
    const rule = choice.effects[index];
    if (!rule) return;
    ruleCard.querySelectorAll("[data-field]").forEach((input) => {
      input.addEventListener("change", (event) => {
        const field = event.target.dataset.field;
        if (field === "type") {
          rule.type = event.target.value;
          if (rule.type === "change_stat") {
            rule.stat_id = state.project.stats[0]?.id || "";
            rule.flag_id = "";
            rule.value = Number.isFinite(Number(rule.value)) ? Number(rule.value) : 1;
          } else {
            rule.flag_id = state.project.flags[0]?.id || "";
            rule.stat_id = "";
            rule.value = Boolean(rule.value);
          }
        } else if (field === "value") {
          rule.value = rule.type === "set_flag" ? event.target.value === "true" : Number(event.target.value);
        } else {
          rule[field] = event.target.value;
        }
        persistAndRender();
      });
    });

    ruleCard
      .querySelector('[data-action="delete-rule"]')
      .addEventListener("click", () => {
        choice.effects.splice(index, 1);
        persistAndRender();
      });
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
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
=======
function pruneBrokenReferences() {
  const validNodeIds = new Set(state.project.nodes.map((item) => item.id));
  const validStatIds = new Set(state.project.stats.map((item) => item.id));
  const validFlagIds = new Set(state.project.flags.map((item) => item.id));

  state.project.nodes.forEach((node) => {
    if (!validNodeIds.has(node.next)) node.next = "";
    node.choices = node.choices.map((choice) => ({
      ...choice,
      next: validNodeIds.has(choice.next) ? choice.next : "",
      requirements: choice.requirements.filter((rule) => {
        if (rule.type === "stat_at_least") return validStatIds.has(rule.stat_id);
        return validFlagIds.has(rule.flag_id);
      }),
      effects: choice.effects.filter((effect) => {
        if (effect.type === "change_stat") return validStatIds.has(effect.stat_id);
        return validFlagIds.has(effect.flag_id);
      }),
    }));
  });

  if (!validNodeIds.has(state.project.meta.start_node_id)) {
    state.project.meta.start_node_id = state.project.nodes[0]?.id || "";
  }
}

function syncStatIds(index, previousId) {
  const stat = state.project.stats[index];
  const nextId = ensureUniqueId(
    state.project.stats
      .map((item, itemIndex) => (itemIndex === index ? null : item.id))
      .filter(Boolean),
    stat.id,
    "stat",
  );
  if (previousId === nextId) return;
  stat.id = nextId;
  state.project.nodes.forEach((node) => {
    node.choices.forEach((choice) => {
      choice.requirements.forEach((rule) => {
        if (rule.stat_id === previousId) rule.stat_id = nextId;
      });
      choice.effects.forEach((effect) => {
        if (effect.stat_id === previousId) effect.stat_id = nextId;
      });
    });
  });
}

function syncFlagIds(index, previousId) {
  const flag = state.project.flags[index];
  const nextId = ensureUniqueId(
    state.project.flags
      .map((item, itemIndex) => (itemIndex === index ? null : item.id))
      .filter(Boolean),
    flag.id,
    "flag",
  );
  if (previousId === nextId) return;
  flag.id = nextId;
  state.project.nodes.forEach((node) => {
    node.choices.forEach((choice) => {
      choice.requirements.forEach((rule) => {
        if (rule.flag_id === previousId) rule.flag_id = nextId;
      });
      choice.effects.forEach((effect) => {
        if (effect.flag_id === previousId) effect.flag_id = nextId;
      });
    });
  });
}

function renderValidation(validation) {
  const summary = [
    { label: "장면 수", value: validation.summary.nodeCount },
    { label: "선택지 수", value: validation.summary.choiceCount },
    { label: "엔딩 수", value: validation.summary.endingCount },
    { label: "도달 엔딩", value: validation.summary.reachableEndingCount },
    { label: "도달 불가", value: validation.summary.unreachableCount },
    { label: "막힌 장면", value: validation.summary.danglingCount },
  ];

  const summaryHtml = summary
    .map(
      (item) => `
        <div class="status-card">
          <div class="stack-title">${escapeHtml(String(item.value))}</div>
          <div class="stack-caption">${escapeHtml(item.label)}</div>
        </div>
      `,
    )
    .join("");

  const issueHtml = (items, tone, emptyTitle, emptyCopy) => {
    if (!items.length) {
      return `<div class="status-card"><span class="validation-pill is-ok">${emptyTitle}</span><p class="muted-copy">${emptyCopy}</p></div>`;
    }

    const visible = items.slice(0, 4);
    const cards = visible
      .map(
        (item) => `
          <div class="status-card">
            <span class="validation-pill ${tone === "error" ? "is-error" : "is-warn"}">${tone === "error" ? "오류" : "주의"}</span>
            <p class="muted-copy">${escapeHtml(item)}</p>
          </div>
        `,
      )
      .join("");

    const hidden = items.length - visible.length;
    if (hidden <= 0) return cards;
    return `${cards}<div class="status-card"><span class="validation-pill is-warn">더 있음</span><p class="muted-copy">추가 이슈 ${hidden}개는 구조 개요와 편집 화면에서 이어서 정리해 주세요.</p></div>`;
  };

  els.validationSummary.innerHTML = `
    <div class="validation-stack">
      <div class="status-row compact">${summaryHtml}</div>
      ${issueHtml(validation.errors, "error", "통과", "치명적 구조 오류가 없습니다.")}
      ${issueHtml(validation.warnings, "warn", "양호", "현재 경고가 없습니다.")}
    </div>
  `;
}

function renderFlowOverview(validation) {
  if (!validation.routes.length) {
    els.flowOverview.innerHTML = `<div class="empty-state">장면을 추가하면 흐름 지도가 여기에 보입니다.</div>`;
    return;
  }

  const routeCards = validation.routes
    .map((route) => {
      const tags = [];
      if (route.isStart) tags.push(`<span class="validation-pill is-ok">시작</span>`);
      if (!route.reachable) tags.push(`<span class="validation-pill is-error">도달 불가</span>`);
      if (route.hasMixedExit) tags.push(`<span class="validation-pill is-warn">직행+선택 혼합</span>`);
      if (route.hasTooManyChoices) tags.push(`<span class="validation-pill is-warn">선택지 많음</span>`);
      if (route.isDangling) tags.push(`<span class="validation-pill is-warn">막힘</span>`);
      if (route.hasMultipleParents) tags.push(`<span class="validation-pill is-warn">다중 부모</span>`);

      const targets = route.targets.length
        ? route.targets
            .map((target) => `<span class="flow-target">${escapeHtml(target.title)} <code>${escapeHtml(target.id)}</code></span>`)
            .join("")
        : `<span class="flow-target is-terminal">${route.kind === "ending" ? "엔딩 종료" : "연결 없음"}</span>`;

      return `
        <article class="flow-card ${route.reachable ? "" : "is-unreachable"} ${route.isStart ? "is-start" : ""}">
          <div class="flow-head">
            <div>
              <div class="stack-title">${escapeHtml(route.title)}</div>
              <div class="stack-caption"><code>${escapeHtml(route.id)}</code> · 진입 ${route.incomingCount} · 선택 ${route.choiceCount}</div>
            </div>
            <span class="kind-badge ${route.kind === "ending" ? "kind-ending" : "kind-scene"}">${route.kind === "ending" ? "엔딩" : "장면"}</span>
          </div>
          <div class="flow-tags">${tags.join("") || `<span class="validation-pill is-ok">정상</span>`}</div>
          <div class="flow-targets">${targets}</div>
        </article>
      `;
    })
    .join("");

  els.flowOverview.innerHTML = `
    <div class="flow-stack">
      <div class="status-card">
        <div class="stack-title">${escapeHtml(validation.summary.startTitle || "시작 장면 없음")}</div>
        <div class="muted-copy">현재 시작 ID: <code>${escapeHtml(validation.summary.startNodeId || "none")}</code></div>
      </div>
      <div class="flow-list">${routeCards}</div>
    </div>
  `;
}

function renderImportSummary() {
  const summary =
    state.ui.lastImportSummary ||
    (state.project.meta.import_source_format
      ? {
          format: state.project.meta.import_source_format,
          formatLabel: state.project.meta.import_source_format === "legacy-ugc-graph" ? "60sec UGC 그래프 JSON" : "단순 프레임 JSON",
          description:
            state.project.meta.import_source_format === "legacy-ugc-graph"
              ? "이 프로젝트는 60sec Choice Game UGC 그래프에서 변환되어 저장되었습니다."
              : "이 프로젝트는 현재 프레임 포맷으로 저장되었습니다.",
          counts: {
            originalNodes: state.project.nodes.length,
            originalEdges: 0,
            frameNodes: state.project.nodes.length,
            stats: state.project.stats.length,
            flags: state.project.flags.length,
          },
          notes: [],
          hiddenNoteCount: 0,
        }
      : null);

  if (!summary) {
    els.importSummary.innerHTML = `
      <div class="hint-stack">
        <div class="status-card">
          <div class="stack-title">자동 감지 대기</div>
          <p class="muted-copy">같은 불러오기 버튼에서 현재 프레임 JSON과 60sec UGC 그래프 JSON을 함께 감지합니다.</p>
        </div>
        <div class="status-card">
          <div class="stack-title">런타임 내보내기</div>
          <p class="muted-copy"><code>런타임 JSON</code> 버튼은 작가 메모를 제외한 가벼운 실행용 데이터만 떨궈 줍니다.</p>
        </div>
      </div>
    `;
    return;
  }

  const countCards = [
    { label: "원본 노드", value: summary.counts?.originalNodes ?? 0 },
    { label: "원본 엣지", value: summary.counts?.originalEdges ?? 0 },
    { label: "현재 장면", value: summary.counts?.frameNodes ?? 0 },
    { label: "플래그", value: summary.counts?.flags ?? 0 },
  ]
    .map(
      (item) => `
        <div class="status-card">
          <div class="stack-title">${escapeHtml(String(item.value))}</div>
          <div class="stack-caption">${escapeHtml(item.label)}</div>
        </div>
      `,
    )
    .join("");

  const notes = Array.isArray(summary.notes) && summary.notes.length
    ? summary.notes
        .map((note) => `<div class="status-card"><span class="validation-pill is-warn">메모</span><p class="muted-copy">${escapeHtml(note)}</p></div>`)
        .join("")
    : `<div class="status-card"><span class="validation-pill is-ok">정리 완료</span><p class="muted-copy">가져오기 후 별도 정리 메모가 없습니다.</p></div>`;

  const extraNotes =
    Number(summary.hiddenNoteCount || 0) > 0
      ? `<div class="status-card"><span class="validation-pill is-warn">추가</span><p class="muted-copy">가져오기 메모 ${summary.hiddenNoteCount}개가 더 있습니다. 필요한 경우 장면 메모에서 다시 정리해 주세요.</p></div>`
      : "";

  els.importSummary.innerHTML = `
    <div class="hint-stack">
      <div class="status-card">
        <div class="stack-title">${escapeHtml(summary.formatLabel || "가져오기 정보")}</div>
        <p class="muted-copy">${escapeHtml(summary.description || "")}</p>
      </div>
      <div class="status-row compact">${countCards}</div>
      ${notes}
      ${extraNotes}
    </div>
  `;
}

function validateProject(project) {
  const errors = [];
  const warnings = [];
  const nodeMap = new Map();
  const indegree = new Map();
  const adjacency = new Map();
  let choiceCount = 0;
  let endingCount = 0;
  let danglingCount = 0;
  let reachableEndingCount = 0;

  project.nodes.forEach((node) => {
    if (!node.id) {
      errors.push("ID가 비어 있는 장면이 있습니다.");
      return;
    }
    if (nodeMap.has(node.id)) {
      errors.push(`중복 장면 ID: ${node.id}`);
      return;
    }
    nodeMap.set(node.id, node);
    indegree.set(node.id, 0);
    adjacency.set(node.id, []);
    if (node.kind === "ending") endingCount += 1;
    choiceCount += node.choices.length;
    if (!node.text.ko.trim()) {
      warnings.push(`${node.id} 장면의 본문이 비어 있습니다.`);
    }
  });

  if (!project.meta.start_node_id) {
    errors.push("시작 장면이 지정되지 않았습니다.");
  } else if (!nodeMap.has(project.meta.start_node_id)) {
    errors.push(`시작 장면을 찾을 수 없습니다: ${project.meta.start_node_id}`);
  }

  project.nodes.forEach((node) => {
    if (node.next) {
      if (!nodeMap.has(node.next)) {
        errors.push(`${node.id}의 기본 다음 장면(${node.next})을 찾을 수 없습니다.`);
      } else {
        indegree.set(node.next, (indegree.get(node.next) || 0) + 1);
        adjacency.get(node.id)?.push(node.next);
      }
    }

    if (node.kind === "ending" && (node.next || node.choices.length)) {
      warnings.push(`${node.id} 엔딩 장면에 다음 연결이나 선택지가 남아 있습니다.`);
    }

    if (node.kind !== "ending" && node.next && node.choices.length) {
      warnings.push(`${node.id} 장면은 기본 다음 장면과 선택지를 함께 가지고 있습니다.`);
    }

    if (node.kind !== "ending" && node.choices.length > 3) {
      warnings.push(`${node.id} 장면의 선택지가 ${node.choices.length}개입니다. 이번 툴은 2~3개 정도가 적당합니다.`);
    }

    if (node.kind !== "ending" && !node.next && !node.choices.some((choice) => choice.next)) {
      warnings.push(`${node.id} 장면은 다음 연결이 없어 여기서 막힙니다.`);
      danglingCount += 1;
    }

    node.choices.forEach((choice) => {
      if (!choice.text.ko.trim()) {
        warnings.push(`${node.id}의 선택지 ${choice.id} 문장이 비어 있습니다.`);
      }
      if (choice.requirements.length > 2) {
        warnings.push(`${node.id}의 선택지 ${choice.id}는 조건이 ${choice.requirements.length}개라 단순 프레임 기준을 넘습니다.`);
      }
      if (choice.effects.length > 2) {
        warnings.push(`${node.id}의 선택지 ${choice.id}는 효과가 ${choice.effects.length}개라 정리가 필요합니다.`);
      }
      if (!choice.next) {
        warnings.push(`${node.id}의 선택지 ${choice.id}는 다음 장면 연결이 없습니다.`);
      } else if (!nodeMap.has(choice.next)) {
        errors.push(`${node.id}의 선택지 ${choice.id}가 가리키는 장면(${choice.next})이 없습니다.`);
      } else {
        indegree.set(choice.next, (indegree.get(choice.next) || 0) + 1);
        adjacency.get(node.id)?.push(choice.next);
      }
    });
  });

  if (endingCount === 0) {
    errors.push("최소 한 개의 엔딩 장면이 필요합니다.");
  }

  indegree.forEach((degree, nodeId) => {
    if (nodeId === project.meta.start_node_id) return;
    if (degree > 1) warnings.push(`단순 트리 기준을 넘는 다중 부모 장면: ${nodeId}`);
  });

  const reachable = new Set();
  if (nodeMap.has(project.meta.start_node_id)) {
    walkProject(project.meta.start_node_id, nodeMap, reachable);
  }
  nodeMap.forEach((node, nodeId) => {
    if (!reachable.has(nodeId)) warnings.push(`도달 불가 장면: ${nodeId}`);
    if (node.kind === "ending" && reachable.has(nodeId)) reachableEndingCount += 1;
  });

  if (endingCount > 0 && reachableEndingCount === 0) {
    errors.push("시작점에서 닿는 엔딩 장면이 없습니다.");
  }

  const visiting = new Set();
  const visited = new Set();
  function dfs(nodeId) {
    if (visiting.has(nodeId)) {
      errors.push(`순환 연결 감지: ${nodeId}`);
      return;
    }
    if (visited.has(nodeId)) return;
    visiting.add(nodeId);
    (adjacency.get(nodeId) || []).forEach((childId) => dfs(childId));
    visiting.delete(nodeId);
    visited.add(nodeId);
  }
  if (nodeMap.has(project.meta.start_node_id)) {
    dfs(project.meta.start_node_id);
  }

  const routes = project.nodes.map((node) => {
    const targets = [];
    if (node.next && nodeMap.has(node.next)) {
      targets.push(nodeMap.get(node.next));
    }
    node.choices.forEach((choice) => {
      if (choice.next && nodeMap.has(choice.next) && !targets.some((target) => target.id === choice.next)) {
        targets.push(nodeMap.get(choice.next));
      }
    });

    return {
      id: node.id,
      title: node.title || node.id,
      kind: node.kind,
      incomingCount: indegree.get(node.id) || 0,
      choiceCount: node.choices.length,
      reachable: reachable.has(node.id),
      isStart: node.id === project.meta.start_node_id,
      isDangling: node.kind !== "ending" && !node.next && !node.choices.some((choice) => choice.next),
      hasMixedExit: Boolean(node.next && node.choices.length),
      hasTooManyChoices: node.kind !== "ending" && node.choices.length > 3,
      hasMultipleParents: (indegree.get(node.id) || 0) > 1 && node.id !== project.meta.start_node_id,
      targets: targets.map((target) => ({
        id: target.id,
        title: target.title || target.id,
      })),
    };
  });

  return {
    errors,
    warnings,
    routes,
    summary: {
      nodeCount: project.nodes.length,
      choiceCount,
      endingCount,
      reachableEndingCount,
      unreachableCount: project.nodes.filter((node) => !reachable.has(node.id)).length,
      danglingCount,
      startNodeId: project.meta.start_node_id || "",
      startTitle: nodeMap.get(project.meta.start_node_id)?.title || "",
    },
  };
}

function walkProject(startId, nodeMap, visited) {
  if (!startId || visited.has(startId)) return;
  visited.add(startId);
  const node = nodeMap.get(startId);
  if (!node) return;
  if (node.next) walkProject(node.next, nodeMap, visited);
  node.choices.forEach((choice) => {
    if (choice.next) walkProject(choice.next, nodeMap, visited);
  });
}

function createPlaytestState(project) {
  const stats = {};
  project.stats.forEach((stat) => {
    stats[stat.id] = Number(stat.default) || 0;
  });

  const flags = {};
  project.flags.forEach((flag) => {
    flags[flag.id] = Boolean(flag.default);
  });

  return {
    currentNodeId: project.meta.start_node_id || project.nodes[0]?.id || "",
    stats,
    flags,
    history: [],
    completed: false,
>>>>>>> Stashed changes
  };
}

function renderPlaytest() {
  const node = state.project.nodes.find((item) => item.id === state.playtest.currentNodeId);
  if (!node) {
    els.playtestPanel.innerHTML = `
      <div class="playtest-card-inner">
<<<<<<< Updated upstream
        <div class="empty-state">시작 장면을 찾을 수 없습니다.</div>
=======
        <div class="empty-state">시작 장면이 비어 있거나 잘못되어 플레이테스트를 시작할 수 없습니다.</div>
>>>>>>> Stashed changes
      </div>
    `;
    return;
  }

<<<<<<< Updated upstream
  const isEnding = node.kind === "ending" || (!node.choices.length && !node.next);
  const actionsHtml = isEnding
    ? `<button class="btn btn-strong playtest-choice" type="button" data-action="restart">처음부터</button>`
    : node.choices.length
      ? node.choices
          .map(
            (choice, index) => `
              <button class="btn playtest-choice" type="button" data-choice-index="${index}">
                ${escapeHtml(choice.text || `선택지 ${index + 1}`)}
=======
  const visibleChoices = node.choices.filter((choice) => choice.requirements.every((rule) => evaluateRequirement(rule)));
  const isEnding = node.kind === "ending" || (!visibleChoices.length && !node.next);

  const statPills = Object.entries(state.playtest.stats)
    .map(([id, value]) => {
      const label = state.project.stats.find((item) => item.id === id)?.label || id;
      return `<span class="status-pill">${escapeHtml(label)} ${escapeHtml(String(value))}</span>`;
    })
    .join("");

  const flagPills = Object.entries(state.playtest.flags)
    .filter(([, value]) => Boolean(value))
    .map(([id]) => {
      const label = state.project.flags.find((item) => item.id === id)?.label || id;
      return `<span class="status-pill">${escapeHtml(label)}</span>`;
    })
    .join("");

  const actionsHtml = isEnding
    ? `<button class="btn btn-strong playtest-choice" type="button" data-playtest-action="restart">다시 시작</button>`
    : visibleChoices.length
      ? visibleChoices
          .map(
            (choice, index) => `
              <button class="btn playtest-choice" type="button" data-choice-index="${index}">
                ${escapeHtml(choice.text.ko || `선택지 ${index + 1}`)}
>>>>>>> Stashed changes
              </button>
            `,
          )
          .join("")
<<<<<<< Updated upstream
      : `<button class="btn btn-strong playtest-choice" type="button" data-action="next">다음 장면</button>`;
=======
      : `<button class="btn btn-strong playtest-choice" type="button" data-playtest-action="next">다음 장면</button>`;

  const historyHtml = state.playtest.history.length
    ? state.playtest.history
        .slice()
        .reverse()
        .map(
          (entry) => `
            <div class="status-card">
              <div class="stack-title">${escapeHtml(entry.title)}</div>
              <div class="stack-caption">${escapeHtml(entry.detail)}</div>
            </div>
          `,
        )
        .join("")
    : `<div class="status-card"><div class="stack-caption">아직 기록이 없습니다.</div></div>`;
>>>>>>> Stashed changes

  els.playtestPanel.innerHTML = `
    <div class="playtest-card-inner">
      <div class="playtest-head">
        <div>
<<<<<<< Updated upstream
          <span class="kind-badge ${node.kind === "ending" ? "kind-ending" : ""}">${node.kind === "ending" ? "엔딩" : "장면"}</span>
          <h3 class="playtest-title">${escapeHtml(node.title || node.id)}</h3>
        </div>
        <div class="tiny-caption">${escapeHtml(node.speaker || "화자 없음")}</div>
      </div>
      <div class="playtest-body">${escapeHtml(node.text || "")}</div>
      <div class="playtest-actions">${actionsHtml}</div>
=======
          <span class="status-pill">${node.kind === "ending" ? "엔딩" : "장면"}</span>
          <h3 class="playtest-title">${escapeHtml(node.title || node.id)}</h3>
        </div>
        <div class="tiny-caption">${escapeHtml(node.speaker || "시스템")}</div>
      </div>
      <div class="playtest-body">${escapeHtml(node.text.ko || "")}</div>
      <div class="playtest-stats">${statPills || `<span class="status-pill">능력치 없음</span>`}</div>
      <div class="playtest-flags">${flagPills || `<span class="status-pill">활성 플래그 없음</span>`}</div>
      <div class="playtest-actions">${actionsHtml}</div>
      <div class="playtest-history">${historyHtml}</div>
>>>>>>> Stashed changes
    </div>
  `;

  els.playtestPanel.querySelectorAll("[data-choice-index]").forEach((button) => {
    button.addEventListener("click", () => {
<<<<<<< Updated upstream
      const choice = node.choices[Number(button.dataset.choiceIndex)];
      if (!choice) return;
      advanceTo(choice.next);
    });
  });

  els.playtestPanel.querySelector('[data-action="next"]')?.addEventListener("click", () => {
    advanceTo(node.next);
  });

  els.playtestPanel.querySelector('[data-action="restart"]')?.addEventListener("click", () => {
=======
      const choice = visibleChoices[Number(button.dataset.choiceIndex)];
      if (!choice) return;
      applyChoice(choice, node);
    });
  });

  els.playtestPanel.querySelector('[data-playtest-action="next"]')?.addEventListener("click", () => {
    advanceTo(node.next, {
      title: node.title || node.id,
      detail: "기본 다음 장면으로 이동",
    });
  });

  els.playtestPanel.querySelector('[data-playtest-action="restart"]')?.addEventListener("click", () => {
>>>>>>> Stashed changes
    state.playtest = createPlaytestState(state.project);
    renderPlaytest();
  });
}

<<<<<<< Updated upstream
function advanceTo(nextNodeId) {
  if (!nextNodeId) {
=======
function evaluateRequirement(rule) {
  if (rule.type === "flag_on") return Boolean(state.playtest.flags[rule.flag_id]);
  if (rule.type === "flag_off") return !Boolean(state.playtest.flags[rule.flag_id]);
  return Number(state.playtest.stats[rule.stat_id] || 0) >= Number(rule.value || 0);
}

function applyChoice(choice, node) {
  choice.effects.forEach((effect) => {
    if (effect.type === "set_flag") {
      state.playtest.flags[effect.flag_id] = Boolean(effect.value);
      return;
    }
    const stat = state.project.stats.find((item) => item.id === effect.stat_id);
    if (!stat) return;
    const current = Number(state.playtest.stats[effect.stat_id] || 0);
    state.playtest.stats[effect.stat_id] = clamp(
      current + Number(effect.value || 0),
      Number(stat.min),
      Number(stat.max),
    );
  });

  advanceTo(choice.next, {
    title: node.title || node.id,
    detail: choice.text.ko || choice.id,
  });
}

function advanceTo(nextNodeId, historyEntry) {
  if (historyEntry) state.playtest.history.push(historyEntry);
  if (!nextNodeId) {
    state.playtest.completed = true;
>>>>>>> Stashed changes
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
