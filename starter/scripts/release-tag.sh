#!/usr/bin/env bash
set -euo pipefail
VER=${1:-}
[[ -n "$VER" ]] || { echo "usage: $0 vX.Y.Z"; exit 1; }
git tag -a "$VER" -m "release $VER"
git show "$VER" --no-patch
