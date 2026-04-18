# Toss Clean QA Checklist `019d4ea2`

## Build

- Candidate:
  - `astra-toss-clean-visual-parity-final-20260402-233938.ait`
- Runtime baseline:
  - `토스 본앱`
- Chooser rule:
  - Select `토스`, not `MiniApp`

## Capture order

1. Home
2. Daily `별자리`
3. Daily `생년월일`
4. Western zodiac detail
5. Chinese zodiac detail
6. Tarot hub
7. Tarot reading
8. Tarot result
9. Saju input
10. Saju result
11. IChing start
12. IChing result

## Visual checks

- Home Astra image renders
- Home scrim looks like a soft fade, not hard black bands
- Dialogue card does not overlap the tab bar
- Daily fourth row does not collide with the tab bar
- Tiger tile uses the provided tiger image
- Western zodiac detail does not render blank
- Tarot hub cards are not oversized or overly empty
- Tarot reading last row is reachable and not clipped
- Bottom tab icons look like final line icons, not text glyphs

## Behavior checks

- Daily detail -> Daily retap resets to the list
- Tarot reading/result -> Tarot retap resets to the hub
- Saju result -> Saju retap resets to input
- IChing result -> IChing retap resets to start
- Home retap resets dialogue/VFX to the base state
- Saju `종합 / 분야별 Q&A` toggle works in Toss runtime

## Technical checks

- No generic popup after choosing `토스`
- No `ReactNativeJS` fatal
- No `BrickModule` fatal
- No missing-image crash
