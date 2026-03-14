#!/usr/bin/env bash
set -euo pipefail

ROOT=${1:-$(pwd)}
cd "$ROOT"

OUT="locales/README.md"
{
  echo "# Locales Index"
  echo
  echo "Generated: $(date '+%Y-%m-%d %H:%M:%S %Z')"
  echo
  for d in locales/*; do
    [[ -d "$d" ]] || continue
    lang=$(basename "$d")
    if [[ -f "$d/README.md" ]]; then
      echo "- $lang: $d/README.md"
    else
      echo "- $lang: (missing README.md)"
    fi
  done
} > "$OUT"

echo "generated: $OUT"
