# Toss Miniapp RN Foundation

This note defines the shared baseline for new non-game Toss miniapps built with React Native, Granite, and App-in-Toss.

## What This Starter Includes
- A standalone React Native Toss miniapp template at `templates/toss-rn-miniapp`
- Fixed SDK baseline for Toss App-in-Toss RN 2.x releases
- Banner-ad-ready abstraction with test IDs and production guards
- Release env validation, QR/Toss-app QA scripts, and CI deploy scaffolding
- Shared docs sheets for app registration, ad slots, release, and settlement operations

## Official Sources
- In-app ads intro: https://developers-apps-in-toss.toss.im/ads/intro.html
- Ads console guide: https://developers-apps-in-toss.toss.im/ads/console.html
- Ads development guide: https://developers-apps-in-toss.toss.im/ads/develop.html
- Ads QA checklist: https://developers-apps-in-toss.toss.im/ads/qa.html
- Settlement intro: https://developers-apps-in-toss.toss.im/settlement/intro.html
- React Native tutorial: https://developers-apps-in-toss.toss.im/tutorials/react-native.html
- SDK 2.x migration: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/%EC%8B%9C%EC%9E%91%ED%95%98%EA%B8%B0/SDK2.0.1.html
- Sandbox testing: https://developers-apps-in-toss.toss.im/development/test/sandbox.html
- Console app registration: https://developers-apps-in-toss.toss.im/prepare/console-workspace.html
- Release notes: https://developers-apps-in-toss.toss.im/release-note.html

## Latest Constraints Reviewed
- `2026-03-23`: SDK 1.x bundles can no longer be uploaded.
- `2026-03-11`: SDK `2.0.5` is the latest listed RN 2.x stability update.
- `2026-02-23`: in-app ads 2.0 ver2 added banner ads to the integrated ad stack.
- `2026-01-23`: params-based event dashboard analysis was added.
- `2025-12-05`: `ait deploy` CLI upload support was added for CI/CD.

## Operational Prerequisites
- Register the workspace and ensure the correct representative admin can accept terms.
- If monetization is required, complete business registration, agreement flow, and settlement info review first.
- Upload the real app logo and console assets before release validation.
- Create separate development and live apps in the Toss console when you want isolated QA and release rails.
- Expect ad group propagation to take up to 2 hours after creation.
- Prepare a bank-account copy for settlement info review.
- Prepare Popbill reverse-invoice approval for ad settlement operations.

## QA Rails
- Sandbox: routing, TDS rendering, app brand, back/foreground, and `intoss://{appName}`.
- QR/Toss app: banner ads, click-through, return flow, audio pause/resume, and background recovery.
- Live ops: verify analytics and settlement data on `+1 day` dashboards and monthly settlement cadence.

## Expected Output Per App
- App registration sheet
- Ad slot sheet
- Release checklist
- Settlement operations checklist
