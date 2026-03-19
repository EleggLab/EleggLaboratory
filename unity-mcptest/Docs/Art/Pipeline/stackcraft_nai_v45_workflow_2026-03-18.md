# StackCraft NovelAI V4.5 Workflow

## 목적
- 자동 초안 생성과 수동 정제를 분리해서 스타일 잠금 속도를 높인다.
- 스타일 드리프트를 줄이고, 선택된 컷을 종족 로스터로 안정적으로 확장한다.

## 역할 분리
### 자동 초안
- 목적: 빠른 스타일 후보 탐색
- 도구: 로컬 배치 스크립트 + API
- 현재 검증된 자동 초안 모델: `nai-diffusion-3`
- 출력: 스타일 잠금 후보, seed anchor 후보

### 웹 UI 정제
- 목적: 선택 컷을 `V4.5 Full` 또는 `V4.5 Curated`로 정제
- `Vibe Transfer`: 화풍 재현용
- `Character Reference`: 같은 캐릭터 재현용
- 같은 패스에서 `Vibe Transfer`와 `Character Reference`를 섞지 않음

## 권장 순서
1. 자동 초안으로 20~30장 생성
2. 상위 컷을 seed와 함께 고정
3. 선택 이미지 한 장을 `Vibe Transfer` 기준 이미지로 사용해 같은 스타일 재생성
4. 캐릭터를 반복 생성해야 할 때만 `Character Reference`로 전환
5. 최종 합격 컷만 고해상도 재생성

## Seed 사용 규칙
- 좋은 결과가 나오면 seed를 바로 ledger에 저장
- 다음 패스에서는 프롬프트 전체를 바꾸지 않고 한 변수만 수정
- 바꾸는 우선순위:
  1. 종족 파츠
  2. 의상
  3. 얼굴 비율
  4. 선 굵기

## 금지 규칙
- `reference sheet`, `multiple views`, `palette swatches`, `silhouette`, `unfinished lineart` 유도 키워드 금지
- 스타일 잠금 전에 노골적 adult 컷 양산 금지
- 종족 확장 전에 캐릭터별 개별 고정 디자인을 너무 깊게 파지 않음
