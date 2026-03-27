# COMPETITIVE GAP REVIEW

## Date
- 2026-02-15

## Benchmark Sources
- 원광만세력 (App Store): https://apps.apple.com/kr/app/%EC%9B%90%EA%B4%91%EB%A7%8C%EC%84%B8%EB%A0%A5/id1130206135
- 포스텔러 (App Store): https://apps.apple.com/kr/app/%ED%8F%AC%EC%8A%A4%ED%85%94%EB%9F%AC-%EC%9A%B4%EC%84%B8-%EC%82%AC%EC%A3%BC-%ED%83%80%EB%A1%9C-ai/id1538180551
- 점신 (App Store): https://apps.apple.com/kr/app/%EC%A0%90%EC%8B%A0-%EC%9A%B4%EC%84%B8-%EC%82%AC%EC%A3%BC-%ED%83%80%EB%A1%9C-ai%EC%B1%97/id529333697

## Observed Common Features
- 명조 저장/관리(다중 프로필)
- 2인 비교/궁합
- 결과 공유(링크/이미지/리포트)
- 초심자 친화 UX(검색, 빠른 진입)
- 홈 중심 하단탭(카테고리 접근)
- 오늘의 운세(고정 스크롤) / 타로(셔플-선택-공개)
- “긴 자연어 풀이”와 “분야별 Q&A”를 분리해서 제공

## Prior Gaps in This Repo
- 계산 결과를 보관/재사용하는 기능 부재
- 저장된 두 명조를 UI에서 바로 비교하는 기능 부재
- 입력 재현을 위한 공유 링크 기능 부재
- 앱(Expo) 중심 UX 부재(웹 중심)

## Implemented Improvements
- 웹에 저장 명조 관리 추가
  - 저장, 검색, 삭제, 불러와 재계산
- 궁합 비교 탭 추가
  - 저장된 두 명조 선택 후 비교 API 호출
  - 일간 관계, 우세 오행, 오행 차이, 비교 노트 표시
- 공유 링크 추가
  - 현재 입력을 `bi` query로 인코딩해 복사
  - 링크 접속 시 입력 자동 복원
- 앱 우선 UX 전환(웹은 테스트용)
  - 5탭 하단바(홈 중앙): `타로 / 사주 / 홈 / 주역 / 오늘`
  - 사주 결과는 “결과표 → 자연어 리포트 → Q&A → 연/월 선택” 흐름으로 단순화
  - 타로: 타입 선택 → 자동 셔플 → 카드 선택 → 결과(오늘은 1일 1회 저장)
  - 주역점: 초 단위 시간 탭 기반으로 괘상 생성 + 긴 안내문

## Scope Intentionally Deferred
- 이미지/PDF 리포트 공유
- 계정 동기화(클라우드 저장)
- 푸시/알림 기반 일진 서비스
- 주역 64괘 정식 데이터(괘명/괘사/효사) 전체 탑재(현재는 트라이그램 기반 MVP)
