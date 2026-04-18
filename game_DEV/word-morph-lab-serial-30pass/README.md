# Word Morph Lab Serial 30x3

This folder is the strict serial clone of `game_DEV/word-morph-lab`.

The original project stays untouched. All protocol work for the strict pass loop lives only in this clone:

- Clone path: `game_DEV/word-morph-lab-serial-30pass`
- Source baseline: `game_DEV/word-morph-lab`
- Local test URL: `http://127.0.0.1:4174`
- Storage key: `word-morph-lab-serial-30pass-v1`

## What Changed In The Clone

- Separate browser save state so the clone never collides with the original lab.
- Expanded loop telemetry with misses, hints, last input, and resonance.
- Restored and protected the visible dialogue layer under the portrait.
- Added alias rails, dossier depth fields, and a sidebar event feed.
- Localized category display labels across the active loop surfaces.

## Strict Serial Protocol

Track order is fixed:

1. `A01-A30` for overall loop structure
2. `B01-B30` for systems, copy, and content
3. `C01-C30` for UI and art framing

Each pass file follows the same structure:

- `Identity`
- `Visible Inputs`
- `Preserved Trunk`
- `Critique`
- `Applied Change`
- `Validation`
- `Handoff`

## Documents

- Overall track: `docs/serial-passes/overall`
- Content track: `docs/serial-passes/content`
- UI track: `docs/serial-passes/ui`
- Summaries:
  - `docs/serial-passes/overall/A-summary.md`
  - `docs/serial-passes/content/B-summary.md`
  - `docs/serial-passes/ui/C-summary.md`

## Local Run

```bash
cd game_DEV/word-morph-lab-serial-30pass
python -m http.server 4174
```

Open `http://127.0.0.1:4174`.

## Notes

- Image regeneration is out of scope for this serial 30x3 protocol.
- UI/art records may log art debt, but they do not rerender the 100 generated images.
- The clone still uses the same generated asset set already present in `assets/generated`.
