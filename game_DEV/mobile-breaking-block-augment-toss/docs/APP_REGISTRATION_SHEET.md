# App Registration Sheet

## Identity
- App ID (`TOSS_APP_NAME`): `bounce-stack`
- Console app name (`TOSS_CONSOLE_APP_NAME`): `bounce-stack`
- Display name: `바운스 스택`
- Category: `게임`
- Type: `무료 미니앱`

## Product Summary
- One-line pitch: 아래에서 위로 드래그해 공을 연사하고, 5루프마다 보스를 돌파하는 세션형 브릭브레이커 런 게임
- Core loop: 홈 -> 승무원 선택 -> 드래그 발사 -> 보스 돌파 -> 증강 선택 -> 기록 저장
- Monetization: 없음

## Support
- Customer service email: `TOSS_CUSTOMER_SERVICE_EMAIL`
- Customer service phone: `TOSS_CUSTOMER_SERVICE_PHONE`
- Customer service chat URL: `TOSS_CUSTOMER_SERVICE_CHAT_URL`

## Assets
- Logo: `assets/console/app-logo.png`
- Square thumbnail: `assets/console/thumbnail-square.png`
- Landscape thumbnail: `assets/console/thumbnail-landscape.png`
- Portrait screenshots: `assets/console/screenshots/shot-01.png` to `shot-03.png`

## Notes
- 게임 카테고리로 등록해야 `getUserKeyForGame()`을 안정적으로 사용할 수 있습니다.
- WebView type은 `game`으로 설정했고, 스크롤/풀투리프레시/스와이프 뒤로가기를 끈 상태입니다.
