# EleggLaboratory Workspace

여기는 여러 프로젝트, 실험 작업, 공용 자산을 함께 운영하는 워크스페이스다.

이번 정리의 기준은 단순하다.

- 실행 중인 프로젝트 루트는 최대한 그대로 둔다.
- 여러 프로젝트가 함께 쓰는 자료는 `shared-assets/`로 모은다.
- 조사/참고/리서치 자료는 `research/`로 모은다.
- 공용 코드와 설정 허브는 `packages/`, `data/`, `scripts/`로 구분한다.

## Workspace Guide

- 구조 가이드: `docs/workspace/WORKSPACE_STRUCTURE.md`
- 네이밍 규칙: `docs/workspace/NAMING_CONVENTIONS.md`
- 프로젝트 카탈로그: `docs/workspace/PROJECT_CATALOG.md`
- 공용 허브 정리: `docs/workspace/SHARED_RESOURCES.md`

## Shared Hubs

- 캐릭터/원화 공용 자산: `shared-assets/characters/`
- 프로젝트 공용 문서: `shared-assets/project-docs/`
- 니벨 공용 자료: `shared-assets/nibel/`
- 참고/리서치 자료: `research/`
- 공용 코드 패키지: `packages/`
- 스크립트/정리 자동화: `scripts/`

## Current Layout Rule

- `apps/`, `packages/`: 공용 런타임/패키지 계층
- `game_DEV/`: 실험/인큐베이팅 프로젝트 존
- 루트 개별 폴더: 이미 독립적으로 굴러가던 프로젝트는 안전하게 유지
- `shared-assets/`: 여러 프로젝트가 재사용하는 원본 자산/문서
- `research/`: 조사, 참고자료, 외부 레퍼런스
- `data/`: 워크스페이스 메타데이터, 복구 자료, 정리 결과물

## Notes

- `shared-assets/characters/astra/`는 Astra 원본 자산의 기준 위치다.
- `shared-assets/project-docs/magical-potion/`는 마법 물약 관련 문서 허브다.
- `research/reference-library/vibe-coding-kit/`는 이전 `참고자료`를 정리한 위치다.
- 대규모 폴더 이동은 의존성 위험이 큰 프로젝트에는 일부러 적용하지 않았다.
