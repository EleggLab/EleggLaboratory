# Starter 고도화 로드맵 (v0.1 → v0.5)

업데이트: 2026-03-14

## 목표
`starter/`를 "바로 실무 투입 가능한 바이브 코딩 킷"으로 확장.

## Phase 1 — 구조 안정화 (v0.1)
- [x] 기본 폴더 구조
- [x] 공통 프롬프트/체크리스트/예시
- [x] 다국어 기본 가이드(ko/en/ja/zh)
- [x] 언어권별 TOP1 레퍼런스 연결

## Phase 2 — 실행 자동화 (v0.2)
- [x] `scripts/bootstrap.sh` : 새 프로젝트 초기 세팅
- [x] `scripts/verify.sh` : 템플릿 구조 검증
- [x] `scripts/report.sh` : 변경 요약 자동 생성
- [x] `.env.example` + 설정 가이드(bootstrap 산출물 포함)

## Phase 3 — 품질 프레임워크 (v0.3)
- [x] PRD 템플릿 (`docs/PRD.template.md`)
- [x] 아키텍처 결정 기록 ADR 템플릿 (`docs/ADR.template.md`)
- [x] 실패 회고 템플릿 (`docs/postmortem.template.md`)
- [x] 보안 체크리스트 (`checklists/security-checklist.md`)

## Phase 4 — 다국어 운영 고도화 (v0.4)
- [ ] 언어별 프롬프트 패키지 분리 (`prompts/lang/*`)
- [ ] 번역 품질 가이드(용어집, 금칙어, 톤 규칙)
- [ ] 다국어 README 자동 생성 스크립트
- [ ] locale fallback 정책 문서화

## Phase 5 — 실전 배포형 킷 (v0.5)
- [ ] 템플릿 선택기 (`starter init --stack ...` 형태)
- [ ] 웹앱/봇/CLI 3종 스타터 샘플
- [ ] CI 예시(GitHub Actions) 내장
- [ ] 릴리즈 태깅/체인지로그 자동화

## 우선순위 (즉시 실행)
1. `bootstrap.sh` / `verify.sh` / `report.sh`
2. PRD/ADR 템플릿
3. 보안 체크리스트
4. 다국어 프롬프트 패키지

## 완료 기준
- 초보자도 10분 내 스타터 실행
- 팀원이 템플릿만으로 동일한 보고 포맷 유지
- 다국어 문서 품질 편차 최소화
