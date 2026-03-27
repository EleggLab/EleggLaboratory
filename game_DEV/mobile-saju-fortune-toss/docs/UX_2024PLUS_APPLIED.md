# UX / Motion Applied from 2024+ Competitor Scan

## Dataset
- Source: Google Play app detail pages
- Filter: release date >= 2024-01-01
- Final relevant apps: 320
- Data file: `docs/research/competitive-apps-2024plus.json`
- URL catalog: `docs/COMPETITORS_2024PLUS.md`

## Observed Patterns (Most Frequent)
- Short hero copy (1-line context + immediate action)
- Card-first layouts for fortune results
- Daily flow emphasis (today-based entry points)
- Low-friction transitions (fade/slide over heavy effects)
- Tarot interactions with visible shuffle/deal feedback

## What Was Applied
- `apps/mobile/app/(tabs)/_components/SectionCard.tsx`
  - Added subtle fade-up reveal on mount.
  - Added low-opacity shadow to separate cards from illustrated backgrounds.
- `apps/mobile/app/(tabs)/tarot/TarotCardTile.tsx`
  - Upgraded shuffle animation to stagger per slot index.
  - Added slight X-slide during shuffle for a deal-like motion.
- `apps/mobile/app/(tabs)/tarot/reading.tsx`
  - Extended shuffle phase timing so motion is actually perceived.
  - Passed slot index to each tile for staggered animation.
- `apps/mobile/app/(tabs)/home.tsx`
  - Added smooth bubble line transition (fade + lift) on tap.

## Guardrails (to avoid overdesign)
- No heavy particle FX.
- No continuous background motion loops added.
- Motion durations kept short (100~300ms range, except shuffle phase).
- Readability-first: content cards remain static after entrance.
