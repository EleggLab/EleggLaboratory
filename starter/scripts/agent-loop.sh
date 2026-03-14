#!/usr/bin/env bash
set -euo pipefail

# Lightweight loop runner for starter projects
# Usage: ./agent-loop.sh "task summary"

TASK=${1:-"default task"}
ROOT=${2:-$(pwd)}

cd "$ROOT"

echo "[loop] task: $TASK"
echo "[loop] 1) plan"
echo "- define scope/done"
echo "[loop] 2) act"
echo "- implement minimal diff"
echo "[loop] 3) verify"
bash starter/scripts/verify.sh starter 2>/dev/null || true
echo "[loop] 4) report"
bash starter/scripts/report.sh starter/starter-report.md 2>/dev/null || true
echo "[loop] done"
