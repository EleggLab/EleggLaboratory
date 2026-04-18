# Merge Tactics v2 Architecture

## Core stack
- Engine: Flutter
- Platform: Android
- Orientation: Portrait lock (`main.dart` + AndroidManifest)

## Scene modules
- `lib/src/app/app_shell.dart`
  - Top-level navigation: Lobby / Battle / Codex / Battle Pass
  - Shared `PlayerProfile` state wiring
- `lib/src/lobby/lobby_screen.dart`
  - Main lobby with mapped image buttons and currency indicators
- `lib/src/game/game_screen.dart`
  - 5x6 hex-like board, one-handed controls, drag-merge, battle VFX layers
- `lib/src/codex/codex_screen.dart`
  - Unit collection UI with locked silhouettes
- `lib/src/battle_pass/battle_pass_screen.dart`
  - Free/Premium tracks, progress slider, claim flow
- `lib/src/gacha/gacha_dialog.dart`
  - Ancient altar roll sequence and reward reveal

## Game domain
- `lib/src/game/data/game_data.dart`
  - 9 playable units (Tier 1-3) + wave enemies
  - Synergy rule database
- `lib/src/game/game_controller.dart`
  - Summon, merge, wave combat loop, mana/skill handling
  - Side effects: summon/merge/hit/critical overlays and damage popups
- `lib/src/game/models/*`
  - Unit definitions, runtime instances, synergy models, VFX events

## Resource mapping
All runtime assets are normalized under `Assets/Mapped/` and referenced via
`lib/src/resources/resource_map.dart`.

Mapped groups:
- UI kit: button/panel/slider/textbox
- Icons: gear/home/locked
- Fonts: KenneyMiniSquare + Chogoon
- Audio: click/select/impact/laser/jingles/powerup/equip/engine/pickup
- VFX textures: gradient-radial + perlin-noise
- Unit placeholders: square/triangle/circle variants
- Lobby/currency/battle-pass icons

## File naming fallback policy
Some prompt names were not present verbatim in source packs. Equivalent files
were remapped to maintain behavior:
- `Play_Button.png` / `Settings_Button.png`: mapped from DatingGameUI button files.
- `panel_blue.png`: mapped from available blue UI panel-like texture.
- `Gem.png`: mapped from available diamond collectible icon.
- `equip.ogg`, `pickup.ogg`, `jingle_*`: mapped to closest available SFX/Jingle files.

## Next practical extension
1. Replace abstract combat distance model with true hex pathing/target lock.
2. Add server-backed account/social/live-service systems.
3. Add analytics and push notification adapters.
