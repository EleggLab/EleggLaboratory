# Toss 게임 리빌드 진행 현황 (2026-04-15)

## 1) 브레이킹블록 → Toss 앱 재구성
- 경로: `toss-breaking-block-v2-webapp`
- 베이스: `magic_toss/app` 템플릿 복사
- 작업: Toss WebView용 구조로 신규 복제 완료, 메인 카피/화면 문구를 브릭 테마로 1차 교체

## 2) merge_tactics UX/UI 대개편 트랙
- 경로: `merge-tactics-ux-overhaul`
- 작업:
  - 신규 복제 완료
  - 로비에 **게임 방법 패널** 추가
  - 퀘스트/버튼/결과 일부 문구를 한국어 중심으로 정리
- 목표: 첫 실행 시 룰 이해 가능한 온보딩 우선

## 3) 마지막 게임 → 전체이용가 Toss 게임 재구성
- 경로: `toss-allages-ai-game-webapp`
- 베이스: `magic_toss/app` 템플릿 복사
- 작업:
  - 전체이용가용 콘텐츠(`src/game/content.ts`) 전면 교체
  - 폭력성 낮은 캐릭터/라운드/보상 명명으로 변경
  - AI 이미지 제작용 프롬프트 문서 추가 (`AI_IMAGE_PROMPTS.md`)

## 슈퍼센트식 심플화 반영 (추가)
- `toss-breaking-block-v2-webapp/src/app/App.tsx`
  - 로비를 **3초 시작형**으로 축소(바로 플레이 메인 CTA)
  - 결과 화면 버튼을 3개(보상/다시/로비)로 단순화
- `toss-allages-ai-game-webapp/src/app/App.tsx`
  - 전체이용가 톤 유지 + 로비/결과 동일한 심플 구조로 축소
- `merge-tactics-ux-overhaul/lib/main.dart`
  - 로비 버튼을 빠른시작 중심으로 재배치(정보 밀도 축소)

## 이번 추가 개발 반영 (우선순위 재정리)
- 쓸모없는 정보/패널 축소 중심으로 구조 정리 완료
- `toss-breaking-block-v2-webapp`
  - 클래스 선택 카드 정보량 축소(핵심 한 줄만)
  - 전투 하단 HUD를 2요소(레벨/처치)로 단순화
  - 설정 화면을 필수 2개(사운드, 저장초기화)만 유지
- `toss-allages-ai-game-webapp`
  - 위와 동일한 심플 구조 적용
- `merge-tactics-ux-overhaul`
  - 로비 중복 버튼/퀘스트 패널 제거
  - 빠른 시작 중심으로 단순화
  - 불필요 함수/임포트 제거

## 검증
- Web 2개 프로젝트 `typecheck` 통과
- Flutter `flutter analyze lib/main.dart` 통과

## 광고/정산 형식 정렬 반영 (추가)
- 제공 링크(개요/콘솔/개발/QA/정산) 기준으로 형식 문서화 완료
- `TOSS_ADS_FORMAT_GUIDE_2026-04-15.md` 신규 작성
- 두 웹앱 `.env.example` 광고 변수/테스트 ID 형식 반영
- 두 웹앱 `README.md`를 광고 정책/QA 기준으로 업데이트

## 다음 단계(권장)
1. 광고 SDK 실제 호출 래퍼 구현(전면/보상/배너) 및 콜백 로그 수집
2. 보상형 광고 완료 콜백 기반 보상 지급 로직 연결
3. 토스 실기기 QA(광고 시나리오 포함) 20회 반복 검증
