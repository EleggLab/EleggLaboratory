#!/usr/bin/env bash
set -euo pipefail

echo "[verify] basic checks"
[ -f README.md ] || { echo "README.md missing"; exit 1; }
[ -f .env.example ] || { echo ".env.example missing"; exit 1; }
[ -d src ] || { echo "src/ missing"; exit 1; }
[ -d tests ] || { echo "tests/ missing"; exit 1; }

echo "[verify] done"
