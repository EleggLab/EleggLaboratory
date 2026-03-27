# 토스 출시 체크리스트

## 1. SDK / 빌드

- `@apps-in-toss/framework` 2.0.5 적용
- `@toss/tds-react-native` 2.0.2 적용
- `pnpm --filter @saju/toss validate:release-env` 통과
- `ait build` 기준으로 `.ait` 생성 확인
- `require.context.ts` 가 자동 포맷으로 깨지지 않았는지 확인
- 2026년 3월 23일 이후 SDK 1.x 번들을 업로드하지 않는지 확인

## 2. 브랜드 / 콘솔

- `TOSS_APP_NAME` 과 콘솔 앱 이름 일치
- `TOSS_BRAND_DISPLAY_NAME` 최종 확정
- `TOSS_BRAND_PRIMARY_COLOR` 최종 확정
- `TOSS_BRAND_ICON_URL` 이 토스 콘솔 앱 정보의 실제 아이콘 URL인지 확인
- 정산 정보 입력 완료

## 3. 광고

- 광고 그룹 생성
- `home_banner_list`
- `today_banner_inline`
- `tarot_result_banner_list`
- 운영 광고 ID 입력 완료
- 입력 폼/로딩/에러/모달에 광고가 없는지 확인
- `no-fill`, 렌더 실패 시 슬롯만 자연스럽게 사라지는지 확인
- 전면/리워드 광고는 기본 비활성 유지

## 4. 기능 QA

- 홈 진입
- 사주 입력 / 저장 / 재불러오기
- 사주 결과 / 연운 / 월운
- 오늘 운세 선택과 상세 보기
- 주역 생성과 결과 보기
- 타로 카드 선택 / 결과 / 오늘 결과 재조회
- 탭 전환과 뒤로가기 백스택 자연스러움

## 5. 실기기 검수

- 2026년 3월 6일 이후 배포된 최신 샌드박스 앱으로 확인
- `pnpm dev:toss` 로 샌드박스 점검
- `.ait` 업로드 후 콘솔 QR 진입 테스트
- 백그라운드 전환 / 복귀 확인
- 네트워크 끊김 / 재시도 확인
