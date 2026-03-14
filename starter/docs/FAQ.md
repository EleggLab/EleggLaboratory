# FAQ

## Q1. 어디서 시작하나?
- `starter/README.md`의 Quick Start부터 시작.

## Q2. 리서치 루프는 어떻게 돌리나?
- `bash starter/scripts/refresh-research.sh`

## Q3. 반영 우선순위는?
- `starter/backlog.md` 상위 점수 항목부터 작은 커밋 단위로.

## Q4. 품질 검증은?
- `bash starter/scripts/verify.sh starter`
- `bash starter/scripts/report.sh starter/starter-report.md`

## Q5. 실패하면?
- 변경 커밋 롤백 후, `docs/postmortem.template.md`로 원인 기록.
