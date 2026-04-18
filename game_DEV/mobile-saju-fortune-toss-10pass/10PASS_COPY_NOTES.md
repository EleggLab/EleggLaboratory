# 10PASS Copy Notes

## What This Copy Is

- Source project: `game_DEV/mobile-saju-fortune-toss`
- Working copy: `game_DEV/mobile-saju-fortune-toss-10pass`
- Purpose: apply the workspace branch-critique loop to the existing project without touching the original.
- This copy is for sequential direct-edit handoff refinement, not for collecting review notes first and implementing later.
- Legacy naming is retained for compatibility, but the current default is the `50-Pass Branch Critique Loop`.

## Important Default

- The base UI/UX frame is the human user's original work.
- This copy exists to refine that authored trunk, not replace it.
- Each pass should inherit the previous edited working branch, modify it directly, and hand it to the next pass.
- Pass 50 is the final revised copy state for that chain.

## Applied Slices

- Screen: `apps/mobile/app/(tabs)/home.tsx`
- Goal: preserve the full-character home composition and bottom dialogue identity while making the screen feel more intentional, readable, and store-ready.
- Screen: `apps/mobile/app/(tabs)/today.tsx`
  - Goal: keep the daily fortune hub structure while clarifying how to choose and making the detail state feel more guided.
- Screen: `apps/mobile/app/(tabs)/tarot/index.tsx`
  - Goal: keep the simple tarot gate while making each reading choice feel more intentional and less like a generic menu.
- Screen: `apps/mobile/app/(tabs)/tarot/result.tsx`
  - Goal: keep the card-plus-interpretation structure while improving reading hierarchy and result framing.
- Screen: `apps/mobile/app/(tabs)/iching.tsx`
  - Goal: keep the time-cast divination flow while making the ritual, 괘상 readability, and 6효 identity more legible.

## What Changed

- rewrote Astra's dialogue lines in cleaner Korean
- kept the full-screen character composition
- kept the bottom dialogue dock as the emotional anchor
- added a subtle lower-atmosphere curtain to improve text readability
- added a small interaction hint chip so the touch-anywhere behavior is discoverable
- refined the dialogue bubble chrome so it feels more deliberate and less placeholder-like
- gave the I Ching result flow a clearer progression:
  - cast time
  - trigram summary
  - 6-line visual
  - long-form reading

## Project Docs For This Loop

- local applied review:
  - `docs/HOME_10PASS_BRANCH_APPLIED.md`
  - `docs/DAILY_AND_TAROT_10PASS_APPLIED.md`
  - `docs/ICHING_50PASS_APPLIED.md`
- workspace-level policy:
  - `C:/Users/rndhr/OneDrive/Documents/GitHub/EleggLaboratory/PROJECT_UIUX_POLICY.md`
- workspace-level prompt:
  - `C:/Users/rndhr/OneDrive/Documents/GitHub/EleggLaboratory/UIUX_10PASS_BRANCH_CRITIQUE_PROMPT.md`

## Suggested Next Screens

1. `apps/mobile/app/(tabs)/saju/index.tsx`
2. `apps/mobile/app/(tabs)/tarot/reading.tsx`
3. `apps/mobile/app/(tabs)/_layout.tsx`
4. `apps/mobile/app/(tabs)/_components/GameTabBar.tsx`

## Validation Note

- This copy currently has dependencies installed and can run workspace checks.
- Latest validation passed:
  - `corepack pnpm --dir game_DEV/mobile-saju-fortune-toss-10pass --filter @saju/mobile typecheck`
- If more UI slices are changed, keep validating in the copy before deciding whether anything should move back toward the original trunk.
