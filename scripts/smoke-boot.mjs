import { mkdirSync, createWriteStream } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const repoRoot = process.cwd();
const webUrl = process.env.TONG_WEB_URL ?? "http://localhost:5173";
const workerUrl = process.env.TONG_WORKER_URL ?? "http://127.0.0.1:8787";
const startupTimeoutMs = Number(process.env.TONG_SMOKE_STARTUP_TIMEOUT_MS ?? "45000");
const pollIntervalMs = 400;

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

async function fetchText(url) {
  const response = await fetch(url);
  const text = await response.text();
  return { response, text };
}

async function isWebReady() {
  try {
    const { response, text } = await fetchText(webUrl);
    return response.ok && text.includes("통이 크시네");
  } catch {
    return false;
  }
}

async function isWorkerReady() {
  try {
    const response = await fetch(`${workerUrl}/api/rooms/READYCHECK/start`);
    const text = await response.text();
    return response.status === 405 && text.includes("message");
  } catch {
    return false;
  }
}

function ensureRunLogsDir() {
  const runlogsDir = resolve(repoRoot, ".runlogs");
  mkdirSync(runlogsDir, { recursive: true });
  return runlogsDir;
}

function pipeChildToLog(child, logPath) {
  const logStream = createWriteStream(logPath, { flags: "w" });
  child.stdout?.pipe(logStream, { end: false });
  child.stderr?.pipe(logStream, { end: false });

  const closeLog = () => {
    child.stdout?.unpipe(logStream);
    child.stderr?.unpipe(logStream);
    logStream.end();
  };

  child.once("exit", closeLog);
  child.once("error", closeLog);
}

function spawnService(name, command, logPath) {
  const child = spawn(command, {
    cwd: repoRoot,
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
    env: process.env,
  });

  pipeChildToLog(child, logPath);
  child.once("error", (error) => {
    console.error(`[smoke:boot] failed to start ${name}: ${error.message}`);
  });

  return child;
}

async function waitUntilReady(label, checkReady, timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await checkReady()) {
      return;
    }
    await delay(pollIntervalMs);
  }

  throw new Error(`${label} did not become ready within ${timeoutMs}ms.`);
}

async function stopChildProcess(child) {
  if (!child || child.exitCode !== null) {
    return;
  }

  if (process.platform === "win32") {
    await new Promise((resolveStop) => {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true,
      });
      killer.once("exit", () => resolveStop());
      killer.once("error", () => resolveStop());
    });
    return;
  }

  child.kill("SIGTERM");
  await new Promise((resolveStop) => child.once("exit", resolveStop));
}

async function runSmokeLocal() {
  await new Promise((resolveRun, rejectRun) => {
    const child = spawn("node scripts/smoke-local.mjs", {
      cwd: repoRoot,
      shell: true,
      stdio: "inherit",
      windowsHide: true,
      env: process.env,
    });

    child.once("exit", (code) => {
      if (code === 0) {
        resolveRun();
        return;
      }
      rejectRun(new Error(`smoke-local exited with code ${code ?? "unknown"}.`));
    });

    child.once("error", rejectRun);
  });
}

async function main() {
  const runlogsDir = ensureRunLogsDir();
  const startedChildren = [];

  try {
    const workerReady = await isWorkerReady();
    if (workerReady) {
      console.log(`[smoke:boot] reusing worker at ${workerUrl}`);
    } else {
      const workerLogPath = resolve(runlogsDir, "tong-smoke-worker.log");
      console.log(`[smoke:boot] starting worker -> ${workerLogPath}`);
      const workerChild = spawnService("worker", "corepack pnpm dev:worker", workerLogPath);
      startedChildren.push(workerChild);
      await waitUntilReady("Worker", isWorkerReady, startupTimeoutMs);
    }

    const webReady = await isWebReady();
    if (webReady) {
      console.log(`[smoke:boot] reusing web app at ${webUrl}`);
    } else {
      const webLogPath = resolve(runlogsDir, "tong-smoke-web.log");
      console.log(`[smoke:boot] starting web -> ${webLogPath}`);
      const webChild = spawnService("web", "corepack pnpm dev:web", webLogPath);
      startedChildren.push(webChild);
      await waitUntilReady("Web app", isWebReady, startupTimeoutMs);
    }

    await runSmokeLocal();
  } finally {
    for (const child of startedChildren.reverse()) {
      await stopChildProcess(child);
    }
  }
}

main().catch((error) => {
  console.error(`[smoke:boot] failed: ${error.message}`);
  process.exitCode = 1;
});
