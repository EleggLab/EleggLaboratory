# Astra Home System

## Source Of Truth

- Source repo: `C:\Users\rndhr\Documents\GitHub\aaa\EleggLaboratory\game_DEV\mobile-saju-fortune-toss-10pass`
- Astra source assets: `C:\Users\rndhr\Documents\GitHub\aaa\EleggLaboratory\shared-assets\characters\astra`
- Android mirror: `C:\sm10\apps\mobile`

## Asset Pipeline

- Prepare command: `corepack pnpm astra:prepare`
- Generated still assets: `apps/mobile/assets/astra/*/still.png`
- Generated loop gifs: `apps/mobile/assets/astra/*/loop.gif`
- Generated manifest: `apps/mobile/lib/features/astra/generatedManifest.ts`

Latest verified output:

- Variants: `22`
- Still total: `6.75 MB`
- GIF total: `33.71 MB`

## Runtime Rules

- Home picks one Astra variant per app session.
- Available variants depend on current affection tier.
- The first valid home tap of the KST day increases affection by `+1`.
- Missed days decay affection by `-1` per day, never below `1`.
- Max affection is `10`.
- If the chosen variant has a loop GIF, tapping plays it once and blocks re-trigger until the loop finishes.

## QA Notes

- `corepack pnpm astra:prepare`: pass
- `corepack pnpm --filter @saju/mobile typecheck`: pass
- `corepack pnpm --filter @saju/mobile build`: currently blocked by a Metro resolver mismatch unrelated to Astra feature logic

## Dev Logs

In dev builds, the home screen logs these markers:

- `[astra-home] loaded`
- `[astra-home] interaction`
- `[astra-home] loop-start`
- `[astra-home] loop-end`

These are intended for Android mirror QA through `adb logcat`.
