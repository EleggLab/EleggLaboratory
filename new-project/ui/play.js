const POLL_INTERVAL_MS = 550;

const nodes = {
  statusText: document.getElementById("status-text"),
  sessionText: document.getElementById("session-text"),
  consoleLog: document.getElementById("console-log"),
  promptText: document.getElementById("prompt-text"),
  inputForm: document.getElementById("input-form"),
  inputBox: document.getElementById("input-box"),
  sendBtn: document.getElementById("send-btn"),
  startBtn: document.getElementById("start-btn"),
  stopBtn: document.getElementById("stop-btn"),
  quickButtons: document.getElementById("quick-buttons"),
};

const state = {
  sessionId: null,
  offset: 0,
  timerId: null,
  waitingPrompt: null,
  finished: true,
  stopping: false,
};

const quickInputs = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "y", "n", "back", "q"];

function appendLog(lines) {
  if (!lines || lines.length === 0) return;
  const chunk = `${lines.join("\n")}\n`;
  nodes.consoleLog.textContent += chunk;
  nodes.consoleLog.scrollTop = nodes.consoleLog.scrollHeight;
}

function setStatus(text) {
  nodes.statusText.textContent = text;
}

function setPrompt(text) {
  nodes.promptText.textContent = text || "입력 대기 중이 아닙니다.";
}

function updateInputState() {
  const canSend = Boolean(state.sessionId) && !state.finished && Boolean(state.waitingPrompt);
  nodes.inputBox.disabled = !canSend;
  nodes.sendBtn.disabled = !canSend;
}

function renderQuickButtons() {
  nodes.quickButtons.innerHTML = "";
  quickInputs.forEach((value) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = value;
    button.addEventListener("click", () => {
      void sendInput(value);
    });
    nodes.quickButtons.appendChild(button);
  });
}

async function createSession() {
  const response = await fetch("/api/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  if (!response.ok) {
    throw new Error(`session create failed: ${response.status}`);
  }
  return response.json();
}

async function pollSession() {
  if (!state.sessionId || state.stopping) return;

  const response = await fetch(`/api/session/${state.sessionId}/poll?offset=${state.offset}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`poll failed: ${response.status}`);
  }

  const payload = await response.json();
  appendLog(payload.lines);
  state.offset = payload.next_offset ?? state.offset;
  state.waitingPrompt = payload.waiting_prompt ?? null;
  state.finished = Boolean(payload.finished);

  setPrompt(state.waitingPrompt);
  updateInputState();

  if (state.finished) {
    setStatus(`세션 종료 (code: ${payload.return_code ?? "-"})`);
    nodes.stopBtn.disabled = true;
    return;
  }
  setStatus("게임 진행 중");
}

function startPolling() {
  if (state.timerId) {
    window.clearInterval(state.timerId);
  }
  state.timerId = window.setInterval(() => {
    void pollSession().catch((error) => {
      setStatus(`폴링 오류: ${error.message}`);
      nodes.stopBtn.disabled = false;
    });
  }, POLL_INTERVAL_MS);
}

function stopPolling() {
  if (!state.timerId) return;
  window.clearInterval(state.timerId);
  state.timerId = null;
}

async function sendInput(text) {
  if (!state.sessionId || state.finished || !state.waitingPrompt) return;
  const response = await fetch(`/api/session/${state.sessionId}/input`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.accepted) {
    setStatus(`입력 전송 실패: ${payload.reason ?? response.status}`);
    return;
  }
  nodes.inputBox.value = "";
  state.waitingPrompt = null;
  updateInputState();
}

async function stopSession() {
  if (!state.sessionId) return;
  state.stopping = true;
  stopPolling();
  try {
    await fetch(`/api/session/${state.sessionId}/stop`, { method: "POST" });
  } finally {
    state.finished = true;
    state.waitingPrompt = null;
    setStatus("세션 종료됨");
    setPrompt(null);
    nodes.stopBtn.disabled = true;
    updateInputState();
    state.stopping = false;
  }
}

async function startNewGame() {
  if (state.sessionId && !state.finished) {
    await stopSession();
  }

  nodes.consoleLog.textContent = "";
  state.offset = 0;
  state.waitingPrompt = null;
  state.finished = false;
  setPrompt(null);
  updateInputState();

  const created = await createSession();
  state.sessionId = created.session_id;
  nodes.sessionText.textContent = `session: ${state.sessionId}`;
  nodes.stopBtn.disabled = false;
  setStatus("세션 생성됨, 게임 시작 중");

  await pollSession();
  startPolling();
}

nodes.startBtn.addEventListener("click", () => {
  void startNewGame().catch((error) => {
    setStatus(`시작 실패: ${error.message}`);
  });
});

nodes.stopBtn.addEventListener("click", () => {
  void stopSession();
});

nodes.inputForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = nodes.inputBox.value;
  if (!text && text !== "0") return;
  void sendInput(text);
});

renderQuickButtons();
updateInputState();
nodes.stopBtn.disabled = true;
