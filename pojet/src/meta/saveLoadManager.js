import { normalizeLogEntry } from "../narrative/narrativeEngine.js";

const SAVE_KEY = "ashmark.save.current";
const AUTO_KEY = "ashmark.save.auto";
const ARCHIVE_KEY = "ashmark.save.archive";
const VERSION = 1;

export function createSaveLoadManager() {
  function save(state, auto = false) {
    const payload = {
      saveVersion: VERSION,
      savedAt: new Date().toISOString(),
      state
    };
    localStorage.setItem(auto ? AUTO_KEY : SAVE_KEY, JSON.stringify(payload));
  }

  function load(preferAuto = false) {
    const raw = localStorage.getItem(preferAuto ? AUTO_KEY : SAVE_KEY) || localStorage.getItem(AUTO_KEY);
    if (!raw) return null;
    try {
      const data = JSON.parse(raw);
      return migrate(data);
    } catch {
      return null;
    }
  }

  function archiveChronicle(entry) {
    const arr = getArchive();
    arr.unshift(entry);
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(arr.slice(0, 60)));
  }

  function getArchive() {
    try { return JSON.parse(localStorage.getItem(ARCHIVE_KEY) || "[]"); } catch { return []; }
  }

  function clearCurrent() {
    localStorage.removeItem(SAVE_KEY);
  }

  return { save, load, archiveChronicle, getArchive, clearCurrent, version: VERSION };
}

function migrate(payload) {
  if (!payload || typeof payload !== "object") return null;
  if (!payload.saveVersion) payload.saveVersion = 1;
  if (payload.saveVersion > VERSION) return null;
  const s = payload.state || {};
  s.history = s.history || { logs: [], events: [] };
  s.history.logs = Array.isArray(s.history.logs) ? s.history.logs.map((log) => normalizeLogEntry(log, { source: "migrated" })) : [];
  s.history.events = Array.isArray(s.history.events) ? s.history.events : [];
  s.history.majorChoices = Array.isArray(s.history.majorChoices) ? s.history.majorChoices : [];
  s.history.relationChanges = Array.isArray(s.history.relationChanges) ? s.history.relationChanges : [];
  s.history.completedQuests = Array.isArray(s.history.completedQuests) ? s.history.completedQuests : [];
  s.chronicle = s.chronicle || { entries: [], legacyFlags: [], inheritancePool: [] };
  return s;
}
