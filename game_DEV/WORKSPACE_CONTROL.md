# Workspace Control and Conflict Guard

This folder now has a single control entrypoint for multiple projects:

- `workspace-control.ps1`
- `dev-control.cmd` (Windows wrapper)
- `workspace.projects.json` (project/port manifest)

## Project Naming Map

- `pc-choice-ugc` -> `60sec Choice Game UGC` (PC)
- `mobile-saju-fortune` -> `Saju All-in-One Fortune` (mobile app)
- `mobile-game-homework-checker` -> `Mobile Game Homework Checker` (mobile app)

## Current managed ports (non-conflicting)

- `pc-choice-ugc`: `5200`
- `mobile-saju-fortune`: `8082`
- `mobile-game-homework-checker`: `5300`

## Commands

Run from `game_DEV` root:

```powershell
.\dev-control.cmd list
.\dev-control.cmd status
.\dev-control.cmd install
.\dev-control.cmd start all
.\dev-control.cmd stop all
.\dev-control.cmd logs mobile-saju-fortune
.\dev-control.cmd doctor
```

Or directly:

```powershell
.\workspace-control.ps1 -Action start -Target pc-choice-ugc
```

## Behavior

- Each project has a fixed manifest entry in `workspace.projects.json`.
- On `start`, the controller checks configured ports before launching.
- Running process IDs are tracked in `.workspace-control/pids/`.
- Logs are stored in `.workspace-control/logs/`.
- `status` reports process state + current port ownership.

## Existing launcher cleanup

These scripts were changed from old absolute paths to folder-relative paths:

- `mobile-saju-fortune/run-mobile-8082.cmd`
- `mobile-saju-fortune/run-web-3100.cmd`
- `pc-choice-ugc/RUN_SAJU_8082.cmd`
- `pc-choice-ugc/RUN_SAJU_WEB_3100.cmd`

## Notes

- `mobile-game-homework-checker` runs as an independent Vite app under `mobile-game-homework-checker`.
- `mobile-saju-fortune/apps/web/.env.local` currently contains a real API key. Treat it as sensitive and rotate if it was exposed.
