#!/usr/bin/env bash
set -euo pipefail

OUT=${1:-research/mcp-discovery.md}
mkdir -p "$(dirname "$OUT")"

cat > "$OUT" <<'EOF'
# MCP Discovery Notes

## Candidate Servers
- filesystem
- github
- browser/playwright
- database

## Evaluation Rubric
- 설치 난이도
- 인증/보안 요구사항
- starter 적용 포인트 (prompts/scripts/checklists/docs)
- 운영 안정성

## Next Actions
- 상위 3개 서버 PoC
- 실패/제약사항 기록
EOF

echo "written: $OUT"
