# Pojet Asset Research and Integration Plan

Date: 2026-03-12  
Scope: character customization assets, background assets, runtime linkage

## 1. Goal

- Improve visual consistency and immersion for text RPG flow.
- Use layered character assets for dynamic state expression.
- Use location/time/state-based background switching.
- Keep commercial-use compliance auditable.

## 2. Character Asset Strategy

- Approach: layered composition metadata (`base`, `face`, `outfit`, `effect`).
- Runtime binding:
  - lineage -> base layer
  - mood/expression -> face layer
  - class/background -> outfit layer
  - state tags -> effect layers
- Added data:
  - `data/presentation/character-asset-catalog.json`
  - `data/presentation/character-layer-map.json`

## 3. Background Asset Strategy

- Approach: scene image mapping by location keyword with class fallback.
- Visual modulation:
  - time tone (`day`, `dusk`, `night`)
  - state overlay (`battle`, `romance`, `corruption`, `none`)
- Added data:
  - `data/presentation/background-scene-map.json`

## 4. Runtime Integration

- Loader extended:
  - `src/presentation/presentationLoader.js`
  - now loads asset catalog/layer map/background map.
- Portrait resolver upgraded:
  - `src/presentation/assetPortraitRenderer.js`
  - adds layer metadata and scene background resolver.
- UI wiring:
  - `app.js` now applies portrait asset + main panel scene background.
- Styling support:
  - `styles.css` includes scene background/tone/overlay classes.

## 5. Source and License Policy

- Source classes tracked in `character-asset-catalog.json`:
  - itch.io packs
  - CraftPix / GameArt2D
  - Lemma Soft / RenPy community
  - Pixabay / Pexels
  - AI-generated assets
- Rule:
  - no ambiguous-license asset in release
  - keep purchase/license evidence in project documentation
  - mark blocked assets until legal status is verified

## 6. Asset Folder Convention

- Standardized runtime-facing convention:

```text
assets/
  characters/
    <species>/
      base/
      face/
      outfit/
      effect/
  backgrounds/
    <location>/
      day/
      dusk/
      night/
      overlay/
```

- Current external packs remain in `Asset/` and are referenced via mapping files.
- Migration can be done incrementally by updating `data/presentation/*.json`.

## 7. Next Implementation Tasks

- Add live preview tool for layer tags and scene overlays.
- Build asset validation script:
  - path exists check
  - unresolved mapping report
  - license status check flag
- Add optional per-event override:
  - event-level portrait mood hint
  - event-level background override

