# Previous Toss Conversion Reference

Reference source kept inside this fork:

- `game_DEV/mobile-saju-fortune-toss/mobile-saju-fortune/mobile-saju-fortune`

What it is:

- An older App-in-Toss conversion attempt that stopped mid-way.
- Useful as a structural reference, not as a dependency/version source.

What was reused in the current `apps/toss` app:

- Granite object-style route navigation patterns.
- Banner ad fallback behavior that hides slots on `no-fill` or render failure.
- A fullscreen ad integration skeleton for future rollout.

What should not be copied blindly:

- Old SDK versions such as `@apps-in-toss/framework@1.x`.
- Old React Native / React version pins from that nested project.

Why:

- The current target is the newer SDK 2.x-based Toss React Native miniapp path.
- This fork keeps current work aligned with the newer Granite/TDS direction while still borrowing proven local patterns.
