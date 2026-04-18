# Toss Clean Starter Status

Date: 2026-03-31

## Current artifact

- File: `C:\Users\rndhr\Documents\GitHub\EleggLaboratory\game_DEV\mobile-saju-fortune-toss\apps\toss-clean\astra.ait`
- Size: `2,776,059 bytes`
- SHA256: `5AD2E020B4FF58E48D2DB8F7820E83F9A314189F74EFDE4EBE054363D176CC45`
- Local `ait build` deploymentId: `019d446d-af91-77be-86a1-6c60f43c3126`

## What this build is

- Official starter-based clean Toss shell
- `appName: astra`
- `displayName: 아스트라: 오늘의 운세`
- Minimal diagnostic route only
- No legacy Toss page tree
- No TDS dependency in the boot path

## What has been verified

- `pnpm install`
- `pnpm typecheck`
- `pnpm build`
- `pnpm exec ait build`
- Emulator local dev reaches sandbox login screen with `intoss://astra`

## Important note

This artifact is meant to confirm that a clean official starter shell can boot before re-importing the existing app UI.

The next meaningful test is on a real device after reconnecting `adb`, logging into the sandbox app, and opening the local dev route or a newly uploaded private deployment.
