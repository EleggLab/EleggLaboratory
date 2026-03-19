#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "[1/3] backend tests + readiness report"
if python3 -m pytest --version >/dev/null 2>&1; then
  bash scripts/run-tests.sh
else
  echo "pytest not available in this runtime. skip local tests (CI workflow will run)."
  python3 scripts/generate-readiness-report.py || true
fi

echo "[2/3] soak smoke"
python3 scripts/soak-smoke.py > docs/soak-report-latest.json || true

echo "[3/3] readiness report refresh"
python3 scripts/generate-readiness-report.py || true

echo "done: review docs/release-checklist-v1.0-beta.md"
