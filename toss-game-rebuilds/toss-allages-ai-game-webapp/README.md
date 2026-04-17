# 컬러 파크 러시 - Toss WebView Game

완전 무료 토스 게임 미니앱용 WebView 프로젝트입니다.

## Baseline
- SDK: `@apps-in-toss/web-framework@2.0.5`
- Build: `ait build`
- Runtime: Toss game WebView (`webViewProps.type='game'`)
- Monetization: **없음** (광고/인앱결제/정산 미사용)

## 정책 고정
- **무료**
- **광고 없음**
- **인앱 결제 없음**
- **서버 없음(로컬 저장)**

## Scripts
- `pnpm dev`: Toss Granite dev server
- `pnpm typecheck`: TypeScript check
- `pnpm build`: strict env validation + `.ait` build

## Flow
- 로비
- 모드 선택
- 플레이
- 결과
- 컬렉션
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
