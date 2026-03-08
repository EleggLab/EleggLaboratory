# Log Generation Flow

1. 자동 진행/이벤트/선택에서 상태 전후 스냅샷을 수집한다.
2. `buildContextPacket`으로 `phase`, `event`, `delta`, `location`, `refs`를 묶는다.
3. `narrativeEngine`이 content pack `logLines`를 원재료로 선택해 feed/body를 합성한다.
4. `causalNotesGenerator`가 자원/관계/체력 변화 기반 이유와 후속 훅을 만든다.
5. `normalizeLogEntry`로 구조화 모델을 보정해 `history.logs`에 저장한다.
6. UI는 중요 로그(T2/T3 또는 causal/hook 존재)를 카드로, 나머지는 행으로 렌더한다.
7. `buildLogQualityReport`가 형식 품질을 점검하고 테스트 결과에 요약을 남긴다.

## 호환성
- 입력이 문자열이면 `normalizeLogEntry`가 `feedLine=text` 형태로 감싸 저장한다.
- 기존 저장본의 문자열 로그도 migrate 시 구조화되어 동일 렌더 경로를 사용한다.
