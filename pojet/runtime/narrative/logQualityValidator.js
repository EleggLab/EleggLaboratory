import { normalizeLogEntry } from "../../src/narrative/narrativeEngine.js";

function validateOne(entry) {
  const issues = [];
  const isLegacy = entry.kind === "legacy";
  if (!entry.feedLine || entry.feedLine.length < 8) issues.push("feedLine too short");
  if (!isLegacy && !entry.feedLine.includes("|") && !entry.feedLine.includes("[")) issues.push("feedLine missing source/location hint");

  const body = String(entry.bodyParagraph || "");
  const sanitizedBody = body
    .replace(/\?{2,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const sentences = sanitizedBody
    ? sanitizedBody.split(/[.!]\s+/).filter(Boolean).length
    : 0;
  if (!isLegacy && body && (sentences < 2 || sentences > 14)) issues.push("bodyParagraph sentence count out of range");

  if (!Array.isArray(entry.causalNotes)) issues.push("causalNotes must be array");
  if (!Array.isArray(entry.followupHooks)) issues.push("followupHooks must be array");
  if (!Array.isArray(entry.visualStateTags)) issues.push("visualStateTags must be array");

  return { pass: issues.length === 0, issues };
}

export function buildLogQualityReport(logs = []) {
  const normalized = logs.slice(0, 60).map((log) => normalizeLogEntry(log));
  if (!normalized.length) {
    return {
      pass: true,
      summary: "검증 대상 로그가 없어 기본 PASS 처리됨",
      checked: 0,
      failed: 0
    };
  }

  let failed = 0;
  const issueBag = [];

  normalized.forEach((entry) => {
    const r = validateOne(entry);
    if (!r.pass) {
      failed += 1;
      issueBag.push(...r.issues);
    }
  });

  const pass = failed <= Math.floor(normalized.length * 0.35);
  const uniqueIssues = [...new Set(issueBag)].slice(0, 4);
  const summary = pass
    ? `품질 점검 통과 (${normalized.length}건 중 ${failed}건 경고)`
    : `품질 경고 다수 (${normalized.length}건 중 ${failed}건 경고): ${uniqueIssues.join(", ")}`;

  return {
    pass,
    summary,
    checked: normalized.length,
    failed,
    issues: uniqueIssues
  };
}



