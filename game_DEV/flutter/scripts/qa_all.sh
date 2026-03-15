#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[qa_all] run base QA"
./scripts/qa.sh

echo "[qa_all] build appbundle --debug"
flutter build appbundle --debug

echo "[qa_all] run android smoke QA"
./scripts/qa_smoke_android.sh

echo "[qa_all] run android visual QA"
./scripts/qa_visual_android.sh

echo "[qa_all] run release QA gate"
./scripts/qa_release.sh

echo "QA ALL PASS"
