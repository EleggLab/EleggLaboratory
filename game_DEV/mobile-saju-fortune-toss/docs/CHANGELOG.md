# CHANGELOG

## 2026-02-17
- Fixed Saju Q&A cycle reflection so month/year context is explicitly injected into generated text (`kind/year/month + cycle point block`).
- Strengthened Q&A regression checks to require month/year variation across 10 iterations and enforce cycle-label presence.
- Increased mobile card spacing for Saju detail UI (`SectionCard`/Saju container and saved-card spacing).
- Extended asset optimizer to include GIF optimization (frame-step + palette reduction + GIF-specific resize cap).
- Reduced referenced mobile image budget from `31.86 MB` to `10.57 MB` after optimization (`docs/ASSET_AUDIT.md`, over-3MB assets: `0`).

## 2026-02-15
- Added `luckComputationModel=advanced_v1` with jie-distance conversion (`3 days = 1 year`).
- Updated luck cycle ranges to decimal boundaries (`+9.9` years).
- Switched solar/lunar conversion default engine to `korean-lunar-calendar`.
- Fixed ipchun boundary selection bug (prevented next-year `LI_CHUN` misreference).
- Added mobile editable input flow using shared `@saju/core` logic.
- Added tool-required policy in chat route and improved route-level validation.
- Added source-link validation in `@saju/tools` test script.
- Added vector expected pillar embedding (`vectors.v1.json`) and dual verification test (snapshot + expected).
- Added `pnpm vectors:refresh` automation to regenerate vector expected values from current engine.
- Hardened `manseryeok` import interop in core to avoid ESM export mismatch during tool scripts.
- Expanded `dayPillar_archetypes.v1.json` from 20 to 60 entries (40 auto-generated v1 drafts).
- Added local saved-chart management in web (save/search/load/delete).
- Added two-chart comparison API (`/api/compare`) and compare tab UI.
- Added shareable input link (`bi` query) encode/decode flow.
- Refined result screen to report-first UX (summary cards + top indicators + luck preview chips).
- Converted detail sections to collapsible cards for denser but mobile-safe reading.
- Simplified input UX: only calendar/date/time/gender shown by default, all other options moved to advanced settings toggle.
- After computation, input panel now collapses and result view is shown first (`입력 다시 열기` button provided).
- Added designated-year luck API (`/api/year-luck`) and natural-language result narrative (profile/overall/yearly).
- Added optional local solar time correction (longitude-based) in core/web advanced settings.
- Replaced placeholder package tests with executable checks (`data/ui/mobile` typecheck tests, `web` vitest).
- Enabled real Expo mobile web export build (`apps/mobile`), removing deferred build placeholder.
