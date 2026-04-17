# Single Game Harness Pass (Allages)

대상: `toss-allages-ai-game-webapp` 단일 프로젝트

## 변경
1. `src/game/types.ts`
- `BattleOutcome`에 시간제한 관련 필드 추가
  - `timeBonusNotes`
  - `timeLimitSec`
  - `elapsedSec`

2. `src/game/engine.ts`
- 결과 계산에 3분(180초) 챌린지 로직 추가
  - 승리 + 180초 이내면 `timeBonusNotes = 12`
  - 최종 노트 보상에 시간 보너스 합산
- 결과 summary를 시간제한 달성 여부에 맞게 분기

3. `src/app/App.tsx`
- 결과 화면에 시간제한 보너스 UI 추가
  - 달성 시: `3분 챌린지 보너스 +12 노트`와 기록 초 표시
  - 미달 시: 다음 목표(180초 이내 클리어) 노출

## 검증
- `npm run typecheck` PASS

## 의도
- 텍스트만 바꾸는 루프가 아니라, 실제 리텐션 규칙(시간제한 보상)을 게임 결과/보상 루프에 연결.
