# Toss Miniapp RN Foundation

This note defines the shared baseline for new non-game Toss miniapps built with React Native, Granite, and App-in-Toss.

The current repository baseline is intentionally for the non-game lane only. Games should be planned and released as a separate lane because their stack, QA rules, runtime APIs, and review criteria differ materially.

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
- `2026-03-31`: the temporary `0%` Toss fee promotion for in-app ad settlement ends on this date, per the settlement guide.

## Lane Split
### Non-game app lane
- Default stack: React Native + Granite + TDS + App-in-Toss SDK `2.0.5`
- Best fit: utility, search, commerce assist, lifestyle, AI helper, content, and workflow services
- Official lead time signal: about `2 to 3 months`
- This repository's starter and checklists are built for this lane

### Game lane
- Default stack: HTML5 first, Unity only when runtime or graphics requirements justify it
- Best fit: short-session games, instant-play loops, leaderboard-first or reward-driven loops
- Official lead time signal: about `2 to 4 weeks`
- Use game-specific release guidance, fullscreen rules, sound lifecycle handling, and game login/profile APIs

## Recommended Volume
### Non-game app v1
- One core job-to-be-done only
- `2 to 4` screens for the first release, excluding support and policy pages
- `1 to 2` banner placements maximum in v1
- One input flow and one result or utility loop
- No broad settings surface, multi-product IA, or admin console in v1

### Game v1
- One core loop, one mode, one progression layer
- First meaningful interaction within `10 seconds`
- Fullscreen play area with explicit sound on or off control
- Session target of roughly `1 to 3 minutes`
- Leaderboard or reward loop added only when the core loop is already fun without it

## Market Signals To Use In Planning
- The Apps in Toss public site currently says the service can reach `29,000,000` cumulative users, sourced to Toss internal data through the end of July 2025.
- The developer overview currently says partners can expose services to `3,000만` cumulative Toss users.
- The official overview says games usually launch in `2 to 4 weeks`, while non-game services usually take `2 to 3 months`.
- The October 15, 2025 Tossfeed milestone said App-in-Toss crossed `200` partner miniapps in the first `100` days, with about `260만` cumulative users, `1,500만` cumulative pageviews, and average dwell time of about `6.7` minutes.
- The January 30, 2026 webinar recap said Toss analyzed `300+` game datasets and highlighted instant-launch HTML5 services as a major growth pattern.

## Follow-up Docs
- `docs/toss-app-vs-game-strategy.md`
- `docs/toss-market-analysis-2026-03.md`
- `checklists/toss-miniapp-launch.md`
- `checklists/toss-game-launch.md`

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
