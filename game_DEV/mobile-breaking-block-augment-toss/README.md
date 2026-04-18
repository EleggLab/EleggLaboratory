# Bounce Stack for Toss

`Bounce Stack` is a Toss in-app WebView game that rebuilds the swipe brick-breaker loop from the old Flutter `Breaking a Block Augment` prototype.

## What Is Included

- Toss WebView game configuration via `@apps-in-toss/web-framework`
- Safe-area friendly home shell with `보급 / 플레이 / 도감` tabs
- Swipe aim, staggered volley launch, bounce preview, and ball pooling
- Home play tab boss roadmap powered by the same tuning table the engine uses
- Block types inspired by the old project:
  - `normal`
  - `triangle`
  - `steel`
  - `cactus`
  - `bomb`
  - `ball pickup`
- Boss wave, augment choice, crew unlocks, and daily supply reward flow
- Toss game identity fallback using `getUserKeyForGame`

## Commands

```bash
pnpm install
pnpm run dev
pnpm run typecheck
pnpm run test
pnpm run build
```

## Toss Notes

- `granite.config.ts` is set to `webViewProps.type = 'game'`.
- Scroll bounce, pull-to-refresh, Android overscroll, and iOS back-forward swipe are disabled to protect drag aiming.
- The home screen keeps the primary CTA visible immediately instead of opening an interruptive sheet on entry.

## QA Seeded Runs

- Add `?seed=<number>` or `?seed=0x<hex>` to the app URL to reproduce the same opening board on every `새 런 시작`.
- Example: `?seed=295743969` or `?seed=0x11A0B1E1`
- When a seed override is present, the home CTA prioritizes `고정 시드 새 런 시작`, while `이어하기` remains available for the saved run below.
- The current run panel and resume card both surface the active seed so QA can report a reproducible case.
- Use `QA 링크 복사` on the home panel to share the seeded URL, and `현재 상태 복사` / `상태 복사` to capture the live run snapshot for bug reports.

## Remaining Release Work

- Replace placeholder console assets in `assets/console/`.
- Fill production branding and customer service env values.
- Run sandbox and real Toss app QA before release upload.
