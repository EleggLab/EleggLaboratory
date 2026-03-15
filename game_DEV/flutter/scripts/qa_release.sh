#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[1/7] flutter pub get"
flutter pub get

echo "[2/7] dart format --set-exit-if-changed ."
dart format --set-exit-if-changed .

echo "[3/7] flutter analyze"
flutter analyze

echo "[4/7] flutter test"
flutter test

echo "[5/7] flutter build appbundle --debug"
flutter build appbundle --debug

echo "[6/7] flutter build apk --debug"
flutter build apk --debug

KEY_PROPS="android/key.properties"
has_signing=0
if [ -f "$KEY_PROPS" ]; then
  read_prop() {
    local key="$1"
    grep -E "^${key}=" "$KEY_PROPS" | tail -n 1 | cut -d'=' -f2- | tr -d '\r'
  }

  store_file="$(read_prop storeFile || true)"
  store_password="$(read_prop storePassword || true)"
  key_alias="$(read_prop keyAlias || true)"
  key_password="$(read_prop keyPassword || true)"

  if [ -n "$store_file" ] && [ -n "$store_password" ] && [ -n "$key_alias" ] && [ -n "$key_password" ]; then
    if [[ "$store_file" = /* ]]; then
      resolved_store="$store_file"
    else
      resolved_store="$ROOT_DIR/android/$store_file"
    fi
    if [ -f "$resolved_store" ]; then
      has_signing=1
    fi
  fi
fi

if [ "$has_signing" -ne 1 ]; then
  echo "WARNING: RELEASE SKIP (no signing): android/key.properties or keystore file is missing/incomplete."
  echo "QA RELEASE PASS"
  exit 0
fi

echo "[7/7] release builds with obfuscation + symbols"
./scripts/preflight_release.sh

release_tag="$(dart run tool/release_preflight.dart --print-tag-only)"
if [ -z "$release_tag" ]; then
  echo "ERROR: failed to resolve release tag from pubspec version"
  exit 1
fi

symbols_dir="$ROOT_DIR/build/symbols/$release_tag"
mkdir -p "$symbols_dir"

flutter build appbundle --release --obfuscate \
  --split-debug-info="$symbols_dir" \
  --extra-gen-snapshot-options="--save-obfuscation-map=$symbols_dir/dart_obfuscation_map.json"

flutter build apk --release --split-per-abi --obfuscate \
  --split-debug-info="$symbols_dir" \
  --extra-gen-snapshot-options="--save-obfuscation-map=$symbols_dir/dart_obfuscation_map.json"

echo "[qa_release] symbols: $symbols_dir"
echo "QA RELEASE PASS"
