# Toss Clean Pre-Test Checklist

Date: 2026-04-03

## Runtime baseline

- Final acceptance runtime: `Toss main app`
- Supporting runtime only: `MiniApp`

## Pages to capture

1. Home
2. Daily hub - zodiac
3. Daily hub - birth year
4. Western zodiac detail
5. Tiger detail
6. Tarot hub
7. Tarot reading
8. Tarot result
9. Saju input
10. Saju result
11. Saju category Q&A
12. I-Ching start
13. I-Ching result

## Visual checks

- Daily 4th row does not overlap the bottom tab bar
- Tiger tile uses the provided reference image
- Western zodiac detail never renders blank
- Tarot hub cards are not oversized
- Tarot reading last row is reachable
- Home scrim looks like a continuous fade, not hard dark bands
- Bottom tabs read as final line icons

## Behavior checks

- Home reselect resets dialogue and touch VFX only
- Daily reselect returns to the daily hub
- Tarot reselect returns to the tarot hub
- Saju reselect returns to the saju input
- I-Ching reselect returns to the i-ching start
- Checklist only marks a feature complete after both root and detail visits
- Completing all four checklist items once per KST day grants `+1` affection exactly once
- Existing home-touch daily `+1` still works
- Missing-home-touch daily decay still works

## Build checks already passed before this test

- `typecheck`
- `build`
- `build:upload`
