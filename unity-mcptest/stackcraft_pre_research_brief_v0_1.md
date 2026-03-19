# StackCraft / Stacklands / Unity MCP 사전 리서치 브리프 v0.1

## 1. StackCraft 공개 정보 기준 파악
- 에셋명: StackCraft - Card Stacking Survival Game
- 공개 페이지 기준 버전 1.0.0
- 공개 페이지 기준 출시일 2026-01-15
- Original Unity version 2022.3.62
- 라이선스 표기: Standard Unity Asset Store EULA / Extension Asset
- 외부 의존성: DOTween
- 공개 기능:
  - Dynamic Stacking Logic
  - Day Cycle: Feeding / Selling / Encounters / New Day
  - Time-based recipes + discovery
  - Tactical Combat (RPS, projectile/magic feedback)
  - Quest System
  - Dynamic Encounter System
  - ScriptableObject 중심 콘텐츠 추가
  - Save System

## 2. Stacklands 핵심 구조
- 카드 스태킹 기반 생존/경영
- 카드 판매 -> 코인 -> 카드 팩 구매
- 매 문(Moon) 주기마다 음식 공급 필요
- 자동 전투
- 아이디어 카드로 레시피 발견
- 장소(Location) 카드 탐험 구조 존재

## 3. 이번 프로젝트에 유리한 해석
- 카드 팩을 상단 장소 카드로 치환하는 것은 원작 구조와 완전히 동떨어진 발상이 아님
- Stacklands도 이미 보라색 Location 카드를 통해 탐험-보상 구조를 제공
- 따라서 StackCraft의 stacking + encounter + save를 기반으로
  "장소 변이 + 선물 + 호감도 + 혈통" 루프를 얹는 것이 방향상 자연스러움

## 4. 에셋이 강한 부분
- 카드 간 상호작용 규칙
- 시간 기반 제작/상태 진행
- 날짜/단계 루프
- 전투와 적 스폰
- 데이터 중심 콘텐츠 추가
- 저장

## 5. 별도 커스텀 구현이 필요한 부분
- 개체별 이름/부모/자식/세대 저장
- 자동 이동/자동 교배 AI
- 호감도와 선물 반응
- 교배 잠금 / 임신 / 출산
- 전체 가계도 화면
- 인간 기원 유지 + 현재 종족 변이 이력

## 6. Stacklands 모딩 자료에서 얻는 시사점
- 카드 / 아이디어 / 팩이 JSON 기반으로 추가됨
- 카드 타입에 스크립트 클래스가 연결됨
- 블루프린트/서브프린트로 제작 규칙 표현 가능
- 즉, 최종 기획서는 인간용 감성 문서보다
  AI가 ScriptableObject / 규칙 데이터로 분해하기 쉬운 형식이 유리함

## 7. Unity MCP 문서에서 얻는 시사점
오픈소스 Unity MCP 계열 도구들은 대체로 다음을 지원한다.
- Unity 에디터 연결
- 에셋/씬/스크립트 탐색
- 스크립트 생성/수정/검증
- 스크린샷/시각 확인
- 테스트 실행
- 로그/컴파일 상태 확인

따라서 후속 마스터 기획서는 아래 단위로 쪼개는 것이 좋다.
- SpeciesData
- LocationData
- AffectionRule
- CharacterStateMachine
- EncounterTable
- GenealogyGraph
- UIDetailPanel
- SaveSchema
- QuestMilestone

## 8. 현재 기준 결론
이번 게임은 "Stacklands 클론"으로 가는 것이 아니라
"StackCraft를 기반으로 한 소규모 판타지 혈통/관계 카드 시뮬레이션"으로 재정의하는 편이 맞다.