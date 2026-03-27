<<<<<<< Updated upstream
# Text Choice Template

장면과 선택지만 채워 넣는 최소 텍스트 선택형 제작기입니다.

## 포함 기능

- 새 프로젝트: 7장면 기본 템플릿 로드
- 프로젝트 JSON 불러오기 / 내보내기
- 장면 추가, 엔딩 추가, 선택지 편집
- 바로 확인하는 플레이테스트

## 기본 구조

- 도입
- 사건
- 단서
- 압박
- 결정
- 엔딩 A
- 엔딩 B

## JSON 형식

```json
{
  "version": 1,
  "meta": {
    "title": "제목",
    "author": "작성자",
    "start_node_id": "intro"
  },
  "nodes": [
    {
      "id": "intro",
      "kind": "scene",
      "title": "도입",
      "speaker": "",
      "text": "",
      "writer_note": "",
      "next": "incident",
      "choices": []
    }
  ]
}
```

추가 필드는 불러올 때 무시되며, 다시 저장하면 최소 형식으로 정리됩니다.
=======
# Text Choice Frame Studio

`Text Choice Frame Studio`는 AI가 스토리를 자동 생성하는 툴이 아니라, 사용자가 직접 텍스트 기반 게임의 장면/선택지/결과를 채워 넣는 경량 저작기입니다.

## 왜 따로 만들었나

기존 레거시 프로젝트 2개는 다음처럼 무겁습니다.

- `pojet`: 자동 진행 루프, 초상화/연출, 성인 톤 분기, 다량의 콘텐츠 팩까지 포함한 대형 실험 프로젝트
- `new-project`: 포스트 아포칼립스 성인 RPG 쪽 기획과 생존/전투/관계 시스템이 들어간 CLI 프로토타입

이번 툴은 그 반대로 갑니다.

- 사건 하나
- 선택지 2~3개
- 조건 몇 개
- 결과 몇 개
- 엔딩

즉, `서울 2033`이나 `모험가 이야기`처럼 텍스트 이벤트 중심 감각을 참고하되, 기존 레거시보다 더 단순한 틀에 집중합니다.

## 핵심 원칙

- 그래프 편집기 대신 폼 기반 편집
- AI 생성 프롬프트 대신 작가 메모와 장면 틀 제공
- 전투/장비/초상화/자동 서사 생성 기본 제외
- JSON 저장/불러오기와 즉시 플레이테스트 제공
- `pc-choice-ugc`(60sec Choice Game UGC) 레거시 그래프 JSON 감지 및 단순 프레임 변환
- 편집용 JSON / 런타임 JSON 분리 내보내기
- 구조 감사 카드로 시작점, 막힌 장면, 도달 엔딩 빠른 확인

## 실행

가장 간단한 방법:

1. `index.html`을 브라우저에서 엽니다.

좀 더 안정적으로 열고 싶다면:

```powershell
cd game_DEV/text-choice-frame-studio
python -m http.server 8010
```

그 뒤 브라우저에서 `http://127.0.0.1:8010` 접속.

## 데이터 구조

툴이 저장하는 JSON은 단순한 single-tree 형태입니다.

- `meta`: 제목, 작성자, 시작 장면
- `stats`: 숫자형 능력치
- `flags`: 과거 선택 여부 플래그
- `nodes`: 장면 목록
- 각 장면의 `choices`: 선택지와 다음 장면, 조건, 효과

이 구조는 `game_DEV/pc-choice-ugc/steam_tree_renpy`의 단순 트리 발상을 참고했지만, 입력 UI는 훨씬 단순하게 줄였습니다.

## 60sec UGC 참고 포인트

이번 버전에서 가져온 아이디어는 아래 3개입니다.

- `pc-choice-ugc/src/utils/graphAudit.js`: 시작/엔딩/도달 불가/막힌 노드 점검 방식
- `pc-choice-ugc/steam_tree_renpy/tools/convert_reactflow_to_tree.py`: 레거시 그래프를 단순 트리로 접는 발상
- `pc-choice-ugc/src/stores/editorStore.js`: 60초 스타일 이벤트/분기 템플릿 감각

다만 UI는 끝까지 단순하게 유지했습니다. ReactFlow 편집기를 다시 만들지 않고, 장면 카드 + 선택지 폼 편집 흐름만 남겼습니다.

`ugc-python-steam`은 별도 설계 레퍼런스라기보다 `pc-choice-ugc`를 감싸는 실행/패키징 래퍼로 보고, 이번 툴 범위에서는 직접 참고 대상으로 삼지 않았습니다.

## 추천 작업 방식

1. 장면 제목과 작가 메모부터 씁니다.
2. 장면 본문은 틀만 먼저 채웁니다.
3. 선택지는 2~3개만 유지합니다.
4. 조건은 많아도 1~2개만 둡니다.
5. 효과는 능력치 변화 1개 + 플래그 1개 정도에서 멈춥니다.
6. 플레이테스트로 흐름을 반복 확인합니다.

## 포함 파일

- `index.html`: UI 골격
- `styles.css`: 경량 편집기 스타일
- `app.js`: 편집/검증/플레이테스트 로직
>>>>>>> Stashed changes
