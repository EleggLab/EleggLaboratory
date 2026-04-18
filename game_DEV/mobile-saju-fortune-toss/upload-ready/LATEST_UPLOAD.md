# Latest Upload

- Current candidate `.ait`:
  - `astra-toss-clean-intro-copy-refresh-20260410-023706.ait`
- Path:
  - `C:\Users\rndhr\Documents\GitHub\EleggLaboratory\game_DEV\mobile-saju-fortune-toss\upload-ready\astra-toss-clean-intro-copy-refresh-20260410-023706.ait`
- Matching note:
  - `UPLOAD_READY_TOSS_CLEAN_INTRO_COPY_REFRESH_20260410-023706.md`

## Current status

- Passed:
  - `corepack pnpm --filter @saju/toss-clean typecheck`
  - `corepack pnpm --filter @saju/toss-clean build`
  - `corepack pnpm --filter @saju/toss-clean run build:upload -- --tag=intro-copy-refresh`
- Latest local deploymentId:
  - `019d7353-7015-78e8-9258-fca5baea01a5`
- SHA256:
  - `19B16F501E123423BDD85E67BF25480251BC1FC66ECB33869202D6B171DD1971`

## What changed in this candidate

- Daily western/chinese icon/detail assets now use the same inline-locked asset pipeline as the working home and tarot assets.
- Tiger now travels through the same standard daily asset path as the other zodiac entries, with the user source copied into the standard icon/detail files during build.
- Daily detail no longer defaults to a second icon underlay, so duplicate-image framing is avoided.
- Daily cards keep tighter text overflow rules and larger bottom reserve above the tab bar.
- Tarot hub hero density and home scrim were polished in the same candidate.

## Immediate verification focus

- Daily western and birth-year list images should no longer render as blank on the real phone.
- Tiger tile and tiger detail should now match the user-provided source through the standard daily pipeline.
- Western detail heroes should render consistently without blank frames.
- Tarot hub top hero density, bottom-tab icon finish, and home scrim smoothness.
- Tab reselect reset and checklist reward flow.

## QA rule

- If Android shows a chooser, open with `Toss`, not `MiniApp`.
- Treat `Toss main app` as the release baseline.
