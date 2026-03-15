#!/usr/bin/env bash
set -euo pipefail

SOURCE="${1:-content/story_tree.json}"
TARGET="${2:-project/game/ugc/story_tree.json}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "$ROOT_DIR"

echo "[pipeline] validate tree"
python tools/validate_tree.py "$SOURCE"

echo "[pipeline] build runtime json"
python tools/build_renpy_story.py --source "$SOURCE" --target "$TARGET"

echo "[pipeline] done"
