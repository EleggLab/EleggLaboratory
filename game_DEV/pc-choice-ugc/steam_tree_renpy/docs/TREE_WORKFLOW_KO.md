# TREE_WORKFLOW_KO

## 목적

기존 UGC 그래프(노드/엣지) 편집기는 자유도가 높지만, 실제 운영에서는 다음 문제가 자주 발생합니다.

- 루프/역참조로 인한 QA 난이도 급증
- 이벤트 체인 디버깅 복잡
- 신규 작가 온보딩 비용 증가

이번 구조는 `하나의 나무결(단일 트리)`로 고정합니다.

## 핵심 규칙

1. 시작 노드는 1개
2. 모든 노드는 부모 1개(루트 제외)
3. 분기는 `choices`로만 진행
4. 기본적으로 순환(cycle) 금지

## 파일

- 원본 스토리: `content/story_tree.json`
- 유효성 검사: `tools/validate_tree.py`
- 레거시 변환: `tools/convert_reactflow_to_tree.py`
- 런타임 반영: `tools/build_renpy_story.py`
- 게임 반영 경로: `project/game/ugc/story_tree.json`

## 작업 순서

1. `content/story_tree.json` 편집
2. `python tools/validate_tree.py content/story_tree.json`
3. `python tools/build_renpy_story.py --source content/story_tree.json --target project/game/ugc/story_tree.json`
4. Ren'Py에서 실행

## 언어

- 기본 언어: 한국어(`ko`)
- 영어(`en`) 병행 입력
- 런타임에서 한/영 전환 가능

## 에셋 정책

- `project/game/gui/ugc/`의 PNG를 우선 사용
- 누락 시 Ren'Py 기본 스타일로 안전한 fallback
- 에셋 누락으로 크래시가 나지 않도록 구성
