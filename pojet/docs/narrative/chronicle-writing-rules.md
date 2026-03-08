# Chronicle Writing Rules

## 목표
- 로그는 단문 피드(`feedLine`)와 설명 본문(`bodyParagraph`)을 분리한다.
- 원인(`causalNotes`)과 후속 가능성(`followupHooks`)을 명시해 자동 진행의 맥락을 남긴다.
- 기존 문자열 로그도 `normalizeLogEntry`로 구조화해 하위 호환을 유지한다.

## 문장 규칙
- `feedLine`: 한 줄, 위치 또는 사건 출처를 반드시 포함한다.
- `bodyParagraph`: 2~4문장, 인과 연결어(예: "그래서", "때문에")를 최소 1회 사용한다.
- `causalNotes`: 짧은 원인 목록(최대 4개).
- `followupHooks`: 다음 분기 힌트(최대 3개).

## 태그 규칙
- `maturityTags`: phase/tier/상태(taint, fatigue, 관계 긴장)를 기록한다.
- `visualStateTags`: 화면 연출 토큰(mood-danger/mood-shadow 등)을 기록한다.
- `refs`: run/tick/location/event 식별자를 남긴다.

## 금지
- 외부 API 호출 기반 텍스트 생성 금지.
- content pack 문장을 그대로 최종 출력으로 사용하는 것 금지.
