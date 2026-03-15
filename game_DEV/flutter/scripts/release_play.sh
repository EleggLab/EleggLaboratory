#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

KEY_PROPS="android/key.properties"
if [ ! -f "$KEY_PROPS" ]; then
  echo "ERROR: missing android/key.properties. Play release build requires signing config."
  echo "Copy android/key.properties.example -> android/key.properties and fill values."
  exit 1
fi

read_prop() {
  local key="$1"
  grep -E "^${key}=" "$KEY_PROPS" | tail -n 1 | cut -d'=' -f2- | tr -d '\r'
}

store_file="$(read_prop storeFile || true)"
store_password="$(read_prop storePassword || true)"
key_alias="$(read_prop keyAlias || true)"
key_password="$(read_prop keyPassword || true)"

if [ -z "$store_file" ] || [ -z "$store_password" ] || [ -z "$key_alias" ] || [ -z "$key_password" ]; then
  echo "ERROR: android/key.properties missing required signing values."
  exit 1
fi

if [[ "$store_file" = /* ]]; then
  resolved_store="$store_file"
else
  resolved_store="$ROOT_DIR/android/$store_file"
fi

if [ ! -f "$resolved_store" ]; then
  echo "ERROR: keystore file not found: $resolved_store"
  exit 1
fi

./scripts/preflight_release.sh

echo "[release_play] flutter pub get"
flutter pub get

release_tag="${1:-}"
if [ -z "$release_tag" ]; then
  release_tag="$(dart run tool/release_preflight.dart --print-tag-only)"
fi
if [ -z "$release_tag" ]; then
  echo "ERROR: failed to derive release tag from pubspec version"
  exit 1
fi

symbols_dir="$ROOT_DIR/build/symbols/$release_tag"
mkdir -p "$symbols_dir"

echo "[release_play] build appbundle --release (obfuscate)"
flutter build appbundle --release --obfuscate \
  --split-debug-info="$symbols_dir" \
  --extra-gen-snapshot-options="--save-obfuscation-map=$symbols_dir/dart_obfuscation_map.json"

echo "[release_play] build apk --release --split-per-abi (obfuscate)"
flutter build apk --release --split-per-abi --obfuscate \
  --split-debug-info="$symbols_dir" \
  --extra-gen-snapshot-options="--save-obfuscation-map=$symbols_dir/dart_obfuscation_map.json"

echo "[release_play] symbols dir: $symbols_dir"
echo "[release_play] appbundle: build/app/outputs/bundle/release/app-release.aab"
echo "[release_play] split apks: build/app/outputs/flutter-apk/"

./scripts/sentry_upload_symbols.sh "$release_tag"

echo "[release_play] PASS"
