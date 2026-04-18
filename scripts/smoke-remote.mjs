import { spawn } from "node:child_process";

const baseUrl = process.env.TONG_BASE_URL?.trim();
const webUrl = process.env.TONG_WEB_URL?.trim();
const workerUrl = process.env.TONG_WORKER_URL?.trim();

function normalizeUrl(value, label) {
  if (!value) {
    throw new Error(`${label} is missing.`);
  }

  try {
    return new URL(value).toString().replace(/\/$/, "");
  } catch {
    throw new Error(`${label} must be a valid absolute URL.`);
  }
}

function resolveUrls() {
  if (baseUrl) {
    const normalizedBaseUrl = normalizeUrl(baseUrl, "TONG_BASE_URL");
    return {
      webUrl: webUrl ? normalizeUrl(webUrl, "TONG_WEB_URL") : normalizedBaseUrl,
      workerUrl: workerUrl ? normalizeUrl(workerUrl, "TONG_WORKER_URL") : normalizedBaseUrl,
    };
  }

  if (!webUrl || !workerUrl) {
    throw new Error(
      "Set TONG_BASE_URL for same-origin deploy smoke, or set both TONG_WEB_URL and TONG_WORKER_URL.",
    );
  }

  return {
    webUrl: normalizeUrl(webUrl, "TONG_WEB_URL"),
    workerUrl: normalizeUrl(workerUrl, "TONG_WORKER_URL"),
  };
}

async function main() {
  const targets = resolveUrls();
  const child = spawn("node", ["scripts/smoke-local.mjs"], {
    cwd: process.cwd(),
    stdio: "inherit",
    windowsHide: true,
    env: {
      ...process.env,
      TONG_WEB_URL: targets.webUrl,
      TONG_WORKER_URL: targets.workerUrl,
    },
  });

  await new Promise((resolve, reject) => {
    child.once("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`remote smoke exited with code ${code ?? "unknown"}.`));
    });

    child.once("error", reject);
  });
}

main().catch((error) => {
  console.error(`[smoke:remote] failed: ${error.message}`);
  process.exitCode = 1;
});
