# Top30 패턴 종합 (Starter 반영안)

기반 자료: `research/github-wide/reports/top30-starter-patterns.md`

## 핵심 인사이트
- Prompt 자산은 "템플릿 강제"보다 "레퍼런스 카드" 방식이 재사용성이 높음
- 자동화 스크립트는 init/verify/report 루프가 기본이며, 여기에 연구-반영 루프를 붙여야 성장 속도가 빨라짐
- 품질은 기능 테스트만으로 부족하고, 보안/회귀/운영 체크리스트를 분리해야 릴리즈 사고가 줄어듦
- 문서는 온보딩 속도(10분 규칙)와 운영 재현성(롤백/결정 기록)이 성패를 좌우함

## Starter 반영 우선순위
1. Prompts: 기초 카드 + 컨텍스트 엔지니어링 카드 확장
2. Checklists: Agent Run / Release Gate / Security를 독립 체크리스트로 운영
3. Scripts: 리서치 카드에서 starter 반영 후보를 자동 추출
4. Docs: 온보딩/결정/회고 문서를 루프형으로 연결

## 이번 반영
- `checklists/agent-run-checklist.md` 추가
- `prompts/reference/context-engineering-cards.md` 추가
- `scripts/triage-research-cards.py` 추가

## 다음 반영
- 카드 점수 기반 자동 백로그 생성 (`starter/backlog.md`)
- 상위 패턴 자동 diff 리포트
- low-confidence 자료 자동 필터링
