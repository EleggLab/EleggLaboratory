import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createStore } from "../../src/core/store.js";
import { createCharacterTemplate, buildCharacterFromTemplate } from "../../src/core/state-machine.js";
import { CLASS_IDS, LINEAGES, BACKGROUNDS } from "../../src/config/runtimeData.js";
import { createAutoProgressionController, applyDecisionChoice } from "../loop/autoProgressionController.js";
import { runSimulationTests as runRuntimeSimulationTests } from "./simulationTests.js";
import { runSimulationTests as runSrcSimulationTests } from "../../src/tests/simulationTests.js";
import { buildLogQualityReport } from "../narrative/logQualityValidator.js";

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

function loadStressContentPack() {
  const logLines = readJson("./data/content/log-lines.json", {
    movement: ["이동"],
    combat: ["전투"],
    rumor: ["소문"],
    rest: ["휴식"]
  });
  const eventsT2 = readJson("./data/content/events-t2.json", []);
  const eventsT3 = readJson("./data/content/events-t3.json", []);
  const npcs = readJson("./data/content/npcs.json", []);
  const factions = readJson("./data/content/factions.json", []);
  const locationPools = readJson("./data/content/location-pools.json", []);

  return { logLines, eventsT2, eventsT3, npcs, factions, locationPools };
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAbilities() {
  const pool = [8, 10, 12, 13, 14, 15];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return {
    STR: shuffled[0],
    DEX: shuffled[1],
    CON: shuffled[2],
    INT: shuffled[3],
    WIS: shuffled[4],
    CHA: shuffled[5]
  };
}

function randomTemplate() {
  return createCharacterTemplate({
    classId: pickRandom(CLASS_IDS),
    lineageId: pickRandom(LINEAGES),
    backgroundId: pickRandom(BACKGROUNDS),
    storylineId: pickRandom(STORYLINE_IDS),
    abilities: randomAbilities()
  });
}

function validateState(state) {
  const issues = [];
  const c = state?.character;
  const r = state?.resources;
  const h = state?.history;

  if (!c) {
    issues.push("character is null");
    return issues;
  }

  if (!Number.isFinite(c.hp) || !Number.isFinite(c.maxHp) || c.maxHp <= 0 || c.hp < 0 || c.hp > c.maxHp) {
    issues.push(`hp invariant broken (hp=${c.hp}, maxHp=${c.maxHp})`);
  }

  for (const key of ["gold", "supplies", "fatigue", "taint", "renown", "infamy"]) {
    if (!Number.isFinite(Number(r?.[key]))) issues.push(`resource not finite: ${key}`);
  }

  if (Number(state?.world?.day || 0) < 1) issues.push("world.day < 1");
  if (Number(state?.world?.act || 0) < 1 || Number(state?.world?.act || 0) > 5) issues.push("world.act out of range");

  if ((h?.logs || []).length > 240) issues.push(`history.logs overflow: ${(h?.logs || []).length}`);
  if ((h?.events || []).length > 180) issues.push(`history.events overflow: ${(h?.events || []).length}`);
  if ((h?.majorChoices || []).length > 80) issues.push(`history.majorChoices overflow: ${(h?.majorChoices || []).length}`);

  if (state?.activeDecisionEvent) {
    const choices = state.activeDecisionEvent?.choices;
    if (!Array.isArray(choices) || choices.length === 0) issues.push("active decision event has no choices");
  }

  return issues;
}

function reduceIssues(issues = [], max = 6) {
  return [...new Set(issues)].slice(0, max);
}

function countNearRepeats(ids = [], window = 8) {
  let repeats = 0;
  for (let i = 1; i < ids.length; i += 1) {
    const from = Math.max(0, i - window);
    const prev = ids.slice(from, i);
    if (prev.includes(ids[i])) repeats += 1;
  }
  return repeats;
}

function profileSignalRatios(openedEntries = []) {
  const rows = openedEntries
    .map((entry) => entry?.selectionDebug)
    .filter((x) => x && typeof x === "object");
  if (!rows.length) {
    return {
      core: 0,
      background: 0,
      storyline: 0,
      lineage: 0
    };
  }
  const count = rows.length;
  const coreHits = rows.filter((row) => row.classMatch || row.backgroundMatch || row.storylineMatch || row.lineageMatch).length;
  const backgroundHits = rows.filter((row) => row.backgroundMatch).length;
  const storylineHits = rows.filter((row) => row.storylineMatch).length;
  const lineageHits = rows.filter((row) => row.lineageMatch).length;
  return {
    core: coreHits / count,
    background: backgroundHits / count,
    storyline: storylineHits / count,
    lineage: lineageHits / count
  };
}

function continuityTagRate(logs = []) {
  if (!logs.length) return { bridgeRate: 0, profileRate: 0, hookRate: 0 };
  const bridge = logs.filter((log) => (log?.tags || []).includes("continuity-bridge")).length;
  const profile = logs.filter((log) => (log?.tags || []).includes("profile-focus")).length;
  const hooks = logs.filter((log) => Array.isArray(log?.followupHooks) && log.followupHooks.length > 0).length;
  const count = logs.length;
  return {
    bridgeRate: bridge / count,
    profileRate: profile / count,
    hookRate: hooks / count
  };
}

function updateStorylineCategoryAgg(agg, storylineId, openedEntries = []) {
  if (!agg[storylineId]) agg[storylineId] = {};
  openedEntries.forEach((entry) => {
    const category = String(entry?.category || "unknown");
    agg[storylineId][category] = Number(agg[storylineId][category] || 0) + 1;
  });
}

function dominantCategorySummary(agg = {}) {
  const summary = {};
  Object.entries(agg).forEach(([storylineId, counts]) => {
    const entries = Object.entries(counts);
    if (!entries.length) {
      summary[storylineId] = { category: null, ratio: 0 };
      return;
    }
    const total = entries.reduce((sum, [, value]) => sum + Number(value || 0), 0);
    const [category, value] = entries.sort((a, b) => Number(b[1]) - Number(a[1]))[0];
    summary[storylineId] = {
      category,
      ratio: total > 0 ? Number(value || 0) / total : 0
    };
  });
  return summary;
}

export function runQaStressTests({ runs = 120, stepsPerRun = 45 } = {}) {
  const runtimeSim = runRuntimeSimulationTests();
  const srcSim = runSrcSimulationTests();
  const simFailures = [
    ...runtimeSim.filter((x) => !x.pass).map((x) => `runtime:${x.name}`),
    ...srcSim.filter((x) => !x.pass).map((x) => `src:${x.name}`)
  ];

  const contentPack = loadStressContentPack();
  const runFailures = [];
  let passedRuns = 0;
  const storylineCategoryAgg = {};

  for (let run = 1; run <= runs; run += 1) {
    const store = createStore();
    const character = buildCharacterFromTemplate(randomTemplate());
    store.dispatch({ type: "SET_CHARACTER", payload: { character } });
    store.dispatch({ type: "APPLY_PATCH", payload: { patch: { automation: { t2Policy: "ask" } } } });
    store.dispatch({ type: "RUN_START" });

    const controller = createAutoProgressionController(store, contentPack);
    const issues = [];

    try {
      for (let step = 0; step < stepsPerRun; step += 1) {
        const live = store.getState();
        if (live.run.status === "ended") break;

        if (live.activeDecisionEvent) {
          const choices = live.activeDecisionEvent.choices || [];
          if (!choices.length) {
            issues.push("decision event without choices");
            store.dispatch({ type: "CLEAR_ACTIVE_EVENT" });
          } else {
            const choice = choices[step % choices.length];
            applyDecisionChoice(store, choice, false, contentPack);
          }
        } else {
          controller.step();
        }

        issues.push(...validateState(store.getState()));
      }
    } catch (error) {
      issues.push(`exception: ${error?.message || String(error)}`);
    } finally {
      controller.stop();
    }

    const final = store.getState();
    const quality = buildLogQualityReport(final.history.logs || []);
    if (!quality.pass) issues.push(`log-quality: ${quality.summary}`);

    const openedIds = (final.history.events || [])
      .filter((e) => e?.stage === "opened" && e?.eventId)
      .map((e) => String(e.eventId));
    const openedEntries = (final.history.events || []).filter((e) => e?.stage === "opened");
    updateStorylineCategoryAgg(storylineCategoryAgg, String(final?.character?.storylineId || "unknown"), openedEntries);
    const nearRepeats = countNearRepeats(openedIds, 8);
    const repeatRate = openedIds.length ? (nearRepeats / openedIds.length) : 0;
    if (openedIds.length >= 8 && repeatRate > 0.22) {
      issues.push(`event-repeat-high: ${nearRepeats}/${openedIds.length}`);
    }

    const profileRatios = profileSignalRatios(openedEntries);
    if (openedEntries.length >= 8 && profileRatios.core < 0.55) {
      issues.push(`profile-core-low: ${(profileRatios.core * 100).toFixed(1)}%`);
    }
    if (openedEntries.length >= 8 && profileRatios.background < 0.18) {
      issues.push(`profile-background-low: ${(profileRatios.background * 100).toFixed(1)}%`);
    }
    if (openedEntries.length >= 8 && profileRatios.storyline < 0.08) {
      issues.push(`profile-storyline-low: ${(profileRatios.storyline * 100).toFixed(1)}%`);
    }

    const continuity = continuityTagRate(final.history.logs || []);
    if ((final.history.logs || []).length >= 20 && continuity.bridgeRate < 0.32) {
      issues.push(`continuity-bridge-low: ${(continuity.bridgeRate * 100).toFixed(1)}%`);
    }
    if ((final.history.logs || []).length >= 20 && continuity.profileRate < 0.32) {
      issues.push(`continuity-profile-low: ${(continuity.profileRate * 100).toFixed(1)}%`);
    }
    if ((final.history.logs || []).length >= 20 && continuity.hookRate < 0.42) {
      issues.push(`continuity-hooks-low: ${(continuity.hookRate * 100).toFixed(1)}%`);
    }

    if (issues.length) {
      runFailures.push({ run, issues: reduceIssues(issues) });
    } else {
      passedRuns += 1;
    }
  }

  const dominantSummary = dominantCategorySummary(storylineCategoryAgg);
  const dominantCategories = Object.values(dominantSummary).map((x) => x?.category).filter(Boolean);
  const uniqueDominantCount = new Set(dominantCategories).size;
  const globalIssues = [];
  if (Object.keys(dominantSummary).length >= 3 && uniqueDominantCount < 3) {
    globalIssues.push(`storyline-dominance-overlap: unique=${uniqueDominantCount}`);
  }
  Object.entries(dominantSummary).forEach(([storylineId, row]) => {
    if (row && row.ratio > 0 && row.ratio < 0.15) {
      globalIssues.push(`storyline-dominance-weak:${storylineId}:${(row.ratio * 100).toFixed(1)}%`);
    }
  });

  return {
    pass: simFailures.length === 0 && runFailures.length === 0 && globalIssues.length === 0,
    runsRequested: runs,
    runsPassed: passedRuns,
    runsFailed: runFailures.length,
    stepsPerRun,
    simulationSummary: {
      runtime: `${runtimeSim.filter((x) => x.pass).length}/${runtimeSim.length}`,
      src: `${srcSim.filter((x) => x.pass).length}/${srcSim.length}`
    },
    simulationFailures: simFailures,
    globalIssues,
    storylineDominance: dominantSummary,
    failureSamples: runFailures.slice(0, 10)
  };
}

function isMain() {
  return process.argv[1] && path.resolve(process.argv[1]) === __filename;
}

if (isMain()) {
  const runs = Number(process.argv[2] || 120);
  const stepsPerRun = Number(process.argv[3] || 45);
  const result = runQaStressTests({ runs, stepsPerRun });
  console.log(JSON.stringify(result, null, 2));
  if (!result.pass) process.exit(1);
}
