function normalize(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, ' ')
    .trim();
}

function compact(input) {
  return normalize(input).replace(/\s+/g, '');
}

function tokenOverlap(a, b) {
  if (!a || !b) return 0;
  const ta = new Set(a.split(' ').filter(Boolean));
  const tb = new Set(b.split(' ').filter(Boolean));
  if (!ta.size || !tb.size) return 0;
  let common = 0;
  for (const token of ta) {
    if (tb.has(token)) common += 1;
  }
  return common / Math.max(ta.size, tb.size);
}

export function matchPresets(appLabel, packageName, presets, limit = 5) {
  const appNorm = normalize(appLabel);
  const packageNorm = String(packageName || '').toLowerCase();

  const scored = presets
    .map((preset) => {
      const labels = [preset.displayName, ...(preset.aliases || [])].filter(Boolean);
      const normLabels = labels.map(normalize);
      const compactLabels = labels.map(compact);
      const packageHintHit = (preset.packageNameHints || []).some(
        (hint) => String(hint || '').toLowerCase() === packageNorm,
      );

      let score = 0;
      let reason = 'token-overlap';

      if (packageHintHit) {
        score += 1200;
        reason = 'package-hint';
      }

      if (normLabels.some((label) => label === appNorm)) {
        score += 700;
        if (reason !== 'package-hint') reason = 'name-exact';
      } else if (normLabels.some((label) => label.includes(appNorm) || appNorm.includes(label))) {
        score += 380;
        if (reason !== 'package-hint') reason = 'name-contains';
      }

      let overlapMax = 0;
      for (const normLabel of normLabels) {
        overlapMax = Math.max(overlapMax, tokenOverlap(normLabel, appNorm));
      }
      score += Math.round(overlapMax * 250);

      const gameKeyCompact = String(preset.gameKey || '').replace(/-/g, '');
      if (gameKeyCompact && packageNorm.includes(gameKeyCompact)) {
        score += 90;
      }

      const appCompact = compact(appLabel);
      if (appCompact && compactLabels.some((label) => label === appCompact)) {
        score += 180;
      }

      return {
        preset,
        score,
        reason,
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.preset.displayName.localeCompare(b.preset.displayName, 'ko'));

  return scored.slice(0, limit);
}

export function buildCatalog(presets) {
  const list = presets.map((preset, idx) => {
    const packageName =
      (preset.packageNameHints && preset.packageNameHints[0]) ||
      `web.sample.${String(preset.gameKey || `game-${idx}`).replace(/-/g, '')}`;

    return {
      packageName,
      label: preset.displayName,
      installed: idx % 4 !== 0,
    };
  });

  const dedup = new Map();
  for (const item of list) {
    if (!dedup.has(item.packageName)) {
      dedup.set(item.packageName, item);
    }
  }

  return Array.from(dedup.values()).sort((a, b) => a.label.localeCompare(b.label, 'ko'));
}
