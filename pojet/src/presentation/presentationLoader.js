export async function loadPresentationPack() {
  const keys = [
    "portrait-state-map",
    "character-asset-catalog",
    "character-layer-map",
    "background-scene-map",
    "emotion-presets",
    "panel-emphasis-rules",
    "run-end-types",
    "legacy-rewards"
  ];

  const pack = {};
  for (const key of keys) {
    try {
      const r = await fetch(`./data/presentation/${key}.json`);
      if (!r.ok) throw new Error(String(r.status));
      pack[toKey(key)] = await r.json();
    } catch {
      pack[toKey(key)] = null;
    }
  }

  return {
    portraitStateMap: pack.portraitStateMap || { baseLayers: {}, tagRules: [], priority: [] },
    characterAssetCatalog: pack.characterAssetCatalog || {
      sources: [],
      notes: [],
      portraitByClass: {},
      faceByMood: {},
      faceByGenderMood: {}
    },
    characterLayerMap: pack.characterLayerMap || {
      baseByLineage: {},
      faceByMood: {},
      outfitByClass: {},
      outfitByBackground: {},
      effectByTag: {}
    },
    backgroundSceneMap: pack.backgroundSceneMap || {
      byLocationKeyword: {},
      byClassFallback: {},
      timeTone: {},
      stateOverlay: {}
    },
    emotionPresets: pack.emotionPresets || {},
    panelEmphasisRules: pack.panelEmphasisRules || { default: { border: "normal", glow: 0.1, scale: 1 } },
    runEndTypes: pack.runEndTypes || [],
    legacyRewards: pack.legacyRewards || {}
  };
}

function toKey(v) {
  return v.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}
