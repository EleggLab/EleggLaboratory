# 오늘의 마법수업 - Toss WebView Game

무료 토스 게임 미니앱용 WebView 프로젝트입니다.

## Baseline
- SDK: `@apps-in-toss/web-framework@2.0.5`
- Build: `ait build`
- Runtime: Toss game WebView (`webViewProps.type='game'`)
- Monetization: none

## Scripts
- `pnpm dev`: Toss Granite dev server
- `pnpm typecheck`: TypeScript check
- `pnpm build`: strict env validation + `.ait` build
- `pnpm qa:sandbox`: sandbox QA guide
- `pnpm qa:toss`: QR / Toss-app QA guide

## Flow
- 로비
- 수업 선택
- 실기시험
- 결과
- 도서관
- 설정

## Required Release Inputs
- `TOSS_APP_NAME`
- `TOSS_CONSOLE_APP_NAME`
- `TOSS_BRAND_DISPLAY_NAME`
- `TOSS_BRAND_PRIMARY_COLOR`
- `TOSS_BRAND_ICON_URL`
- `TOSS_CUSTOMER_SERVICE_EMAIL`
- `TOSS_CUSTOMER_SERVICE_PHONE`
- `TOSS_CUSTOMER_SERVICE_CHAT_URL`

## Notes
- 게임 로그인(`getUserKeyForGame`)을 우선 사용하고, 로컬 브라우저에서는 fallback key로 개발할 수 있습니다.
- 광고, 정산, 인앱 결제는 이 프로젝트 범위에 포함되지 않습니다.

