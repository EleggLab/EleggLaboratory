# magical_potion_toss

토스 WebView 기준으로 운영하는 마법 물약 게임 프로젝트다.

## Project Boundaries

- 구현 루트: `magical_potion_toss/`
- 공용 기획 문서 허브: `../shared-assets/project-docs/magical-potion/`
- 별도 실험 프로젝트: `../magic_toss/`

`magic_toss`와는 별개의 독립 앱으로 유지하고, 공용 문서나 밸런스 시트는 루트에 흩뿌리지 않고 `shared-assets/project-docs/magical-potion/` 아래에 모아둔다.

## Baseline

- SDK: `@apps-in-toss/web-framework@2.0.5`
- Build: `ait build`
- Runtime: Toss game WebView (`webViewProps.type='game'`)
- Monetization: none

## MVP Loop

- 7일 1런
- 하루 주문 2개 중 1개 선택
- 재료 8개 중 5개 선택
- 큰 항아리 4슬롯 순서 조제
- 집주인 주차 1회
- 3일차 / 6일차 임대료
- 7일차 길드 감사 주문

## Scripts

- `pnpm dev`: Toss Granite dev server
- `pnpm typecheck`: TypeScript check
- `pnpm build`: strict env validation + `.ait` build
- `pnpm qa:sandbox`: sandbox QA guide
- `pnpm qa:toss`: QR / Toss-app QA guide

## Runtime Notes

- 게임 로그인 키(`getUserKeyForGame`)를 우선 사용하고, 로컬 브라우저에서는 fallback key로 개발한다.
- 백엔드는 없이 로컬 저장 기반으로 회복/진행 상태를 유지한다.
- 광고, 정산, 인앱 결제는 현재 범위에 포함하지 않는다.
