function toAssetPath(parts) {
  return `./${parts.map((p) => encodeURIComponent(p)).join("/")}`;
}

const SCENE_BY_CLASS = {
  fighter: toAssetPath(["Asset", "DatingGameUI", "Exports", "Background.jpg"]),
  barbarian: toAssetPath(["Asset", "DatingGameUI", "Exports", "Background.jpg"]),
  paladin: toAssetPath(["Asset", "DatingGameUI", "Exports", "Background.jpg"]),
  rogue: toAssetPath(["Asset", "DatingGameUI", "Exports", "Messaging", "MessagingBackground.png"]),
  ranger: toAssetPath(["Asset", "DatingGameUI", "Exports", "Messaging", "MessagingBackground.png"]),
  monk: toAssetPath(["Asset", "DatingGameUI", "Exports", "Messaging", "MessagingBackground.png"]),
  wizard: toAssetPath(["Asset", "DatingGameUI", "Exports", "Settings", "SettingsBackground.png"]),
  warlock: toAssetPath(["Asset", "DatingGameUI", "Exports", "Settings", "SettingsBackground.png"]),
  sorcerer: toAssetPath(["Asset", "DatingGameUI", "Exports", "Settings", "SettingsBackground.png"]),
  bard: toAssetPath(["Asset", "DatingGameUI", "Exports", "HomeScreen", "HomeScreenBackground.jpg"]),
  cleric: toAssetPath(["Asset", "DatingGameUI", "Exports", "HomeScreen", "HomeScreenBackground.jpg"]),
  druid: toAssetPath(["Asset", "DatingGameUI", "Exports", "HomeScreen", "HomeScreenBackground.jpg"])
};

const FACE_BY_MOOD = {
  soft: toAssetPath(["Asset", "Face", "Face", "Visage Sourire.png"]),
  guarded: toAssetPath(["Asset", "Face", "Face", "Visage Suspicieux.png"]),
  grim: toAssetPath(["Asset", "Face", "Face", "Visage Peur.png"]),
  sad: toAssetPath(["Asset", "Face", "Face", "Visage Triste.png"])
};

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
  return toAssetPath(["Asset", "Face", "Face", `Visage ${idx}.png`]);
}

function themeClassForBackground(backgroundId) {
  if (["smuggler-runner", "orphan-cutpurse"].includes(backgroundId)) return "portrait-theme-underbelly";
  if (["crusade-runner", "funeral-aide"].includes(backgroundId)) return "portrait-theme-ritual";
  if (["fallen-bastard", "tower-dropout"].includes(backgroundId)) return "portrait-theme-elite";
  return "portrait-theme-frontier";
}

export function resolveAssetPortrait(state, visual) {
  const classId = state?.character?.classId || "fighter";
  const lineageId = state?.character?.lineageId || "human";
  const backgroundId = state?.character?.backgroundId || "border-conscript";
  const mood = inferMood(visual);

  const faceImage = FACE_BY_MOOD[mood] || neutralFaceForLineage(lineageId);
  const sceneImage = SCENE_BY_CLASS[classId] || SCENE_BY_CLASS.fighter;

  return {
    faceImage,
    sceneImage,
    themeClass: themeClassForBackground(backgroundId)
  };
}

export function applyAssetPortrait(portraitEl, artEl, asset) {
  if (!portraitEl || !artEl) return;

  portraitEl.classList.remove(
    "portrait-theme-frontier",
    "portrait-theme-underbelly",
    "portrait-theme-ritual",
    "portrait-theme-elite"
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
    artEl.src = asset.faceImage;
    artEl.classList.remove("hidden");
  } else {
    artEl.removeAttribute("src");
    artEl.classList.add("hidden");
  }
}
