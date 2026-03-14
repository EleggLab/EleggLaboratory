#!/usr/bin/env bash
set -euo pipefail

STACK=${1:-webapp}
NAME=${2:-my-app}
TARGET=${3:-$(pwd)/$NAME}

TEMPLATE_DIR="$(cd "$(dirname "$0")/.." && pwd)/templates/$STACK"
if [[ ! -d "$TEMPLATE_DIR" ]]; then
  echo "unknown stack: $STACK (use: webapp|bot|cli)"
  exit 1
fi

mkdir -p "$TARGET"
cp -R "$TEMPLATE_DIR"/. "$TARGET"/

if [[ -f "$TARGET/README.md" ]]; then
  sed -i "s/{{PROJECT_NAME}}/$NAME/g" "$TARGET/README.md"
fi

echo "initialized: $TARGET (stack=$STACK)"
