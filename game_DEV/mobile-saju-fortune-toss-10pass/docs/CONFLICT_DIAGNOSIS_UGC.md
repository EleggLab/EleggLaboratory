# UGC Conflict Diagnosis

## Root Cause
- The terminal/IDE working directory was still:
  - `C:\Users\rndhr\OneDrive\Desktop\60seconds-ugc-tool (2)\60seconds-ugc-tool`
- Commands executed without explicit path can target the UGC repo by mistake.

## What Was Fixed
- `run-mobile-8082.cmd` now always `cd` to `saju-vibe-monorepo` and starts Expo with cache clear (`-c`).
- Added `run-web-3100.cmd` in saju repo for isolated web port (`3100`).
- Added redirect launchers inside UGC repo:
  - `RUN_SAJU_8082.cmd`
  - `RUN_SAJU_WEB_3100.cmd`

## Safe Start Points
- Saju mobile-web: `http://localhost:8082`
- Saju web: `http://localhost:3100`

