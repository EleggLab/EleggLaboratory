# {{PROJECT_NAME}}

Shared starter for a non-game Toss miniapp built with React Native, Granite, and App-in-Toss.

This template is intentionally scoped to the non-game lane. If the service is a game, treat it as a separate track with its own stack, QA, asset, and release checklist.

## Baseline
- SDK: `@apps-in-toss/framework@2.0.5`
- React Native: `0.84.0`
- React: `19.2.3`
- Build command: `ait build`
- Ad default: banner only

## Quick Start
1. Create the app in the Toss console and record the real `appName`.
2. Copy `.env.example` to `.env`.
3. Fill the env values and `assets/console/asset-manifest.json`.
4. Run `pnpm install`.
5. Run `pnpm dev`.
6. Run `pnpm validate:release-env` and then `pnpm build`.

## Scripts
- `pnpm dev`: local development
- `pnpm router:types`: regenerate route typings from `pages/`
- `pnpm build`: strict release validation + `.ait` build
- `pnpm validate:release-env`: release gate for env, support info, ad IDs, and asset manifest
- `pnpm qa:sandbox`: sandbox QA guide
- `pnpm qa:toss`: QR/Toss-app QA guide
- `pnpm deploy:test`: `ait deploy` wrapper for test uploads

## Docs Contract
- `docs/APP_REGISTRATION_SHEET.md`
- `docs/AD_SLOT_SHEET.md`
- `docs/RELEASE_CHECKLIST.md`
- `docs/SETTLEMENT_OPERATIONS_CHECKLIST.md`

## Official References
- Ads intro: https://developers-apps-in-toss.toss.im/ads/intro.html
- Ads console: https://developers-apps-in-toss.toss.im/ads/console.html
- Ads development: https://developers-apps-in-toss.toss.im/ads/develop.html
- Ads QA: https://developers-apps-in-toss.toss.im/ads/qa.html
- Settlement: https://developers-apps-in-toss.toss.im/settlement/intro.html
- React Native tutorial: https://developers-apps-in-toss.toss.im/tutorials/react-native.html
- SDK 2.x migration: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/%EC%8B%9C%EC%9E%91%ED%95%98%EA%B8%B0/SDK2.0.1.html
- Sandbox testing: https://developers-apps-in-toss.toss.im/development/test/sandbox.html
- Console app registration: https://developers-apps-in-toss.toss.im/prepare/console-workspace.html
- Release notes: https://developers-apps-in-toss.toss.im/release-note.html

## Notes
- Sandbox does not support in-app ads. Use console QR or Toss-app testing for ad verification.
- SDK 1.x bundles are blocked from upload after `2026-03-23`.
- Treat fullscreen ads, login, IAP, share, and marketing as expansion tracks. They ship disabled by default in this starter.
- The build wrapper prepares a local `pnpm` shim through `corepack` before calling `ait build`, which helps on machines without a global `pnpm` install.
