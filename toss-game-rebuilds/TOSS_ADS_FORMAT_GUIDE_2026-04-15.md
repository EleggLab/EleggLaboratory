# [DEPRECATED for current project scope]

이 문서는 참고 기록용이며, 현재 프로젝트는 FREE ONLY 정책으로 광고/정산 기능을 사용하지 않습니다.

# Toss 인앱광고 형식 정렬 가이드 (2026-04-15)

요청하신 링크(개요/콘솔/개발/QA/정산)를 기준으로 3개 프로젝트 공통 형식을 맞춘 문서입니다.

## 1) 콘솔 세팅 형식

### 선행
1. 사업자 정보 등록
2. 정산 정보 등록 (예금주명 완전 일치)
3. 약관 동의/검토 완료

### 광고 그룹 네이밍 규칙 (권장)
- `{화면}_{유형}_{목적}`
- 예시
  - `lobby_interstitial_transition`
  - `result_rewarded_revive`
  - `battle_banner_bottom`

### 그룹별 필수 메모
- 노출 트리거
- 쿨다운(초)
- 보상형 지급 조건(완료 콜백)
- 배치 위치(상/하/중앙)

## 2) 개발 형식 (통합 SDK 2.0 ver2 기준)

### 환경변수
- `TOSS_AD_MODE=test|live`
- `TOSS_AD_INTERSTITIAL_ID`
- `TOSS_AD_REWARDED_ID`
- `TOSS_AD_BANNER_ID`
- `TOSS_AD_NATIVE_IMAGE_ID`

### 테스트 ID (개발 전용)
- 전면형: `ait-ad-test-interstitial-id`
- 보상형: `ait-ad-test-rewarded-id`
- 배너 리스트형: `ait-ad-test-banner-id`
- 배너 피드형: `ait-ad-test-native-image-id`

### 정책 핵심
- 광고/콘텐츠 구분 불명확 UI 금지
- 광고 클릭 보상 문구 금지
- 강제 리디렉션/뒤로가기 차단 금지
- 핵심 플로우(결제/가입/로그인) 광고 금지
- 게임형 배너는 상/하단 권장(중앙 지양)

## 3) QA 형식

### 공통 체크
- [ ] 사전 로드 성공
- [ ] 로드 후 즉시 재생
- [ ] 종료 후 미니앱 정상 복귀
- [ ] 광고 중 오디오 pause
- [ ] 복귀 후 오디오 resume
- [ ] 닫기/실패 예외 처리
- [ ] 보상형 완료 이벤트에서만 보상 지급
- [ ] 중복 지급 방지(새로고침/재요청)
- [ ] 빈도 제한/쿨다운 적용
- [ ] 실기기에서 백그라운드 복귀 정상

### 로그 체크
- [ ] impression/click/close/rewarded_complete 이벤트 수집
- [ ] 광고 그룹 ID와 로그 식별자 일치

## 4) 정산 형식

### 운영 기본
- 정산은 앱 단위가 아니라 **사업자 단위 합산**
- 정산 정보/세금계산서 승인 누락 시 지급 지연 가능

### 일정 (문서 기준)
- 광고 정산 내역 확정: 익월 2영업일 12:00
- 지급: 익월 말 영업일

### 실무 주의
- 역발행 세금계산서 승인 마감 누락 금지
- 대시보드 수익과 내부 로그 대조 자동화 권장

## 5) 최신 변경/공지성 포인트 (문서 확인 기반)

- 통합 SDK 2.0 ver2 사용 권장
- AdMob 단독 SDK는 추후 지원 종료 가능성 명시
- 샌드박스 광고 테스트 제한(실기기 QR 테스트 권장)
- 과거 수수료 0% 프로모션(2026-03-31까지) 표기 존재 → 현재 적용 여부 콘솔 공지 재확인 필요

---

적용 상태:
- `toss-breaking-block-v2-webapp` 형식 반영 완료
- `toss-allages-ai-game-webapp` 형식 반영 완료
- `merge-tactics-ux-overhaul`은 Flutter 프로젝트라 동일 정책 기준만 우선 반영
