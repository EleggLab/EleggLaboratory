#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=${1:-$(pwd)}
cd "$ROOT_DIR"

echo "[verify] root: $ROOT_DIR"

required_files=(
  "README.md"
  "prompts/system.base.md"
  "prompts/task.template.md"
  "checklists/release-checklist.md"
)

for f in "${required_files[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "[verify][fail] missing file: $f"
    exit 1
  fi
done

required_dirs=("locales/ko" "locales/en" "scripts")
for d in "${required_dirs[@]}"; do
  if [[ ! -d "$d" ]]; then
    echo "[verify][fail] missing dir: $d"
    exit 1
  fi
done

echo "[verify][ok] template structure looks good"
