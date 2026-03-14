#!/usr/bin/env bash
set -euo pipefail

OUT=${1:-report.md}

{
  echo "# Starter Change Report"
  echo
  echo "Generated: $(date '+%Y-%m-%d %H:%M:%S %Z')"
  echo
  echo "## Git Status"
  git status --short 2>/dev/null || echo "(no git status available)"
  echo
  echo "## Last Commit"
  git log -1 --pretty=format:'- %h %s (%an, %ar)' 2>/dev/null || echo "(no commit yet)"
  echo
  echo "## Key Files"
  find starter -maxdepth 3 -type f | sort
} > "$OUT"

echo "report written: $OUT"
