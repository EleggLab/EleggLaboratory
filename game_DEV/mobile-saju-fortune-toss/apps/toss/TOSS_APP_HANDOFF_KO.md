# 토스 앱 인수인계 문서

## 현재 상태

- 작업 루트: `game_DEV/mobile-saju-fortune-toss`
- 토스 제출 대상: `apps/toss`
- 원본 모바일 앱: `apps/mobile`
- 기존 모바일 리소스와 계산 로직은 유지하면서 토스 제출용 셸과 광고 설정을 덧씌운 구조입니다.

## 반영된 항목

- Granite 기반 라우트
- `/`
- `/saju`
- `/today`
- `/iching`
- `/tarot`
- `/tarot/reading`
- `/tarot/result`
- `scheme: 'intoss'` 반영
- 토스 브랜드/env 계약 추가
- TDS 기반 네비게이션, 버튼, 텍스트 필드, 저장 토스트 적용
- 배너 광고 슬롯 3개 구성
- `home_banner_list`
- `today_banner_inline`
- `tarot_result_banner_list`

## 아직 반드시 확인할 항목

- 토스 콘솔의 실제 앱 이름과 `TOSS_APP_NAME` 일치 여부
- `TOSS_BRAND_ICON_URL` 을 토스 콘솔 앱 정보의 실제 아이콘 URL로 교체했는지
- 광고 그룹 3개 생성 후 운영 ID 입력 여부
- 최신 샌드박스 앱에서 RN 0.84 기준 테스트 완료 여부
- `.ait` 빌드와 QR 진입 테스트 완료 여부
- `pnpm --filter @saju/toss validate:release-env` 검증 통과 여부

## 토스 문서 기준 핵심 메모

- 2026년 3월 23일 이후 SDK 1.x 업로드 불가
- RN 0.84 대응은 최신 샌드박스 앱으로 확인
- 운영 광고 ID가 비어 있으면 프로덕션에서 광고는 비활성
- 전면/리워드 광고는 구조만 남기고 기본 비활성

## 다음 작업 권장 순서

1. `pnpm install`
2. `pnpm --filter @saju/toss typecheck`
3. `pnpm dev:toss`
4. `pnpm build:toss`
5. 토스 콘솔 운영값 반영
6. 샌드박스 및 QR 실기기 QA
