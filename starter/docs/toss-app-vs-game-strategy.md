# Toss App Vs Game Strategy

This note separates the two product lanes that now coexist in App-in-Toss. It is based on official Toss developer documentation and public Toss announcements reviewed on `2026-03-27`.

## Why The Lanes Must Be Separate
- The developer FAQ and overview distinguish `게임` and `비게임` on planning, launch timing, and registration inputs.
- The game release guide adds fullscreen, sound lifecycle, game login, leaderboard, orientation, and ad placement constraints that are not optional polish items.
- The current repository starter is tuned for React Native non-game services with TDS-heavy UI, support surfaces, banner ads, and settlement operations.

## Lane A: Non-game App
### Best fit
- Utility, discovery, commerce assist, content, AI helper, lifestyle, and task-oriented services
- Services that benefit from TDS components, structured forms, result pages, or support flows

### Recommended stack
- React Native
- Granite
- App-in-Toss SDK `2.0.5`
- TDS-based UI shell

### Recommended v1 volume
- One core job-to-be-done
- `2 to 4` main service screens
- `1` clearly dominant primary CTA
- `1 to 2` banner slots maximum
- Optional support, FAQ, and policy pages outside the core screen count

### Avoid in v1
- Multiple unrelated service domains in one miniapp
- Deep account settings or operator dashboards
- Heavy permission onboarding
- Broad monetization mixes such as ads + IAP + login + marketing automation all at once

### Delivery expectation
- Official overview and FAQ signal about `2 to 3 months` for non-game services
- Inference: smaller utility-style services can ship faster, but the default planning assumption should still be `1 to 3 months`

## Lane B: Game
### Best fit
- Short-session, instant-play experiences
- Score, stage, streak, collection, or ranking loops
- Services where fast entry and replay matter more than rich form UX

### Recommended stack
- HTML5 first
- Unity only when the core loop genuinely needs engine-level rendering, asset streaming, or advanced runtime control
- Separate repo, release checklist, and QA rail from the non-game RN starter

### Recommended v1 volume
- One core loop
- One primary mode
- One progression system
- First fun within `10 seconds`
- Session target around `1 to 3 minutes`
- Optional leaderboard or reward loop only after the core loop stands on its own

### Avoid in v1
- Multiple game modes
- Heavy meta systems
- Long tutorials
- Late-loading ads that block the player at the reward moment
- Complex social features before retention is proven

### Delivery expectation
- Official overview and FAQ signal about `2 to 4 weeks` for games
- Inference: this faster timeline is realistic only when scope stays narrow and instant-play remains the priority

## Decision Rules
- Choose the non-game lane if the product is primarily solved through lists, forms, content, search, comparison, or utility actions.
- Choose the game lane if the product value is primarily created by repeat play, scoring, progression, or entertainment loops.
- If the service has both, ship the utility part first as a non-game app unless the game loop is already the clear acquisition engine.

## Recommended Repository Policy
- Keep `starter/templates/toss-rn-miniapp` as non-game only.
- Create a separate future starter for Toss games instead of overloading the RN starter.
- Maintain separate launch checklists for app and game lanes.
