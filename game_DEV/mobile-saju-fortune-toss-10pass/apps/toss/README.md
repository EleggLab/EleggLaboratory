# Toss Miniapp

토스 앱인토스 React Native SDK 2.x 제출용 분기입니다.

## 목표

- 기존 `apps/mobile` 의 UX와 운세 기능을 최대한 유지합니다.
- 토스 제출에 필요한 Granite, App-in-Toss, TDS 구조를 맞춥니다.
- 광고 없는 무료 앱 기준으로도 strict 릴리즈 검증과 `.ait` 빌드가 가능하게 유지합니다.

## 현재 상태

- 토스 제출 대상: `apps/toss`
- 원본 기준 UX/UI: `apps/mobile`
- `pnpm --filter @saju/toss typecheck` 통과
- `pnpm --filter @saju/toss build` 통과
- `.ait` 산출물 생성 확인: `apps/toss/fortune-suite-toss.ait`

## 자주 쓰는 명령

- `pnpm dev:toss`
- `pnpm build:toss`
- `pnpm --filter @saju/toss validate:release-env`
- `pnpm --filter @saju/toss prepare:console-assets`
- `pnpm --filter @saju/toss audit:parity`
- `pnpm --filter @saju/toss qa:sandbox`
- `pnpm --filter @saju/toss qa:toss`

## 주요 환경 변수

- `TOSS_APP_NAME`
- `TOSS_CONSOLE_APP_NAME`
- `TOSS_BRAND_DISPLAY_NAME`
- `TOSS_BRAND_PRIMARY_COLOR`
- `TOSS_BRAND_ICON_URL`
- `TOSS_CUSTOMER_SERVICE_EMAIL`
- `TOSS_CUSTOMER_SERVICE_PHONE`
- `TOSS_CUSTOMER_SERVICE_CHAT_URL`
- `TOSS_ENABLE_BANNER_ADS=false`
- `TOSS_AD_HOME_BANNER_ID`
- `TOSS_AD_TODAY_BANNER_ID`
- `TOSS_AD_TAROT_RESULT_BANNER_ID`
- `TOSS_ENABLE_FULLSCREEN_ADS=false`

`TOSS_ENABLE_BANNER_ADS=false` 이면 광고 ID 없이도 strict 릴리즈 검증과 `.ait` 빌드가 가능합니다.

## 준비 문서

- `docs/APP_REGISTRATION_SHEET.md`
- `docs/FEATURE_REGISTRATION_SHEET.md`
- `docs/AD_SLOT_SHEET.md`
- `docs/SETTLEMENT_OPERATIONS_CHECKLIST.md`
- `docs/UX_PARITY_AUDIT_KO.md`
- `TOSS_RELEASE_CHECKLIST_KO.md`
- `TOSS_COMPLIANCE_AUDIT_KO.md`
- `TOSS_APP_HANDOFF_KO.md`

## 콘솔 자산

- 자산 매니페스트: `assets/console/asset-manifest.json`
- 준비용 자산 생성: `pnpm --filter @saju/toss prepare:console-assets`
- 현재 생성되는 자산은 앱 리소스를 바탕으로 만든 제출 준비 초안입니다.

## 주요 파일

- `pages/`: Granite 라우트 엔트리
- `src/legacy/`: 기존 Expo 모바일 화면, 리소스, 계산 로직 이식본
- `src/ads/`: 토스 광고 슬롯과 fallback 로직
- `granite.config.ts`: 토스 브랜드, 권한, env 주입
- `scripts/patch-granite-windows.mjs`: Windows Granite 경로 패치
- `scripts/run-ait-build.mjs`: Windows용 `ait build` 실행 래퍼
- `scripts/audit-parity.mjs`: 원본 모바일 대비 자동 패리티 감사

## 주의

- `@apps-in-toss/framework` 는 SDK `2.0.5` 기준입니다.
- 2026년 3월 23일 이후 SDK 1.x 번들은 콘솔 업로드가 불가합니다.
- `TOSS_APP_NAME` 과 실제 콘솔 `appName` 은 완전히 같아야 합니다.
- `TOSS_BRAND_ICON_URL` 은 실제 토스 콘솔 앱 아이콘 URL이어야 합니다.
- Windows에서는 빌드 전에 Granite 경로 패치가 자동 실행됩니다.
