function toAssetPath(parts) {
  return `./${parts.map((p) => encodeURIComponent(p)).join("/")}`;
}

const FALLBACK_SCENE_BY_CLASS = {};
const FALLBACK_FACE_BY_MOOD = {};

const LINEAGE_FACE_INDEX = {
  draconic: 1,
  stonefolk: 2,
  longkin: 3,
  smallkin: 4,
  "mixed-grace": 5,
  "mixed-fury": 2,
  smallfoot: 4,
  human: 1,
  infernal: 3,
  succubus: 5
};

const TONE_CLASSES = ["scene-tone-day", "scene-tone-dusk", "scene-tone-night"];
const OVERLAY_CLASSES = ["scene-overlay-none", "scene-overlay-battle", "scene-overlay-romance", "scene-overlay-corruption"];

function inferMood(visual) {
  const expr = String(visual?.expression || "").toLowerCase();
  if (expr.includes("soft") || expr.includes("confident") || expr.includes("resolved")) return "soft";
  if (expr.includes("guard") || expr.includes("watch")) return "guarded";
  if (expr.includes("grim") || expr.includes("pain")) return "grim";
  if (expr.includes("wavering")) return "sad";
  return "neutral";
}

function neutralFaceForLineage(lineageId) {
  const idx = LINEAGE_FACE_INDEX[lineageId] || 1;
  if (!idx) return null;
  return null;
}

function themeClassForBackground(backgroundId) {
  if (["smuggler-runner", "orphan-cutpurse"].includes(backgroundId)) return "portrait-theme-underbelly";
  if (["crusade-runner", "funeral-aide"].includes(backgroundId)) return "portrait-theme-ritual";
  if (["fallen-bastard", "tower-dropout"].includes(backgroundId)) return "portrait-theme-elite";
  return "portrait-theme-frontier";
}

function resolveLayerData(state, visual, layerMap = {}) {
  const classId = state?.character?.classId || "fighter";
  const lineageId = state?.character?.lineageId || "human";
  const backgroundId = state?.character?.backgroundId || "border-conscript";
  const mood = inferMood(visual);

  const baseLayer = layerMap?.baseByLineage?.[lineageId] || "base_human_neutral";
  const faceLayer = layerMap?.faceByMood?.[mood] || "face_neutral";
  const classOutfit = layerMap?.outfitByClass?.[classId];
  const backgroundOutfit = layerMap?.outfitByBackground?.[backgroundId];
  const outfitLayer = backgroundOutfit || classOutfit || "outfit_default";

  const effectSet = new Set();
  for (const tag of visual?.tags || []) {
    const fx = layerMap?.effectByTag?.[tag];
    if (fx) effectSet.add(fx);
  }

  return {
    baseLayer,
    faceLayer,
    outfitLayer,
    effectLayers: [...effectSet]
  };
}

function inferTimeSlot(state) {
  const tick = Number(state?.time?.tick || 0);
  const mod = tick % 3;
  if (mod === 0) return "day";
  if (mod === 1) return "dusk";
  return "night";
}

function findSceneByLocation(locationId, byLocationKeyword = {}) {
  const loc = String(locationId || "").toLowerCase();
  const entries = Object.entries(byLocationKeyword || {});
  for (const [keyword, path] of entries) {
    if (!keyword || !path) continue;
    if (loc.includes(String(keyword).toLowerCase())) return path;
  }
  return null;
}

function resolveOverlayType(state, visual) {
  const taint = Number(state?.resources?.taint || 0);
  const latestEvent = state?.history?.events?.[0] || {};
  const isCombatPulse = latestEvent?.category === "faction" || latestEvent?.category === "relic" || latestEvent?.tier === "T3";
  const isRomancePulse = latestEvent?.category === "relationship" || (Number(state?.relationships?.npcRelations?.core?.desire || 0) >= 22);
  const isCorruptPulse = taint >= 40 || (visual?.overlays || []).some((x) => String(x).includes("shadow"));

  if (isCorruptPulse) return "corruption";
  if (isCombatPulse) return "battle";
  if (isRomancePulse) return "romance";
  return "none";
}

