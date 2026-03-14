#!/usr/bin/env bash
set -euo pipefail

echo "# Change Report"
echo
echo "## Branch"
git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "(no git repo)"
echo
echo "## Changed Files"
git status --short 2>/dev/null || echo "(no git repo)"
echo
echo "## Last Commit"
git log -1 --pretty=format:'%h %s (%an, %ar)' 2>/dev/null || echo "(no commit yet)"
