# QA Regression Report

- Started (UTC): 2026-02-22T11:17:02.236Z
- Finished (UTC): 2026-02-22T11:17:02.421Z
- Iteration baseline: 10 repeats per action
- Result: PASS

| Check | Status | Details |
| - | - | - |
| Core deterministic pillars | PASS | 3 cases x 10 repeats |
| Core year/month luck variation | PASS | year unique=10, month unique=10 |
| Core compare repeat | PASS | 10 repeats |
| Route /api/saju | PASS | 10 valid + 1 invalid |
| Route /api/year-luck | PASS | 10 valid + 1 invalid |
| Route /api/month-luck | PASS | 10 valid + 1 invalid, unique pillars=10 |
| Route /api/compare | PASS | 10 valid + 1 invalid |
| Tarot deck / shuffle / spread | PASS | deterministic draw 10 repeats + shuffle 10 repeats |
| Chart object smoke | PASS | 10 repeats |
| Saju QnA year/month variation | PASS | domains=9, month variants=10, year variants=10 |
| Tarot KST date key | PASS | 10 deterministic repeats + boundary checks |

## Scope
- Core computation determinism
- Year/Month luck calculation variation
- Compare chart result shape
- Next Route Handler integration (/api/saju, /api/year-luck, /api/month-luck, /api/compare)
- Tarot deck integrity, deterministic draw, shuffle stability
- Saju QnA domain coverage and year/month variation
- Tarot KST date-key boundary consistency
