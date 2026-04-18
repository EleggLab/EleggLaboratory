# DECISIONS

## Calculation Defaults
- `yearPillarRule`: `ipchun`
- `monthPillarRule`: `solarTerms`
- `jaSiBoundaryRule`: `23-01_nextDay`
- `timezone`: `Asia/Seoul`
- `applyLocalSolarTimeCorrection`: `false` (advanced option)

## Rule Option Exposure
- Users can switch year/month/jasi rules in settings.
- UI always shows active rule version labels (settings + metadata).
- Ten-gods mapping is fixed as `tenGods.v1` and versioned in metadata.
- Local solar time correction can be enabled only in advanced settings and requires `time + location.lon`.

## Engine Strategy
- Four Pillars base calculation: `manseryeok`
- Solar/lunar conversion default: `korean-lunar-calendar`
- Cross-check engines: `lunar-javascript`, `manseryeok`, optional data.go.kr API (dev-only verification).

## Luck Start Formula
- `simple`: fixed `luckStartAge` input (default 7)
- `advanced_v1`: documented as a candidate (distance-to-term based), not yet wired as default UX.

## Layer Separation
- Layer 1 (deterministic): calendar and ganzhi computation.
- Layer 2 (semi-deterministic): ten-gods/relations/strength/features.
- Layer 3 (interpretive): deterministic narrative + Q&A templates (AI removed in this build).

## Product Focus (2026-02 Pivot)
- **App-first (Expo)**: main UX is mobile with a game-like 5-tab bottom bar and Home as the initial screen.
- **Web is test-only**: kept mainly for engine verification and quick iteration.
- Primary features:
  - Saju: result table -> long natural-language report -> domain Q&A -> year/month lookup
  - Tarot: shuffle/pick/reveal with 1/day caching for "오늘의 운세"
  - I Ching: time-tap based trigram/lines generator (MVP)
  - Daily fortune: fixed scroll page (western zodiac + chinese zodiac)

## Web Runtime Notes
- Route handlers (`/api/saju`, `/api/year-luck`, `/api/month-luck`, `/api/compare`) are set to `dynamic='force-dynamic'` to prevent stale caching.
- Chart rendering enables ECharts accessibility mode (`aria.enabled=true`) for better assistive compatibility.

## Result Display Policy
- Report-first layout: `한눈 보고서` -> `오행 밸런스` -> `대운 미리보기` -> `자연어 종합 해석`.
- Keep deterministic data visible first (pillars, chart), then interpretive text.
- Detailed sections are collapsible (`details`) to reduce mobile overload while preserving depth.
- Default input fields are minimized to `양/음력, 날짜, 시간, 성별`; advanced controls are hidden behind `상세 설정`.
- After a successful compute, the input panel is collapsed by default so users focus on the result screen.
- Added `분야별 Q&A` tab with optional year/month slice (month uses a deterministic anchor: 15th noon).

## Research Catalog
- Full 100+ link research index is stored in `docs/RESEARCH_LINKS.md`.
- Regeneration command: `pnpm research:collect`