export function resolveAssetPortrait(state, visual, presentationPack = null) {
  const classId = state?.character?.classId || "fighter";
  const lineageId = state?.character?.lineageId || "human";
  const backgroundId = state?.character?.backgroundId || "border-conscript";
  const gender = state?.character?.gender || "male";
  const mood = inferMood(visual);

  const catalog = presentationPack?.characterAssetCatalog || {};
  const layerMap = presentationPack?.characterLayerMap || {};

  const faceImage = catalog?.faceByGenderMood?.[gender]?.[mood]
    || catalog?.faceByMood?.[mood]
    || FALLBACK_FACE_BY_MOOD[mood]
    || neutralFaceForLineage(lineageId)
    || null;
  const sceneImage = catalog?.portraitByClass?.[classId]
    || FALLBACK_SCENE_BY_CLASS[classId]
    || null;
  const layers = resolveLayerData(state, visual, layerMap);

  return {
    faceImage,
    sceneImage,
    themeClass: themeClassForBackground(backgroundId),
    layers
  };
}

export function applyAssetPortrait(portraitEl, artEl, asset) {
  if (!portraitEl || !artEl) return;

  // Guard against broken image placeholders when a mapped asset path is invalid.
  if (!artEl.dataset.assetGuardBound) {
    artEl.addEventListener("error", () => {
      artEl.removeAttribute("src");
      artEl.classList.add("hidden");
      artEl.dataset.assetLoad = "error";
    });
    artEl.addEventListener("load", () => {
      artEl.classList.remove("hidden");
      artEl.dataset.assetLoad = "ok";
    });
    artEl.dataset.assetGuardBound = "1";
  }

  portraitEl.classList.remove(
    "portrait-theme-frontier",
    "portrait-theme-underbelly",
    "portrait-theme-ritual",
    "portrait-theme-elite",
    "has-effect-layer"
  );

  if (asset?.sceneImage) {
    portraitEl.style.setProperty("--portrait-scene-image", `url("${asset.sceneImage}")`);
    portraitEl.classList.add("has-scene-asset");
  } else {
    portraitEl.style.removeProperty("--portrait-scene-image");
    portraitEl.classList.remove("has-scene-asset");
  }

  if (asset?.themeClass) portraitEl.classList.add(asset.themeClass);

  if (asset?.faceImage) {
    artEl.classList.add("hidden");
    artEl.dataset.assetLoad = "pending";
    artEl.src = asset.faceImage;
  } else {
    artEl.removeAttribute("src");
    artEl.classList.add("hidden");
    artEl.dataset.assetLoad = "none";
  }

  const layerData = asset?.layers || {};
  portraitEl.dataset.layerBase = layerData.baseLayer || "";
  portraitEl.dataset.layerFace = layerData.faceLayer || "";
  portraitEl.dataset.layerOutfit = layerData.outfitLayer || "";
  portraitEl.dataset.layerEffects = (layerData.effectLayers || []).join(",");
  portraitEl.title = `base:${portraitEl.dataset.layerBase} | face:${portraitEl.dataset.layerFace} | outfit:${portraitEl.dataset.layerOutfit}`;

  if ((layerData.effectLayers || []).length) portraitEl.classList.add("has-effect-layer");
}

export function resolveSceneBackground(state, visual, presentationPack = null) {
  const classId = state?.character?.classId || "fighter";
  const locationId = state?.world?.locationId || "";
  const bgMap = presentationPack?.backgroundSceneMap || {};

  const byLocation = bgMap?.byLocationKeyword || {};
  const byClassFallback = bgMap?.byClassFallback || {};
  const timeToneMap = bgMap?.timeTone || {};
  const stateOverlayMap = bgMap?.stateOverlay || {};

  const image = findSceneByLocation(locationId, byLocation)
    || byClassFallback[classId]
    || FALLBACK_SCENE_BY_CLASS[classId]
    || null;

  const timeSlot = inferTimeSlot(state);
  const toneClass = timeToneMap[timeSlot] || `scene-tone-${timeSlot}`;

  const overlayType = resolveOverlayType(state, visual);
  const overlayClass = stateOverlayMap[overlayType] || `scene-overlay-${overlayType}`;

  return {
    image,
    toneClass,
    overlayClass
  };
}

export function applySceneBackground(mainPanelEl, scene) {
  if (!mainPanelEl) return;

  mainPanelEl.classList.remove("has-scene-bg", ...TONE_CLASSES, ...OVERLAY_CLASSES);
  if (scene?.image) {
    mainPanelEl.style.setProperty("--main-scene-image", `url("${scene.image}")`);
    mainPanelEl.classList.add("has-scene-bg");
  } else {
    mainPanelEl.style.removeProperty("--main-scene-image");
  }

  if (scene?.toneClass) mainPanelEl.classList.add(scene.toneClass);
  if (scene?.overlayClass) mainPanelEl.classList.add(scene.overlayClass);
}
