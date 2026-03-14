#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/sml/.openclaw/workspace"
cd "$ROOT"

python3 starter/scripts/research-github.py
python3 starter/scripts/research-github-deep.py
python3 starter/scripts/triage-research-cards.py
python3 starter/scripts/apply-adoption-batch.py

bash starter/scripts/report.sh starter/starter-report.md

echo "research refresh complete"
