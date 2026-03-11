# Chronicle Writing Rules

## 목표
- 로그는 단문 피드(`feedLine`)와 설명 본문(`bodyParagraph`)을 분리한다.
- 원인(`causalNotes`)과 후속 가능성(`followupHooks`)을 명시해 자동 진행의 맥락을 남긴다.
- 기존 문자열 로그도 `normalizeLogEntry`로 구조화해 하위 호환을 유지한다.

## 문장 규칙
- `feedLine`: 한 줄, 위치 또는 사건 출처를 반드시 포함한다. 간결하지만 강렬한 인상을 남기도록 한다.
- `bodyParagraph`: 2~6문장 (기존 2~4문장에서 확장), 인과 연결어(예: "그래서", "때문에", "결국", "그 결과")를 최소 1회 사용한다. **성인 테마 묘사 시, 직접적인 단어 대신 암시, 은유, 심리적 묘사, 신체 반응, 관계의 역학 변화에 집중한다.** (예: 붉어진 얼굴, 가빠지는 숨, 흐트러진 옷매무새, 끈적한 시선, 탐하는 손길, 달콤한 속삭임 등)
- `causalNotes`: 짧은 원인 목록(최대 4개). 사건의 배경과 심리적 동기를 명확히 한다.
- `followupHooks`: 다음 분기 힌트(최대 3개). 플레이어의 선택이 가져올 수 있는 관계적, 심리적, 육체적 대가를 암시한다.

## 태그 규칙
- `maturityTags`: phase/tier/상태(taint, fatigue, 관계 긴장)를 기록한다.
- `visualStateTags`: 화면 연출 토큰(mood-danger/mood-shadow 등)을 기록한다.
- `refs`: run/tick/location/event 식별자를 남긴다.

## 금지
- 외부 API 호출 기반 텍스트 생성 금지.
- content pack 문장을 그대로 최종 출력으로 사용하는 것 금지.
- **맥락 없는 노골적인 성적 묘사 및 비동의 강압적 행위의 미화 금지.** (AI 검열 우회 전략과 일관성을 유지)
