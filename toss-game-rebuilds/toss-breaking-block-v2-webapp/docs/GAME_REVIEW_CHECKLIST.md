# Game Review Checklist

## Policy Fit
- [ ] Registered as a game-category miniapp
- [ ] Uses `webViewProps.type='game'`
- [ ] No ad, IAP, ranking, or gambling-like mechanics in v1
- [ ] Clear gameplay goal: defend the barrier and clear the exam

## UX
- [ ] Entry is immediate and predictable
- [ ] CTA copy is explicit: `기본 보상 받기`, `다시 하기`, `도서관 가기`, `다음 시험 시작`
- [ ] No forced popups or surprise interruptions on entry
- [ ] Built-in game close confirmation is available in Toss runtime

## Data / Login
- [ ] `getUserKeyForGame()` success path tested in Toss
- [ ] Unsupported-version and non-game fallback path handled gracefully
- [ ] Save data stays local and does not require a backend

## Playability
- [ ] Class select offers 3 clear lesson cards
- [ ] Battle provides 3-choice level-up cards
- [ ] Victory, defeat, rewards, and progression are all reachable
- [ ] Stage 5 boss clear unlocks the next progression step

