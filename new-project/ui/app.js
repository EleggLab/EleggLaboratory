const BG_DAWN = "../assets/temp/bg_wasteland_dawn.svg";
const BG_NIGHT = "../assets/temp/bg_ruins_night.svg";
const PORTRAIT_SCAV = "../assets/temp/portrait_scavenger.svg";
const PORTRAIT_MEDIC = "../assets/temp/portrait_medic.svg";
const LIVE_STATE_URL = "./state/live_state.json";
const LIVE_POLL_MS = 1800;

const factionLabels = {
  veritas: "V.E.R.I.T.A.S.",
  crimson_clan: "크림슨 클랜",
  oasis: "오아시스",
  atomic_children: "아토믹 칠드런",
};

const defaultData = {
  name: "Ash",
  gender: "Unknown",
  appearance: "바람에 깎인 흉터가 선명한 황무지 생존자",
  survival: {
    hp: 88,
    humanity: 64,
    hunger: 72,
    thirst: 66,
    radiation: 120,
  },
  caps: 41,
  level: 2,
  xp: 34,
  perk_points: 1,
  skills: {
    medicine: 10,
    survival: 8,
  },
  faction_reputation: {
    veritas: 7,
    crimson_clan: -12,
    oasis: 24,
    atomic_children: -4,
  },
  quest_log: {
    oasis_waterline: {
      title: "한 병의 물",
      status: "active",
      stage: "decision",
      objective: "난민 지도자의 제안을 듣고 방향을 결정",
    },
  },
  inventory: [
    "응급 붕대",
    "오염 정화수 x1",
    "스크랩 금속",
    "요오드 정제 x1",
  ],
  rumors: [
    "DAY 4: 당신이 오아시스 난민에게 물을 나눴다는 소문.",
    "DAY 4: 크림슨 암시장과 거래했다는 소문.",
  ],
};

const dangerData = {
  ...defaultData,
  name: "Rogue",
  survival: {
    hp: 36,
    humanity: 21,
    hunger: 18,
    thirst: 12,
    radiation: 492,
  },
  caps: 9,
  level: 3,
  xp: 20,
  perk_points: 0,
  skills: {
    medicine: 0,
    survival: 14,
  },
  faction_reputation: {
    veritas: -42,
    crimson_clan: 38,
    oasis: -77,
    atomic_children: 16,
  },
  quest_log: {
    oasis_waterline: {
      title: "한 병의 물",
      status: "completed",
      stage: "completed",
      objective: "완료",
      outcome: "갈취자",
    },
  },
  inventory: ["진통제 x1", "스크랩 금속"],
};

const nodes = {
  hero: document.getElementById("hero"),
  heroTitle: document.getElementById("hero-title"),
  heroSubtitle: document.getElementById("hero-subtitle"),
  portrait: document.getElementById("portrait"),
  name: document.getElementById("player-name"),
  meta: document.getElementById("player-meta"),
  level: document.getElementById("player-level"),
  appearance: document.getElementById("player-appearance"),
  hp: document.getElementById("hp-value"),
  humanity: document.getElementById("humanity-value"),
  hunger: document.getElementById("hunger-value"),
  thirst: document.getElementById("thirst-value"),
  radiation: document.getElementById("radiation-value"),
  caps: document.getElementById("caps-value"),
  factions: document.getElementById("faction-list"),
  quests: document.getElementById("quest-list"),
  inventory: document.getElementById("inventory-list"),
  rumors: document.getElementById("rumor-list"),
  saveInput: document.getElementById("save-input"),
  liveSyncBtn: document.getElementById("live-sync-btn"),
  liveStatus: document.getElementById("live-status"),
  liveUpdated: document.getElementById("live-updated"),
  toggleBgBtn: document.getElementById("toggle-bg-btn"),
  demoSafeBtn: document.getElementById("demo-safe-btn"),
  demoDangerBtn: document.getElementById("demo-danger-btn"),
};

let forceNight = false;
let liveSyncEnabled = false;
let liveSyncTimer = null;

function factionStage(score) {
  if (score <= -75) return "증오";
  if (score <= -25) return "적대";
  if (score <= 24) return "중립";
  if (score <= 74) return "우호";
  return "숭배";
}

function choosePortrait(data) {
  const medicine = data?.skills?.medicine ?? 0;
  return medicine >= 8 ? PORTRAIT_MEDIC : PORTRAIT_SCAV;
}

function chooseBackground(data) {
  if (forceNight) return BG_NIGHT;
  const radiation = data?.survival?.radiation ?? 0;
  const humanity = data?.survival?.humanity ?? 0;
  if (radiation >= 350 || humanity <= 25) return BG_NIGHT;
  return BG_DAWN;
}

function setList(target, values, emptyText) {
  target.innerHTML = "";
  if (!values || values.length === 0) {
    const li = document.createElement("li");
    li.textContent = emptyText;
    target.appendChild(li);
    return;
  }
  values.forEach((value) => {
    const li = document.createElement("li");
    li.textContent = value;
    target.appendChild(li);
  });
}

function renderFactions(data) {
  nodes.factions.innerHTML = "";
  const factionData = data.faction_reputation ?? {};
  Object.keys(factionLabels).forEach((key) => {
    const score = Number(factionData[key] ?? 0);
    const stage = factionStage(score);
    const meter = Math.max(0, Math.min(100, ((score + 100) / 200) * 100));

    const row = document.createElement("li");
    row.className = "faction-row";
    row.dataset.stage = stage;
    row.innerHTML = `
      <div class="faction-top">
        <b>${factionLabels[key]}</b>
        <span>${score} (${stage})</span>
      </div>
      <div class="faction-meter"><div class="faction-fill" style="width:${meter}%"></div></div>
    `;
    nodes.factions.appendChild(row);
  });
}

