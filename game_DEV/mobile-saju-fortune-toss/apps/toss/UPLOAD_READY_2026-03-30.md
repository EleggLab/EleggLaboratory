# Toss Upload Ready

Build date: `2026-03-30`

Upload file:
- `C:\Users\rndhr\Documents\GitHub\EleggLaboratory\game_DEV\mobile-saju-fortune-toss\apps\toss\fortune-suite-toss.ait`

SHA256:
- `D6FCF91961C31494BFD805F73F782B4F29DA77BC70B3FF56898B986230252E86`

Bundle metadata used for this build:
- `TOSS_APP_NAME=fortune-suite-toss`
- `TOSS_CONSOLE_APP_NAME=fortune-suite-toss`
- `TOSS_BRAND_DISPLAY_NAME=종합 운세`
- `TOSS_BRAND_PRIMARY_COLOR=#D6B25E`
- `TOSS_BRAND_ICON_URL=https://raw.githubusercontent.com/EleggLab/EleggLaboratory/main/game_DEV/mobile-saju-fortune-toss/apps/toss/assets/console/app-logo.png`
- `TOSS_CUSTOMER_SERVICE_EMAIL=rndhrn22@gmail.com`
- `TOSS_CUSTOMER_SERVICE_PHONE=+82-10-0000-0000`
- `TOSS_CUSTOMER_SERVICE_CHAT_URL=https://github.com/EleggLab/EleggLaboratory/issues`
- `TOSS_ENABLE_BANNER_ADS=false`
- `TOSS_ENABLE_FULLSCREEN_ADS=false`

QA completed:
- `corepack pnpm --filter @saju/toss prepare:console-assets`
- `corepack pnpm --filter @saju/toss audit:parity`
- `corepack pnpm --filter @saju/toss typecheck`
- `corepack pnpm --filter @saju/toss test`
- `corepack pnpm --filter @saju/toss validate:release-env`
- `corepack pnpm build:toss`

Notes:
- Console screenshots and icon files are in `apps/toss/assets/console`.
- The support phone is a provisional value and should be replaced with the real support phone if Toss console policy requires a live customer service line.
