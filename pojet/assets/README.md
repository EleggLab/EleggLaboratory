# Runtime Asset Layout

This folder defines the normalized runtime-facing asset structure.

Current third-party packs are still stored under `Asset/` (legacy import location).  
As assets are curated, copy/export runtime-ready files into this tree and update:

- `data/presentation/character-asset-catalog.json`
- `data/presentation/character-layer-map.json`
- `data/presentation/background-scene-map.json`

Recommended layout:

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

