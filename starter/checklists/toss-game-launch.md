# Toss Game Launch Checklist

This checklist is for the game lane. Do not use the React Native non-game starter as-is for this lane.

## Registration And Compliance
- [ ] The service is explicitly classified as a game in the Toss console planning docs.
- [ ] Game rating information is ready before release.
- [ ] Customer support contact is visible and reachable.
- [ ] Game-specific keywords, description, and brand assets are prepared.

## Runtime And UX
- [ ] The game reaches its first playable screen within `10 seconds`.
- [ ] The play area is fullscreen and does not collide with Safe Area or the Toss navbar.
- [ ] Orientation is fixed and verified for the intended play mode.
- [ ] Every screen still leaves the user a clear way to exit the miniapp.
- [ ] No bottom sheet or modal forcefully blocks the player right after entry.

## Sound And State
- [ ] Sound, vibration, and haptics behave correctly in silent mode and restricted system settings.
- [ ] The player can directly turn sound on or off.
- [ ] Audio stops immediately when the game goes to the background.
- [ ] Audio resumes correctly when returning to the game.
- [ ] Save data, ranking state, or progression data survives app close and reopen when required.

## Monetization
- [ ] Ads do not appear on intro, loading, popup, or cutscene-style transient screens.
- [ ] Rewarded and interstitial ads are preloaded before the trigger point.
- [ ] Banner ads, if used, are only placed at the top or bottom.
- [ ] Reward payout is correct after full rewarded-ad completion.
- [ ] Payment or ad flows pause gameplay audio and return cleanly to the game.

## Performance
- [ ] Input, transition, and feedback latency do not exceed `2 seconds`.
- [ ] Network usage is stable and not abnormally bursty.
- [ ] Memory use is stable under repeated play sessions.
- [ ] Build size and preload strategy were reviewed for instant-launch expectations.
