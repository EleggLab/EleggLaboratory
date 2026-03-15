#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ -z "${SENTRY_AUTH_TOKEN:-}" ] || [ -z "${SENTRY_ORG:-}" ] || [ -z "${SENTRY_PROJECT:-}" ]; then
  echo "SENTRY UPLOAD SKIP (no token/org/project env)."
  exit 0
fi

release_tag="${1:-$(dart run tool/release_preflight.dart --print-tag-only)}"
if [ -z "$release_tag" ]; then
  echo "ERROR: failed to resolve release tag for symbol upload"
  exit 1
fi

symbols_dir="$ROOT_DIR/build/symbols/$release_tag"
if [ ! -d "$symbols_dir" ]; then
  echo "ERROR: symbols directory not found: $symbols_dir"
  exit 1
fi

if ! command -v sentry-cli >/dev/null 2>&1; then
  echo "ERROR: sentry-cli not found, cannot upload symbols with provided token"
  exit 1
fi

map_file="$symbols_dir/dart_obfuscation_map.json"
if [ -f "$map_file" ]; then
  sentry-cli sourcemaps upload --org "$SENTRY_ORG" --project "$SENTRY_PROJECT" --release "$release_tag" "$map_file"
fi

sentry-cli debug-files upload --org "$SENTRY_ORG" --project "$SENTRY_PROJECT" "$symbols_dir"

echo "SENTRY UPLOAD PASS ($release_tag)"
