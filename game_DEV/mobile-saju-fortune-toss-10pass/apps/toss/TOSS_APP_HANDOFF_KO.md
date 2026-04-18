# 토스 앱 인수인계 문서

## 현재 상태

- 작업 루트: `game_DEV/mobile-saju-fortune-toss`
- 토스 제출 대상: `apps/toss`
- 원본 기준 모바일 앱: `apps/mobile`
- 2026-03-27 기준 `.ait` 빌드 성공

생성 확인 파일:
- `apps/toss/fortune-suite-toss.ait`

## 구조 요약

- `pages/`: Granite 라우트 래퍼
- `src/legacy/`: 원본 모바일 화면, 로직, 리소스 이식본
- `src/platform/`: 토스 라우팅 보조 컨텍스트와 탭 재선택 제어
- `src/ads/`: 배너 광고 슬롯과 fallback 상태
- `src/config/`: 토스 런타임 env
- `assets/console/`: 콘솔 등록용 준비 자산과 매니페스트
- `docs/`: 앱 등록, 기능 등록, 광고, 정산, UX 패리티 문서
- `scripts/patch-granite-windows.mjs`: Windows Granite 빌드 경로 패치
- `scripts/run-ait-build.mjs`: Windows용 `ait build` 실행 래퍼
- `scripts/audit-parity.mjs`: 원본 모바일 대비 자동 감사

## 반영된 핵심

- Granite 라우트:
  - `/`
  - `/saju`
  - `/today`
  - `/iching`
  - `/tarot`
  - `/tarot/reading`
  - `/tarot/result`
- `scheme: 'intoss'`
- 토스 브랜드 env 계약
- TDS 기반 버튼과 입력
- 원본 자산 84개 동일 복사
- 탭 재선택과 방문 토큰 기반 리셋 복원
- 콘솔 자산 준비 스크립트와 자산 매니페스트 추가
- 릴리즈 검증에 고객지원 정보와 자산 규격 체크 추가

## 릴리즈 전에 확인할 것

- `TOSS_APP_NAME` 을 실제 토스 콘솔 앱명으로 교체
- `TOSS_CONSOLE_APP_NAME` 을 같은 값으로 입력
- `TOSS_BRAND_ICON_URL` 을 실제 콘솔 아이콘 URL로 교체
- 고객지원 이메일, 전화번호, 채팅 URL 실값 입력
- 광고 없이 갈 경우 `TOSS_ENABLE_BANNER_ADS=false` 유지
- 광고를 켤 경우 운영 광고 ID 3개 입력
- 토스 콘솔 QR 실기기 QA

## 다음 작업 추천 순서

1. `pnpm install`
2. `pnpm --filter @saju/toss prepare:console-assets`
3. `pnpm --filter @saju/toss audit:parity`
4. `pnpm --filter @saju/toss typecheck`
5. `pnpm --filter @saju/toss validate:release-env`
6. `pnpm build:toss`
7. 토스 콘솔 앱 정보 반영
8. 샌드박스와 QR 실기기 QA
