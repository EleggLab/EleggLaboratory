# Toss Miniapp

토스 앱인토스 React Native SDK 2.x 제출용 분기입니다.

## 목표

- 기존 `apps/mobile` 운세 UX를 최대한 유지합니다.
- 토스 제출에 필요한 Granite, App-in-Toss, TDS, 광고 슬롯 구성을 맞춥니다.
- v1 광고는 배너만 사용합니다.

## 실행

1. 루트에서 `pnpm install`
2. 루트에서 `pnpm dev:toss`
3. 최신 샌드박스 앱에서 확인

## 빌드

- 루트에서 `pnpm build:toss`
- 빌드 전 `pnpm --filter @saju/toss validate:release-env`
- 결과 `.ait` 파일을 토스 콘솔에 업로드합니다.

## 환경 변수

- `apps/toss/.env.example` 를 기준으로 채웁니다.
- 제출 전 필수 값
- `TOSS_APP_NAME`
- `TOSS_BRAND_DISPLAY_NAME`
- `TOSS_BRAND_PRIMARY_COLOR`
- `TOSS_BRAND_ICON_URL`
- `TOSS_AD_HOME_BANNER_ID`
- `TOSS_AD_TODAY_BANNER_ID`
- `TOSS_AD_TAROT_RESULT_BANNER_ID`
- `TOSS_ENABLE_FULLSCREEN_ADS=false`

## 주요 파일

- `pages/`: Granite 라우트 엔트리
- `src/legacy/`: 기존 Expo 모바일 화면, 리소스, 도메인 로직 재사용 레이어
- `src/ads/`: 토스 광고 설정과 슬롯 로직
- `granite.config.ts`: 토스 브랜드/권한/env 주입 설정
- `TOSS_RELEASE_CHECKLIST_KO.md`: 제출 전 검수 체크리스트

## 주의

- `@apps-in-toss/framework` 는 SDK 2.0.5 기준으로 맞췄습니다.
- 2026년 3월 23일 이후 SDK 1.x 번들은 콘솔 업로드가 불가합니다.
- RN 0.84 대응 테스트는 2026년 3월 6일 이후 배포된 최신 샌드박스 앱 기준으로 진행합니다.
- `TOSS_APP_NAME` 은 토스 콘솔 앱 이름과 동일한 kebab-case 여야 합니다.
- `TOSS_BRAND_ICON_URL` 은 토스 콘솔 앱 정보에 업로드된 실제 아이콘 URL이어야 합니다.
- 운영 광고 ID가 비어 있으면 프로덕션에서는 광고가 꺼지도록 설정했습니다.
