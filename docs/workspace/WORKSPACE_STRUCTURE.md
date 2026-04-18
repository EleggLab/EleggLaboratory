# Workspace Structure

이 워크스페이스는 여러 독립 프로젝트, 실험용 하위 리포지토리, 공용 에셋, 리서치 자료가 함께 들어 있는 멀티 프로젝트 랩이다.

## Root Policy

루트에는 아래 네 종류만 둔다.

- 실제 실행 가능한 프로젝트 루트
- 워크스페이스 운영 파일
- 공용 허브 디렉터리
- 공통 스크립트와 공통 설정 파일

루트에 새 폴더를 바로 만드는 대신 먼저 아래 허브에 들어갈 수 있는지 본다.

- `shared-assets/`: 여러 프로젝트에서 재사용하는 에셋, 캐릭터 원본, 밸런스 문서, 외부 에셋 팩
- `research/`: 조사 문서, 참고 자료, 외부 리포지토리 조사, PDF/텍스트 기반 리서치
- `data/`: 런타임 데이터, 백업, 복구 산출물, 생성된 상태 파일
- `apps/`: 현재 루트 pnpm 워크스페이스에 속하는 앱
- `packages/`: 현재 루트 pnpm 워크스페이스의 공용 코드
- `scripts/`: 루트 수준 자동화 스크립트

## Current Layout

- `apps/`: Tong Keusine 웹/워커/워크로그 앱
- `packages/`: Tong Keusine 루트 모노레포 공용 TypeScript 패키지
- `game_DEV/`: 게임 실험실과 프로토타입 모음
- `shared-assets/`: 공용 에셋 허브
- `research/`: 리서치 허브
- `data/`: 백업, 복구, 워크로그 상태
- `memory/`, `persona/`: 워크스페이스 운영 기억과 페르소나 문서

## What Was Cleaned Up

루트에 흩어져 있던 자료를 아래로 재배치했다.

- `아스트라` -> `shared-assets/characters/astra`
- `마법 물약` -> `shared-assets/project-docs/magical-potion`
- `nibel_best_sets` -> `shared-assets/nibel/best-sets`
- `참고자료` -> `research/reference-library/vibe-coding-kit`
- `nibel_rules_*` -> `research/nibel/rules/`
- `OPENCLAW_VIBE_*`, `RESEARCH_URL_INVENTORY_*` -> `research/openclaw/`

## Practical Rule

새 항목을 추가할 때는 먼저 아래 질문을 한다.

1. 실행 가능한 프로젝트인가
2. 여러 프로젝트에서 쓰는 공용 자산인가
3. 조사/참고용 자료인가
4. 생성물이나 상태 파일인가

답이 2, 3, 4라면 루트에 두지 않는다.
