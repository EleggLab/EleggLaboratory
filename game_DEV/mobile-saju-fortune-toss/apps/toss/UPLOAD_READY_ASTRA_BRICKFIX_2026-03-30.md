# Toss Upload Ready: Astra Brick Fix

Build date: `2026-03-30`

Upload file:
- `C:\Users\rndhr\Documents\GitHub\EleggLaboratory\game_DEV\mobile-saju-fortune-toss\apps\toss\astra.ait`

SHA256:
- `D03956FA242C46FAA09F791DFE6B511E6EBBF232ABBAB3C213718720E9A98B36`

Bundle metadata used for this build:
- `TOSS_APP_NAME=astra`
- `TOSS_CONSOLE_APP_NAME=astra`
- `TOSS_BRAND_DISPLAY_NAME=아스트라: 오늘의 운세`
- `TOSS_BRAND_PRIMARY_COLOR=#F7C948`
- `TOSS_BRAND_ICON_URL=https://raw.githubusercontent.com/EleggLab/EleggLaboratory/main/game_DEV/mobile-saju-fortune-toss/apps/toss/assets/console/app-logo.png`
- `TOSS_CUSTOMER_SERVICE_EMAIL=rndhrn9@gmail.com`
- `TOSS_CUSTOMER_SERVICE_PHONE=+82-10-0000-0000`
- `TOSS_CUSTOMER_SERVICE_CHAT_URL=https://github.com/EleggLab/EleggLaboratory/issues`
- `TOSS_ENABLE_BANNER_ADS=false`
- `TOSS_ENABLE_FULLSCREEN_ADS=false`

QA completed:
- `corepack pnpm --filter @saju/toss prepare:console-assets`
- `corepack pnpm --filter @saju/toss validate:release-env`
- `corepack pnpm --filter @saju/toss typecheck`
- `corepack pnpm --filter @saju/toss test`
- `corepack pnpm --filter @saju/toss audit:parity`
- `corepack pnpm build:toss`

Brick fix verification:
- `.granite/micro-frontend-runtime.js` now contains `"brick-module":{"eager":true}`
- `.granite/micro-frontend-runtime.js` now locally registers `brick-module`
- `dist/bundle.android.js` contains bundled `brick-module` code and `registerShared("brick-module", ...)`
- `dist/bundle.android.js` now wraps `getSchemeUri()` with a safe fallback that returns `""` if `BrickModule` is missing in the host binary
- `dist/bundle.android.js` now wraps `GraniteBrownfieldModule` initialization in a safe fallback, so import-time access to `BrickModule` no longer hard-crashes the app

Important:
- The previously uploaded build that crashed in Toss app should not be reused.
- Re-upload this `astra.ait` as a new app version, then test again with the new test QR/deep link.
