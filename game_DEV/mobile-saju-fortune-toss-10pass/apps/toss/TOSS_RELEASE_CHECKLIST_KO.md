# 토스 출시 체크리스트

## 1. SDK / 빌드

- `@apps-in-toss/framework` 2.0.5 적용
- `@toss/tds-react-native` 2.0.2 적용
- `pnpm --filter @saju/toss typecheck` 통과
- `pnpm --filter @saju/toss audit:parity` 통과
- `pnpm --filter @saju/toss validate:release-env` 통과
- `pnpm build:toss` 기준 `.ait` 생성 확인
- Windows 에서 `scripts/patch-granite-windows.mjs` 가 자동 적용된 상태로 빌드되는지 확인
- 2026년 3월 23일 이후 SDK 1.x 번들을 업로드하지 않는지 확인

## 2. 브랜드 / 콘솔

- `TOSS_APP_NAME` 과 콘솔 앱명 일치
- `TOSS_CONSOLE_APP_NAME` 과 같은 값 입력
- `TOSS_BRAND_DISPLAY_NAME` 최종 확정
- `TOSS_BRAND_PRIMARY_COLOR` 최종 확정
- `TOSS_BRAND_ICON_URL` 이 실제 토스 콘솔 아이콘 URL인지 확인
- 고객지원 이메일, 전화번호, 채팅 URL 입력 완료
- `docs/APP_REGISTRATION_SHEET.md` 최신화
- `docs/FEATURE_REGISTRATION_SHEET.md` 최신화

## 3. 콘솔 자산

- `pnpm --filter @saju/toss prepare:console-assets` 실행 또는 최종 자산 수동 교체
- `assets/console/asset-manifest.json` 최신화
- 앱 로고 600x600 PNG 확인
- 정사각 썸네일 1000x1000 PNG 확인
- 가로형 썸네일 1932x828 PNG 확인
- 세로 검색 스크린샷 3장 636x1048 PNG 확인

## 4. 광고

- 광고 없이 출시하는 경우:
- `TOSS_ENABLE_BANNER_ADS=false`
- 광고 ID 비워도 됨
- 광고 포함 출시하는 경우:
- 광고 그룹 생성
- `home_banner_list`
- `today_banner_inline`
- `tarot_result_banner_list`
- 운영 광고 ID 입력 완료
- `no-fill`, 렌더 실패 시 슬롯만 자연스럽게 사라지는지 확인
- 전면, 리워드 광고는 v1 기준 비활성 유지

## 5. 기능 QA

- 홈 진입
- 사주 입력 / 계산 / 저장 / 다시 입력
- 사주 결과 / 연운 / 월운 / Q&A
- 오늘 운세 선택과 상세 보기
- 주역 생성과 결과 보기
- 타로 카드 선택 / 결과 / 오늘 결과 재조회
- 탭 전환과 뒤로가기 백스택이 자연스러운지 확인

## 6. 실기기 검증

- 최신 토스 샌드박스 앱으로 확인
- `pnpm --filter @saju/toss qa:sandbox` 기준 확인
- `.ait` 업로드 후 콘솔 QR 진입 테스트
- `pnpm --filter @saju/toss qa:toss` 기준 확인
- 백그라운드 전환 / 복귀 확인
- 네트워크 끊김 / 재시도 확인
