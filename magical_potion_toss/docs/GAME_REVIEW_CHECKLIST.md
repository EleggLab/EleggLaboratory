# Game Review Checklist

## Policy Fit
- [ ] Registered as a game-category miniapp
- [ ] Uses `webViewProps.type='game'`
- [ ] No ad, IAP, ranking, or gambling-like mechanics in v1
- [ ] Clear gameplay goal: 주문 컷라인과 임대료를 넘기며 7일 런을 완주한다

## UX
- [ ] Entry is immediate and predictable
- [ ] CTA copy is explicit: `새 런 시작`, `가방 확정`, `항아리 조제 확정`, `다음 날 준비`
- [ ] No forced popups or surprise interruptions on entry
- [ ] Built-in game close confirmation is available in Toss runtime

## Data / Login
- [ ] `getUserKeyForGame()` success path tested in Toss
- [ ] Unsupported-version and non-game fallback path handled gracefully
- [ ] Save data stays local and does not require a backend

## Playability
- [ ] 주문 2개 중 1개 선택 흐름이 명확하다
- [ ] 재료 5개 중 4개를 넣는 순서에 따라 결과 차이가 분명하다
- [ ] 손질형 재료가 본게임을 흐리지 않으면서도 선택 의미를 만든다
- [ ] 7일차 감사 주문까지 완주 가능하다
