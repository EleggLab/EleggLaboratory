# Vibe Coding Starter (Multilingual)

빠르게 시작하는 바이브 코딩 템플릿이예여.

## 포함 내용
- `prompts/` : 공통/언어별 프롬프트
- `prompts/reference/foundation-prompts.md` : 기초 프롬프트 레퍼런스(명령 강제 X)
- `prompts/reference/context-engineering-cards.md` : 컨텍스트 엔지니어링 카드(명령 강제 X)
- `checklists/` : 품질 점검 체크리스트 (release/security/agent-run/prompt-quality/research-ingestion)
- `scripts/` : 리서치/스캐폴딩 보조 스크립트
- `examples/` : 요청 템플릿
- `locales/` : ko/en/ja/zh 언어별 가이드
- `docs/` : PRD/ADR/Postmortem 템플릿

## Quick Start
1. `prompts/system.base.md`를 복사해 프로젝트 목표 반영
2. `prompts/task.template.md`로 작업 단위 생성
3. `checklists/release-checklist.md`로 품질 점검
4. 필요 시 `locales/<lang>/README.md`로 언어 전환

## 설치형 CLI 사용
```bash
cd starter
./install.sh
vibe-starter init webapp my-app
vibe-starter verify ./starter
vibe-starter report ./starter-report.md
```

## 추천 워크플로우
- 스펙 정의 → 구현 → 테스트 → 회고를 짧은 루프로 반복
- 작은 단위로 커밋
- 결과물은 반드시 실행/검증 로그 남기기

## 문서
- 고도화 로드맵: `starter/ROADMAP.md`
- 추가 조사 플랜: `research/additional-research-plan.md`

## 스크립트
- `scripts/bootstrap.sh <name> [target_dir]` : 새 프로젝트 골격 생성
- `scripts/init.sh <webapp|bot|cli> <name> [target_dir]` : 스택 기반 스타터 생성
- `scripts/verify.sh [root_dir]` : starter 구조 검증
- `scripts/report.sh [output.md]` : 변경 요약 리포트 생성
- `scripts/build-locales-index.sh [root_dir]` : locale 인덱스 README 자동 생성
- `scripts/release-tag.sh vX.Y.Z` : 릴리즈 태그 생성
- `scripts/vibe-starter.js` : 설치형 Node CLI 엔트리

## 스택 템플릿
- `templates/webapp`
- `templates/bot`
- `templates/cli`

## i18n 문서
- `docs/i18n/translation-style-guide.md`
- `docs/i18n/glossary.md`
- `docs/i18n/locale-fallback-policy.md`

## 리서치 자동화
- `scripts/research-github.py` : 광범위 GitHub 1차 수집 + 카드 생성
- `scripts/research-github-deep.py` : 샤딩 기반 반복 수집(coverage 확장)
- `scripts/triage-research-cards.py` : 카드→starter 반영 후보 자동 분류
- `scripts/apply-adoption-batch.py` : 반영 백로그 자동 생성 (`starter/backlog.md`)
- `scripts/backlog-progress.py` : backlog 진행률 계산
- `scripts/refresh-research.sh` : 수집→분류→백로그→리포트 원클릭 실행
- 결과 위치: `research/github-wide/`
