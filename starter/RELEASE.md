# Starter v1.0 Release Notes

## Summary
`starter/`가 리서치 기반으로 자동 진화하는 바이브 코딩 킷으로 완성됨.

## Highlights
- 설치형 CLI: `vibe-starter`
- 3종 템플릿: webapp / bot / cli
- 품질 게이트: verify + 다층 체크리스트
- 다국어 운영: locale 정책 + 번역 가이드
- 리서치 루프: 수집→분류→백로그→반영 자동화

## Quick Commands
```bash
cd starter
./install.sh
vibe-starter init webapp my-app
bash scripts/refresh-research.sh
python3 scripts/backlog-progress.py
```

## Verification
```bash
bash scripts/verify.sh starter
bash scripts/report.sh starter/starter-report.md
```

## Next
- v1.1: mobile template + dry-run/retry/log-level 옵션
- v1.2: scheduled research run + auto PR draft generation
