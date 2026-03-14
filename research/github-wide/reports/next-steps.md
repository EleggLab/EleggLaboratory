# Next Steps (Continuous GitHub Research)

## Goal
- 관련 GitHub 자료를 가능한 넓게 커버하면서 starter에 반영 가능한 패턴을 계속 추출.

## Execution Loop
1. `starter/scripts/research-github-deep.py` 실행
2. `research/github-wide/raw/github-repos-deep.json` 누적
3. `research/github-wide/reports/github-wide-top200.md` 갱신
4. 상위 리포에서 starter 반영 포인트 카드화

## Notes
- 인증 없이 GitHub Search API는 금방 403(rate limit) 발생 가능
- `GITHUB_TOKEN` 설정 시 커버리지/안정성 상승
- 키워드×stars 구간×정렬(stars/updated) 샤딩으로 반복 수집

## Mapping to Starter
- prompts/ : 프롬프트 패턴
- scripts/ : 자동화 스크립트 패턴
- checklists/ : 품질/보안 체크 패턴
- docs/ : 운영/온보딩 문서 패턴
