import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import process from "node:process";

import { chromium } from "playwright";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "reports", "ui-capture");
const PORT = 4173;
const BASE_URL = `http://127.0.0.1:${PORT}/index.html`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // retry
    }
    await sleep(200);
  }
  throw new Error(`Server did not start in ${timeoutMs}ms: ${url}`);
}

async function clickFirstChoiceIfAny(page) {
  const firstChoice = page.locator("#event-choices button").first();
  if (await firstChoice.count()) {
    await firstChoice.click();
    return true;
  }
  return false;
}

async function capture() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const server = spawn("python", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1"], {
    cwd: ROOT,
    stdio: "ignore"
  });

  try {
    await waitForServer(BASE_URL);

    const browser = await chromium.launch({
      headless: true,
      channel: "chrome"
    });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();

    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(OUT_DIR, "01-onboarding.png"), fullPage: true });

    await page.click("#begin-btn");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT_DIR, "02-run-start.png"), fullPage: true });

    // Wait for first decision event and capture.
    await page.waitForSelector("#event-card:not(.hidden)", { timeout: 15000 });
    await page.screenshot({ path: path.join(OUT_DIR, "03-first-event.png"), fullPage: true });

    await clickFirstChoiceIfAny(page);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT_DIR, "04-after-choice.png"), fullPage: true });

    // Continue lightweight playtest loop for midrun state.
    for (let i = 0; i < 8; i += 1) {
      await page.waitForTimeout(700);
      await clickFirstChoiceIfAny(page);
    }
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT_DIR, "05-midrun.png"), fullPage: true });

    const uiSnapshot = await page.evaluate(() => {
      const text = (sel) => document.querySelector(sel)?.textContent?.trim() || "";
      const logs = [...document.querySelectorAll("#log-panel .log-entry, #log-panel .log-card-head strong")]
        .slice(0, 12)
        .map((el) => el.textContent?.trim() || "")
        .filter(Boolean);
      const eventMeta = text("#event-meta");
      const tutorial = text("#tutorial-banner");
      const title = text("aside#character-panel .subtitle");
      return { tutorial, eventMeta, title, logs };
    });

    fs.writeFileSync(
      path.join(OUT_DIR, "ui-snapshot.json"),
      JSON.stringify(uiSnapshot, null, 2),
      "utf8"
    );

    await browser.close();
  } finally {
    server.kill("SIGTERM");
  }
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});

