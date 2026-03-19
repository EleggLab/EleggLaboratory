#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "[1/3] backend tests + readiness report"
bash scripts/run-tests.sh || true

echo "[2/3] soak smoke"
python3 scripts/soak-smoke.py > docs/soak-report-latest.json || true

echo "[3/3] readiness report refresh"
python3 scripts/generate-readiness-report.py || true

echo "done: review docs/release-checklist-v1.0-beta.md"
