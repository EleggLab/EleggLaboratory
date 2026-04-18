# Naming Conventions

## Directory Names

- 새 루트 디렉터리는 기본적으로 영어 `kebab-case`를 쓴다.
- 공용 허브 아래의 새 디렉터리도 영어 `kebab-case`를 기본으로 한다.
- 이미 운영 중인 레거시 프로젝트 이름은 함부로 바꾸지 않는다.
- 한국어 이름은 창작 자산 묶음, 캐릭터 변형 이름, 원본 자료 폴더처럼 사람 읽기 중심 자료에만 남긴다.

좋은 예:

- `shared-assets/characters/astra`
- `research/reference-library/vibe-coding-kit`
- `shared-assets/project-docs/magical-potion`

피해야 할 예:

- 루트에 바로 `새 폴더`
- 목적이 불명확한 `temp2`, `newnew`, `final_real`

## File Names

- 일반 문서: `kebab-case.md`
- 날짜 포함 문서: `topic-YYYY-MM-DD.md`
- 회차/리포트: `topic-report-YYYY-MM-DD.md`
- JSON 데이터: `topic.json`

예외:

- `memory/YYYY-MM-DD.md`처럼 이미 워크스페이스 규칙에 묶인 파일은 기존 형식을 유지한다.
- 외부 도구나 앱이 요구하는 고정 파일명은 유지한다.

## Shared vs Project-Local

- 프로젝트 하나에만 종속되면 그 프로젝트 내부에 둔다.
- 둘 이상 프로젝트가 참조하거나, 나중에 재사용 가능성이 높으면 `shared-assets/` 또는 `research/`로 올린다.
- 코드 공용화가 필요한 경우만 `packages/`로 올린다.

## Generated Files

- 생성물은 가능하면 프로젝트 내부의 `generated`, `dist`, `build`, `reports` 같은 명확한 폴더에 둔다.
- 워크스페이스 수준 생성물은 `data/` 아래에 둔다.
- 원본과 생성물을 같은 레벨에 섞어 두지 않는다.
