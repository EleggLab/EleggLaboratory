# Project Catalog

## Root Monorepo

- `apps/`
  - `web`: Tong Keusine 프런트엔드
  - `worker`: Tong Keusine Cloudflare Worker
  - `worklog-web`: 워크로그 웹 UI
  - `worklog-server`: 워크로그 서버
- `packages/shared`
  - Tong Keusine 루트 모노레포 공용 TypeScript 코드

## Standalone Projects

- `kr-paper-trader-v1`: 한국 주식 페이퍼 트레이더
- `magic_toss`: Toss 기반 매직 토스 앱
- `magical_potion_toss`: 마법 물약 Toss WebView 게임
- `mobile-suite`: Flutter 멀티앱 실험 묶음
- `new-project`: 신규 실험용 프로젝트 껍데기
- `nibel_arena_counter`: Nibel 카운터 앱
- `nibel_arena_counter_uploader`: Nibel 업로더 앱
- `pojet`: 내러티브/프레젠테이션 중심 프로젝트
- `starter`: 템플릿/스타터 제작 루트
- `toss-game-rebuilds`: Toss 게임 리빌드 묶음
- `unity-mcptest`: Unity 실험 및 Stackcraft 관련 작업

## Incubator Area

`game_DEV/` 아래는 실험실 영역이다. 대표 하위 프로젝트는 아래와 같다.

- `mobile-saju-fortune`
- `mobile-saju-fortune-toss`
- `mobile-saju-fortune-toss-10pass`
- `mobile-breaking-block-augment`
- `mobile-breaking-block-augment-toss`
- `merge_tactics`
- `merge_tactics_ascii`
- `text-choice-frame-studio`
- `word-morph-lab`
- `word-morph-lab-serial-30pass`
- `pc-choice-ugc`
- `novel-zombie-line2-train`
- `ugc-python-steam`

## Shared Hubs

- `shared-assets/`
  - `art/`: 공용 아트 팩과 임시 UI 아트
  - `characters/astra/`: Astra 원본 자산
  - `project-docs/magical-potion/`: 마법 물약 GDD/밸런스 문서
  - `nibel/best-sets/`: Nibel 베스트셋 자산
  - `risu/`: Risu 공용 산출물
- `research/`
  - `reference-library/vibe-coding-kit/`: 빠르게 참고하는 바이브 코딩 자료
  - `nibel/rules/`: Nibel 규칙 자료
  - `openclaw/`: OpenClaw 관련 조사 문서
  - `github-wide/`: 광범위한 외부 레포 리서치

## Legacy Mirror Sets

- `risu-prepared`
- `risu-readable`
- `risu-source`

이 세 디렉터리는 여전히 살아 있는 자료셋이지만, 공용 허브 관점에서는 `shared-assets/risu/*`와 역할이 겹친다. 새 공용 소비 경로를 만들 때는 `shared-assets/risu/*`를 우선 검토한다.
