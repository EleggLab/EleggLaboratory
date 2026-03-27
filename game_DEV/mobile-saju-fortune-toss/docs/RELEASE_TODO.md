# Release TODO (Final Pass)

작성일: 2026-02-16  
범위: 앱 출시 직전 안정화(코드/설정/검증/운영 체크)

## 1) 안정성
- [x] 라우팅 오류/런타임 예외 폴백 UI 추가
DoD: 잘못된 경로 또는 렌더링 오류 시 빈 화면 대신 복구 가능한 UI가 노출된다.
검증: `apps/mobile/app/+not-found.tsx`, `apps/mobile/app/_layout.tsx`의 ErrorBoundary 동작.

- [x] 핵심 회귀 QA(10회 반복) 자동화 유지
DoD: 사주/타로/API 라우트/Q&A 연월 변경 검증이 자동 실행된다.
검증: `pnpm qa:regression` PASS.

## 2) 퍼포먼스/번들
- [x] 모바일 에셋 용량 리포트 + 예산 경고 스크립트 추가
DoD: 참조 에셋 총량/상위 대용량 파일/누락 레퍼런스를 리포트로 남긴다.
검증: `pnpm verify:assets` 실행 시 `docs/ASSET_AUDIT.md` 생성.

- [x] 데일리 운세 화면 에셋 참조 최적화(중복 대형 세트 제거)
DoD: 별자리/12지신에서 아이콘 세트를 공용 사용하고 상세 카드도 동일 세트 사용.
검증: `apps/mobile/app/(tabs)/today.tsx`에서 대형 `assets/zodiac/*` 참조 제거.

## 3) 스토어 준비 설정
- [x] `app.json` 출시 필수 필드 보강
DoD: 아이콘/스플래시/업데이트/런타임 버전/안드로이드 적응형 아이콘이 정의됨.
검증: `apps/mobile/app.json` 확인.

- [x] 앱 아이콘/스플래시 파일 연결
DoD: 실제 파일이 존재하고 app.json 경로와 일치.
검증: `apps/mobile/assets/app-icon.png`, `apps/mobile/assets/splash-icon.png`, `apps/mobile/assets/adaptive-foreground.png`.

## 4) 릴리스 절차
- [x] 원클릭 프리플라이트 커맨드 추가
DoD: 에셋 검사 + QA + 타입체크 + 테스트 + 빌드를 한 번에 수행.
검증: `pnpm release:check`.

## 5) 수동 확인(출시 직전 필수)
- [ ] Android 실제기기 1대 이상에서 15분 이상 탭 이동/재진입 테스트
- [ ] 오늘의 운세(타로 today) 날짜 경계(KST 00:00 전후) 실제 동작 점검
- [ ] 스토어 등록용 스크린샷(홈/타로/사주/Q&A/주역/데일리) 최종 캡처
- [ ] 개인정보처리방침/고객문의 URL(스토어 메타데이터) 점검

## 변경 요약
- 추가: `apps/mobile/app/+not-found.tsx`
- 수정: `apps/mobile/app/_layout.tsx`
- 수정: `apps/mobile/app/(tabs)/today.tsx`
- 수정: `apps/mobile/app.json`
- 추가: `packages/tools/src/check-mobile-assets.ts`
- 수정: `packages/tools/package.json`
- 수정: `package.json`
