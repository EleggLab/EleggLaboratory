# Astra Toss Clean Master Dev Gap List

Date: 2026-04-03  
Baseline runtime: Toss main app on Android

## Purpose

This document captures what is still missing, unproven, or worth polishing before we stop doing tiny iterative rounds and move into one broader implementation pass followed by a single strong QA pass.

## Current Stable Areas

- App boot in `Toss` main app is stable.
- Core root routes are present:
  - home
  - daily
  - tarot
  - saju
  - iching
- Core image rendering is mostly stable:
  - Astra home image
  - daily list icons
  - western zodiac detail images
  - tarot reading/result card images
- I-Ching start/result flow is stable.
- Saju input and result rendering is generally stable.
- Build pipeline is stable:
  - `typecheck`
  - `build`
  - `build:upload`

## Release-Critical Gaps

### 1. Daily detail hero role is not fully locked

What is missing:
- The daily detail screen still needs one final real-device confirmation that it is showing the correct `detailHero` for every item.
- The tiger case is especially important because it was previously mixing tile/detail behavior.

Why it matters:
- This is a visible “looks broken” issue, not a small polish issue.

Current expectation:
- `tileIcon` is for the daily list tile.
- `detailHero` is for the detail page top image.
- Tiger should use the user-provided source as both tile and detail hero.

### 2. Checklist system is implemented but not fully QA-locked

What is missing:
- Full real-device confirmation that all four checklist items update correctly.
- Full confirmation that root + detail visit logic works for:
  - today
  - tarot
  - saju
  - iching
- Full confirmation that the once-per-day completion reward grants exactly one extra affection point.

Why it matters:
- This is user-facing progression logic.
- If it misfires, affection progression will feel buggy.

### 3. Tab reselect reset is not fully proven on real device

What is missing:
- Explicit proof in one clean QA pass that all of these work:
  - daily detail -> daily retap -> daily root
  - tarot reading/result -> tarot retap -> tarot hub
  - saju result/Q&A -> saju retap -> saju input
  - iching result -> iching retap -> iching start
  - home retap -> home UI soft reset only

Why it matters:
- The app depends heavily on bottom-tab navigation feel.

### 4. Daily 3x4 grid needs final lock, not just “seems okay”

What is missing:
- One final proof that the 4th row never collides with the bottom bar on the target phone size.
- Confirmation for both tabs:
  - western zodiac
  - birth year / Chinese zodiac

Why it matters:
- This is exactly the kind of layout bug that slips into release if not frozen deliberately.

### 5. Saju result / category Q&A still needs a clean final pass

What is missing:
- A clean same-build QA pass proving:
  - compute result
  - switch to category Q&A
  - change domains
  - reselect saju tab to reset

Why it matters:
- The screen exists, but recent QA logs did not lock it cleanly in one pass.

## High-Value Polish Gaps

### 6. Home scrim is improved but still not fully premium

What remains:
- The scrim reads better than a hard cut, but can still feel slightly banded.

Recommendation:
- Do one more visual pass only after the tiger/detail issue is fully locked.

### 7. Bottom tab icons still need final design lock

What remains:
- The icons are functional, but they still need a “final product” feel.
- The main issue is consistency and simplicity, not functionality.

Recommendation:
- Freeze one icon family and stop reinterpreting the style after that.

### 8. Tarot hub top section still has room for polish

What remains:
- Better than before, but still a bit airy.
- The hero art and card-back art can now carry more of the visual identity.

Recommendation:
- One bigger, final art-direction pass rather than repeated micro-adjustments.

## Code / Structure Gaps

### 9. Asset registry should now be treated as the single source of truth

What is missing:
- One final audit ensuring all home/daily/tarot image lookups come from the same registry path strategy.

Why it matters:
- This avoids slipping back into mixed local/remote/detail fallback confusion.

### 10. Stray route cleanup

Current extra route:
- [about.tsx](C:/Users/rndhr/Documents/GitHub/EleggLaboratory/game_DEV/mobile-saju-fortune-toss/apps/toss-clean/pages/about.tsx)

Issue:
- It is a Granite sample-style route and is not part of the intended released product.

Recommendation:
- Remove it or replace it with a product-appropriate route before final lock.

## Not Missing, But Should Be Deliberately Deferred

These are good ideas, but they should not block release if the release-critical items above are locked.

- Astra dialogue/cut expansion
- Tarot result save / re-open
- Daily share card
- Saju presets
- I-Ching result history
- Seasonal Astra events

## Recommended “One Big Pass” Scope

If we stop doing tiny rounds and do one broader development pass, this should be included:

1. Lock daily detail hero behavior, especially tiger.
2. Freeze checklist state refresh and once-per-day reward behavior.
3. Freeze tab reselect reset across all five sections.
4. Freeze daily 3x4 layout on the target device.
5. Freeze saju result + Q&A behavior.
6. Finalize bottom tab icon family.
7. Finalize home scrim.
8. Finalize tarot hub top section using the provided hero art and back art.
9. Remove or neutralize the stray `about` route.

## Final Pre-Release QA Pass Requirements

The next strong QA pass should capture:

- home
- daily western root
- daily Chinese root
- western detail sweep
- tiger detail
- tarot hub
- tarot reading
- tarot result
- saju input
- saju result
- saju Q&A
- iching start
- iching result
- tab reselect reset for all sections
- checklist progression from not-complete to complete
- affection change when all four checklist items are completed

## Conclusion

The project is no longer in “unstable boot” territory.

The main remaining work is:
- behavior lock
- visual lock
- cleanup of one or two structural leftovers

That means the next efficient move is not another tiny patch/test cycle, but one broader implementation pass covering the critical gaps above, followed by one deliberate full-device QA pass.
