# Risu/서사 운용 연구 노트 - 2026-03-14

## 목적
이번 조사에서 실제로 확인한 자료, 접근 가능 여부, Pojet에 옮길 수 있는 포인트를 빠르게 다시 확인할 수 있도록 남기는 메모다.

## 로컬 확인 자료
- `new-project/docs/writing/RISU_PROMPT_NARRATIVE_TEXTBOOK_2026-03-14.md`
- `risu-readable/readable/001-affection-v1-0-module.module.json`
- `risu-readable/readable/011-dramatist-hypa-v3-json.json`
- 전체 목록: `pojet/reports/ai/risu-source-list-20260314.json`

## 공개 자료 확인 결과

### 접근 성공
- SillyTavern World Info: 동적 지식 삽입, 재귀 스캔, 토큰 예산, sticky/cooldown/delay
- SillyTavern Author's Note: 위치, depth, 빈도, 응답 편향 관리
- Chub Lorebooks: selective, constant, probability, entry 개념
- Chub State: Initialization / Message / Chat State 구분
- RisuAI Wiki Lorebook / Regex / Curly-Brased Syntaxes
- Emily Short: 선택과 관계 변화의 연결
- PulseGeek: choice and consequence, pacing, verbs

### 접근 실패
- 아카라이브 AI 채팅 채널 직접 접근
- URL: `https://arca.live/b/characterai`
- 결과: `403`
- 비고: 검색 인덱스와 기존 로컬 정리 문서를 보조 자료로 사용

## Pojet에 바로 옮긴 핵심
- 관계를 숫자 하나로 두지 말고 사건 슬롯과 태도 변화로 관리
- 본문, 상태, 로그는 분리
- 초반은 고정 장면 우선
- 중반은 저장 라이브러리 + 생성기 보강 혼합
- 성인 장면은 반드시 관계/주도권/빚/루머의 변화로 이어지게 설계
- recent memory / similar memory / anchor memory 분리
- Author's Note식 짧은 장면 편향은 매턴이 아니라 장면 전환 시점에만 갱신

## 산출물
- 기준서: `pojet/docs/writing/POJET_RISU_WRITING_MASTERBOOK_2026-03-14.md`
