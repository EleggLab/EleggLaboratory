# Toss Miniapp Launch Checklist

This checklist is for the non-game app lane. If the product is a game, use `checklists/toss-game-launch.md` as the primary release checklist instead.

## Console And Brand
- [ ] Workspace, representative admin, and required terms are complete.
- [ ] The real Toss console `appName` is fixed and copied into the project env.
- [ ] App logo asset is ready as `600x600` PNG with non-transparent background.
- [ ] Square thumbnail asset is ready as `1000x1000` PNG.
- [ ] Landscape thumbnail asset is ready as `1932x828` PNG.
- [ ] Search screenshots are prepared as either `636x1048` portrait assets or `1504x741` landscape assets.
- [ ] Category, subtitle, search keywords, and support channels are finalized.

## Env And Feature Flags
- [ ] `TOSS_APP_NAME` matches the live console app name exactly.
- [ ] `TOSS_CONSOLE_APP_NAME` is filled with the same value for release validation.
- [ ] Brand display name, primary color, and icon URL are final.
- [ ] Customer service email, phone, and chat URL are all present.
- [ ] Banner ad group IDs are filled only with production IDs.
- [ ] `TOSS_ENABLE_FULLSCREEN_ADS=false` for the shared v1 foundation.
- [ ] Login, IAP, share, and marketing flags are enabled only when corresponding implementation is ready.

## QA
- [ ] `pnpm qa:sandbox` reviewed and sandbox checks completed.
- [ ] `pnpm qa:toss` reviewed and QR/Toss-app checks completed.
- [ ] First release scope still fits a non-game v1 footprint of roughly `2 to 4` service screens.
- [ ] Banner no-fill and render-failure states collapse cleanly.
- [ ] Ads do not block payment, login, signup, or critical user actions.
- [ ] Back/foreground, network retry, and audio behavior are confirmed on real devices.

## Settlement And Release
- [ ] Settlement info review is approved in the Toss console.
- [ ] Bank-account copy is registered correctly.
- [ ] Popbill reverse-invoice approval owner is assigned.
- [ ] Current settlement terms were rechecked against the live doc before launch, especially for time-limited fee promotions.
- [ ] `pnpm validate:release-env` passes.
- [ ] `.ait` build is generated.
- [ ] Test upload path is confirmed via console QR or `ait deploy`.
