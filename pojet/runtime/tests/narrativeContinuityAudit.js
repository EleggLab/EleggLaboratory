import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createStore } from "../../src/core/store.js";
import { createCharacterTemplate, buildCharacterFromTemplate } from "../../src/core/state-machine.js";
import { CLASS_IDS, LINEAGES, BACKGROUNDS } from "../../src/config/runtimeData.js";
import { createAutoProgressionController, applyDecisionChoice } from "../loop/autoProgressionController.js";

const STORYLINE_IDS = [
  "battleworn-veteran",
  "academy-prodigy",
  "mountain-adept",
  "brothel-fixer",
  "thief-crew"
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");

function readJson(relPath, fallback) {
  try {
    const abs = path.resolve(projectRoot, relPath);
    return JSON.parse(fs.readFileSync(abs, "utf8"));
  } catch {
    return fallback;
  }
}

function loadContentPack() {
  return {
    logLines: readJson("./data/content/log-lines.json", { movement: ["이동"], combat: ["전투"], rumor: ["소문"], rest: ["휴식"] }),
    eventsT2: readJson("./data/content/events-t2.json", []),
    eventsT3: readJson("./data/content/events-t3.json", []),
    npcs: readJson("./data/content/npcs.json", []),
    factions: readJson("./data/content/factions.json", []),
    locationPools: readJson("./data/content/location-pools.json", [])
  };
}

function pickByIndex(arr, index) {
  return arr[Math.abs(Number(index || 0)) % arr.length];
}

function randomAbilities(seed) {
  const pool = [8, 10, 12, 13, 14, 15];
  const rotated = pool.slice(seed % pool.length).concat(pool.slice(0, seed % pool.length));
  return {
    STR: rotated[0],
    DEX: rotated[1],
    CON: rotated[2],
    INT: rotated[3],
    WIS: rotated[4],
    CHA: rotated[5]
  };
}

function buildTemplate(runIndex) {
  return createCharacterTemplate({
    classId: pickByIndex(CLASS_IDS, runIndex * 3 + 1),
    lineageId: pickByIndex(LINEAGES, runIndex * 5 + 2),
    backgroundId: pickByIndex(BACKGROUNDS, runIndex * 7 + 3),
    storylineId: pickByIndex(STORYLINE_IDS, runIndex),
    abilities: randomAbilities(runIndex)
  });
}

function ratio(numerator, denominator) {
  if (!denominator) return 0;
  return numerator / denominator;
}

function profileRatios(openedEntries = []) {
  const rows = openedEntries.map((x) => x?.selectionDebug).filter((x) => x && typeof x === "object");
  if (!rows.length) return { core: 0, background: 0, storyline: 0, lineage: 0 };
  const count = rows.length;
  return {
    core: ratio(rows.filter((row) => row.classMatch || row.backgroundMatch || row.storylineMatch || row.lineageMatch).length, count),
    background: ratio(rows.filter((row) => row.backgroundMatch).length, count),
    storyline: ratio(rows.filter((row) => row.storylineMatch).length, count),
    lineage: ratio(rows.filter((row) => row.lineageMatch).length, count)
  };
}

function continuityRatios(logs = []) {
  const count = logs.length || 1;
  return {
    bridge: ratio(logs.filter((log) => (log?.tags || []).includes("continuity-bridge")).length, count),
    profile: ratio(logs.filter((log) => (log?.tags || []).includes("profile-focus")).length, count),
    hooks: ratio(logs.filter((log) => Array.isArray(log?.followupHooks) && log.followupHooks.length > 0).length, count)
  };
}

function placeholderRatio(logs = []) {
  let totalChars = 0;
  let flaggedChars = 0;
  logs.forEach((log) => {
    const feed = String(log?.feedLine || "");
    const body = String(log?.bodyParagraph || "");
    const text = `${feed}\n${body}`;
    totalChars += text.length;
    const bad = text.match(/\?{3,}/g) || [];
    bad.forEach((token) => { flaggedChars += token.length; });
  });
  return ratio(flaggedChars, Math.max(1, totalChars));
}

function collectStorylineCategory(agg, storylineId, openedEntries = []) {
  if (!agg[storylineId]) agg[storylineId] = {};
  openedEntries.forEach((entry) => {
    const cat = String(entry?.category || "unknown");
    agg[storylineId][cat] = Number(agg[storylineId][cat] || 0) + 1;
  });
}

function topCategory(map = {}) {
  const entries = Object.entries(map);
  if (!entries.length) return { category: null, ratio: 0 };
  const total = entries.reduce((sum, [, value]) => sum + Number(value || 0), 0);
  const [category, value] = entries.sort((a, b) => Number(b[1]) - Number(a[1]))[0];
  return { category, ratio: ratio(Number(value || 0), total) };
}

export function runNarrativeContinuityAudit({ runs = 120, stepsPerRun = 50 } = {}) {
  const contentPack = loadContentPack();
  const runRows = [];
  const storylineCategoryAgg = {};

  for (let run = 1; run <= runs; run += 1) {
    const store = createStore();
    const character = buildCharacterFromTemplate(buildTemplate(run));
    store.dispatch({ type: "SET_CHARACTER", payload: { character } });
    store.dispatch({ type: "APPLY_PATCH", payload: { patch: { automation: { t2Policy: "ask" } } } });
    store.dispatch({ type: "RUN_START" });
    const controller = createAutoProgressionController(store, contentPack);

    for (let step = 0; step < stepsPerRun; step += 1) {
      const live = store.getState();
      if (live.run.status === "ended") break;
      if (live.activeDecisionEvent) {
        const choices = live.activeDecisionEvent.choices || [];
        if (choices.length) {
          const choice = choices[(step + run) % choices.length];
          applyDecisionChoice(store, choice, false, contentPack, store.__narrativeEngine || null);
        } else {
          store.dispatch({ type: "CLEAR_ACTIVE_EVENT" });
        }
      } else {
        controller.step();
      }
    }

    controller.stop();
    const final = store.getState();
    const logsChrono = [...(final.history.logs || [])].reverse();
    const openedEntries = (final.history.events || []).filter((x) => x?.stage === "opened");
    const profile = profileRatios(openedEntries);
    const continuity = continuityRatios(logsChrono);
    const placeholders = placeholderRatio(logsChrono);
    const storylineId = String(final?.character?.storylineId || "unknown");
    collectStorylineCategory(storylineCategoryAgg, storylineId, openedEntries);

    const sampleTexts = logsChrono
      .filter((log) => (log?.kind || "").includes("event"))
      .slice(0, 4)
      .map((log) => ({
        kind: log?.kind || "unknown",
        feed: String(log?.feedLine || ""),
        body: String(log?.bodyParagraph || "")
      }));

    runRows.push({
      run,
      storylineId,
      classId: final?.character?.classId || null,
      lineageId: final?.character?.lineageId || null,
      backgroundId: final?.character?.backgroundId || null,
      openedEvents: openedEntries.length,
      logCount: logsChrono.length,
      profile,
      continuity,
      placeholders,
      samples: sampleTexts
    });
  }

  const avg = (keyFn) => ratio(runRows.reduce((sum, row) => sum + keyFn(row), 0), runRows.length);
  const storylineDominance = Object.fromEntries(
    Object.entries(storylineCategoryAgg).map(([storylineId, counts]) => [storylineId, topCategory(counts)])
  );

  const summary = {
    runs,
    stepsPerRun,
    avgProfileCore: avg((row) => row.profile.core),
    avgProfileBackground: avg((row) => row.profile.background),
    avgProfileStoryline: avg((row) => row.profile.storyline),
    avgContinuityBridge: avg((row) => row.continuity.bridge),
    avgContinuityProfile: avg((row) => row.continuity.profile),
    avgContinuityHooks: avg((row) => row.continuity.hooks),
    avgPlaceholderRatio: avg((row) => row.placeholders),
    storylineDominance
  };

  return { summary, runs: runRows };
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function writeAuditFiles(result) {
  const dir = path.resolve(projectRoot, "reports/qa");
  fs.mkdirSync(dir, { recursive: true });
  const stamp = timestamp();
  const jsonPath = path.join(dir, `narrative-continuity-audit-${stamp}.json`);
  const mdPath = path.join(dir, `narrative-continuity-audit-${stamp}.md`);
  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), "utf8");

  const lines = [];
  lines.push("# Narrative Continuity Audit");
  lines.push("");
  lines.push(`- Runs: ${result.summary.runs}`);
  lines.push(`- Steps per run: ${result.summary.stepsPerRun}`);
  lines.push(`- Avg profile-core match: ${(result.summary.avgProfileCore * 100).toFixed(2)}%`);
  lines.push(`- Avg background match: ${(result.summary.avgProfileBackground * 100).toFixed(2)}%`);
  lines.push(`- Avg storyline match: ${(result.summary.avgProfileStoryline * 100).toFixed(2)}%`);
  lines.push(`- Avg continuity-bridge tag: ${(result.summary.avgContinuityBridge * 100).toFixed(2)}%`);
  lines.push(`- Avg profile-focus tag: ${(result.summary.avgContinuityProfile * 100).toFixed(2)}%`);
  lines.push(`- Avg followup-hooks coverage: ${(result.summary.avgContinuityHooks * 100).toFixed(2)}%`);
  lines.push(`- Avg placeholder ratio: ${(result.summary.avgPlaceholderRatio * 100).toFixed(4)}%`);
  lines.push("");
  lines.push("## Storyline Dominance");
  Object.entries(result.summary.storylineDominance).forEach(([id, row]) => {
    lines.push(`- ${id}: ${row.category || "none"} (${(Number(row.ratio || 0) * 100).toFixed(2)}%)`);
  });
  lines.push("");
  lines.push("## Sample Log Chains (first 5 runs)");
  result.runs.slice(0, 5).forEach((row) => {
    lines.push(`- Run ${row.run} | ${row.storylineId} | ${row.classId}/${row.lineageId}/${row.backgroundId}`);
    row.samples.slice(0, 3).forEach((sample) => {
      lines.push(`  - [${sample.kind}] ${sample.feed}`);
    });
  });
  fs.writeFileSync(mdPath, `${lines.join("\n")}\n`, "utf8");
  return { jsonPath, mdPath };
}

function isMain() {
  return process.argv[1] && path.resolve(process.argv[1]) === __filename;
}

if (isMain()) {
  const runs = Number(process.argv[2] || 120);
  const stepsPerRun = Number(process.argv[3] || 50);
  const result = runNarrativeContinuityAudit({ runs, stepsPerRun });
  const paths = writeAuditFiles(result);
  console.log(JSON.stringify({ ...result.summary, report: paths }, null, 2));
}
