# Game Review Checklist

## Policy Fit
- [ ] Registered as a game-category miniapp
- [ ] Uses `webViewProps.type='game'`
- [ ] No surprise popup or forced interruption on entry
- [ ] Primary CTA clearly says `새 런 시작` or `중단 런 이어하기`

## UX
- [ ] Entry screen immediately shows what to do next
- [ ] Drag aiming is not blocked by scroll bounce or pull-to-refresh
- [ ] Skill CTA is only enabled when actually usable
- [ ] Game over and augment states explain the next action directly

## Data / Login
- [ ] `getUserKeyForGame()` success path tested in Toss
- [ ] Unsupported-version and non-game fallback path handled gracefully
- [ ] Save data restores after app restart

## Playability
- [ ] Swipe aim, staggered volley launch, and return X logic all work
- [ ] After a deep drag, small wobble near the launcher does not cancel the shot or over-rotate the arc
- [ ] Block types `normal / triangle / steel / cactus / bomb / ball` all appear
- [ ] Boss wave opens every 5 loops and leads to an augment choice
- [ ] Loop 15 third boss opens without double steel walls and still leaves a reachable pickup near the top
- [ ] Loop 20 fourth boss stays readable with one non-steel flank and a reachable pickup near the top
- [ ] Resume card and run screen both show the current or next boss brief that matches the engine roadmap
- [ ] Daily supply reward can unlock at least one extra crew
- [ ] `?seed=` QA URL reproduces the same opening board on `새 런 시작`
- [ ] Home and run screens can copy a QA link or state snapshot without leaving the app
