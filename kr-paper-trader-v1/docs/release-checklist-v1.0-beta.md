# KR Paper Trader v1.0-beta Release Checklist

## 1) CI Green 증빙
- [ ] Backend tests 전체 통과
- [ ] 핵심 시나리오(20/20) 테스트 포함 확인
- [ ] 테스트 로그/요약 아티팩트 보관

권장 실행:
```bash
bash scripts/run-tests.sh
```

## 2) Soak 리포트
- [ ] soak smoke 실행
- [ ] orders/fills/asset/cash 지표 기록
- [ ] 오류/예외 발생 여부 기록

권장 실행:
```bash
python3 scripts/soak-smoke.py > docs/soak-report-latest.json
```

## 3) Readiness 리포트 갱신
- [ ] readiness-report.md 갱신
- [ ] production_ready 판정 근거 주석 추가

권장 실행:
```bash
python3 scripts/generate-readiness-report.py
```

## 4) 운영 승인 게이트
- [ ] paper-only 정책 재확인 (live endpoint 없음)
- [ ] AI 승인 경계 점검 (pending만 approve)
- [ ] 역할 경계(admin/trader) 점검
- [ ] 복구(state snapshot) 리허설 1회

## 5) 릴리즈 메타
- [ ] CHANGELOG 업데이트
- [ ] RELEASE 노트 확정
- [ ] git tag 생성 (`kr-paper-trader-v1.0.0-beta`)
