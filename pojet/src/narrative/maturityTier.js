const MATURE_CATEGORIES = new Set(["relationship", "corruption", "social", "market", "legacy"]);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function isMatureCategory(category) {
  return MATURE_CATEGORIES.has(String(category || ""));
}

export function computeMaturityTier({ state, event, phase } = {}) {
  const s = state || {};
  const relation = s?.relationships?.npcRelations?.core || {};
  const act = Number(s?.world?.act || 1);
  const taint = Number(s?.resources?.taint || 0);
  const desire = Number(relation?.desire || 0);
  const tension = Number(relation?.tension || 0);
  const fear = Number(relation?.fear || 0);
  const tier = String(event?.tier || "");
  const category = String(event?.category || "");

  let score = 0;
  score += (act - 1) * 0.4;
  score += clamp(taint / 100, 0, 1) * 1.8;
  score += clamp(desire / 100, 0, 1) * 1.4;
  score += clamp(tension / 100, 0, 1) * 0.9;
  score += clamp(fear / 100, 0, 1) * 0.7;

  if (tier === "T2") score += 0.35;
  if (tier === "T3") score += 0.7;
  if (isMatureCategory(category)) score += 0.45;
  if (String(phase || "") === "social") score += 0.15;

  const level = score < 1.2
    ? 1
    : score < 2.1
      ? 2
      : score < 3.0
        ? 3
        : score < 3.9
          ? 4
          : 5;

  const label = `S${level}`;
  const style = {
    1: "restrained",
    2: "suggestive",
    3: "heated",
    4: "intense",
    5: "extreme"
  }[level];

  return { level, label, style, score: Number(score.toFixed(3)) };
}

export function maturityWeightBoost(level, category) {
  const mature = isMatureCategory(category);
  if (level <= 1) return mature ? 0.6 : 1.15;
  if (level === 2) return mature ? 1.0 : 1.0;
  if (level === 3) return mature ? 1.25 : 0.95;
  if (level === 4) return mature ? 1.45 : 0.85;
  return mature ? 1.65 : 0.75;
}