function renderQuests(data) {
  const log = data.quest_log ?? {};
  const values = Object.values(log).map((quest) => {
    const result = quest.outcome ? ` · 결과 ${quest.outcome}` : "";
    return `${quest.title} · ${quest.status}/${quest.stage} · ${quest.objective}${result}`;
  });
  setList(nodes.quests, values, "활성 퀘스트 없음");
}

function render(data) {
  nodes.hero.style.backgroundImage = `url("${chooseBackground(data)}")`;
  nodes.heroTitle.textContent = data.name ? `${data.name} / Wasteland Log` : "Crimson Wasteland";
  if (!liveSyncEnabled) {
    nodes.heroSubtitle.textContent = "저장 데이터 기반 전술 대시보드";
  }
  nodes.portrait.src = choosePortrait(data);

  nodes.name.textContent = data.name ?? "Unnamed";
  nodes.meta.textContent = `${data.gender ?? "Unknown"} / ${data.creation_choices ? "Generated" : "Imported"}`;
  nodes.level.textContent = `LV ${data.level ?? 1} · XP ${data.xp ?? 0}/${100 + ((data.level ?? 1) - 1) * 50} · Perk ${
    data.perk_points ?? 0
  }`;
  nodes.appearance.textContent = data.appearance ?? "외형 정보 없음";

  const s = data.survival ?? {};
  nodes.hp.textContent = s.hp ?? 0;
  nodes.humanity.textContent = s.humanity ?? 0;
  nodes.hunger.textContent = s.hunger ?? 0;
  nodes.thirst.textContent = s.thirst ?? 0;
  nodes.radiation.textContent = s.radiation ?? 0;
  nodes.caps.textContent = data.caps ?? 0;

  renderFactions(data);
  renderQuests(data);
  setList(nodes.inventory, data.inventory ?? [], "소지품 없음");
  setList(nodes.rumors, (data.rumors ?? []).slice(-6).reverse(), "등록된 소문 없음");
}

function parseSaveFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      currentData = parsed;
      render(currentData);
    } catch (err) {
      window.alert("저장 파일 JSON 파싱에 실패했습니다.");
    }
  };
  reader.readAsText(file, "utf-8");
}

function setLiveStatus(text) {
  nodes.liveStatus.textContent = text;
}

function setLiveUpdated(text) {
  nodes.liveUpdated.textContent = `최근 갱신: ${text}`;
}

function formatUpdatedAt(value) {
  if (!value) return "-";
  const ts = new Date(value);
  if (Number.isNaN(ts.getTime())) return value;
  return ts.toLocaleString("ko-KR", { hour12: false });
}

function normalizePayload(payload) {
  if (payload && typeof payload === "object" && payload.player) {
    return {
      data: payload.player,
      meta: payload.meta ?? {},
    };
  }
  return { data: payload, meta: null };
}

async function refreshFromLiveState({ silent = true } = {}) {
  try {
    const response = await fetch(`${LIVE_STATE_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) {
      if (response.status === 404) {
        if (!silent) {
          setLiveStatus("라이브 동기화: 대기 중");
          setLiveUpdated("-");
        }
        return false;
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const normalized = normalizePayload(payload);
    if (!normalized.data || typeof normalized.data !== "object") {
      throw new Error("invalid payload");
    }

    currentData = normalized.data;
    render(currentData);

    if (normalized.meta?.phase) {
      nodes.heroSubtitle.textContent = `실시간 상태 · ${normalized.meta.phase}`;
    }
    setLiveStatus("라이브 동기화: ON");
    setLiveUpdated(formatUpdatedAt(normalized.meta?.updated_at));
    return true;
  } catch (error) {
    if (!silent) {
      setLiveStatus("라이브 동기화: 오류");
      setLiveUpdated("-");
    }
    return false;
  }
}

function startLiveSync() {
  if (liveSyncTimer) clearInterval(liveSyncTimer);
  liveSyncEnabled = true;
  nodes.liveSyncBtn.textContent = "라이브 동기화 중지";
  setLiveStatus("라이브 동기화: ON");
  refreshFromLiveState({ silent: false });
  liveSyncTimer = window.setInterval(() => {
    refreshFromLiveState();
  }, LIVE_POLL_MS);
}

function stopLiveSync() {
  liveSyncEnabled = false;
  if (liveSyncTimer) {
    window.clearInterval(liveSyncTimer);
    liveSyncTimer = null;
  }
  nodes.liveSyncBtn.textContent = "라이브 동기화 시작";
  setLiveStatus("라이브 동기화: OFF");
}

nodes.saveInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  stopLiveSync();
  parseSaveFile(file);
});

nodes.liveSyncBtn.addEventListener("click", () => {
  if (liveSyncEnabled) {
    stopLiveSync();
    return;
  }
  startLiveSync();
});

nodes.toggleBgBtn.addEventListener("click", () => {
  forceNight = !forceNight;
  render(currentData);
});

nodes.demoSafeBtn.addEventListener("click", () => {
  stopLiveSync();
  forceNight = false;
  currentData = structuredClone(defaultData);
  render(currentData);
});

nodes.demoDangerBtn.addEventListener("click", () => {
  stopLiveSync();
  forceNight = true;
  currentData = structuredClone(dangerData);
  render(currentData);
});

let currentData = structuredClone(defaultData);
render(currentData);
setLiveStatus("라이브 동기화: OFF");
setLiveUpdated("-");
