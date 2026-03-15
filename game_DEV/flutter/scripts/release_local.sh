#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

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
  echo "WARN: no valid android/key.properties + keystore. Skip Play release signing build."
  echo "[release_local] building debug artifacts instead"
  flutter build apk --debug
  flutter build appbundle --debug
  echo "Checklist: configure keystore to run scripts/release_play.sh"
  exit 0
fi

./scripts/preflight_release.sh

echo "[release_local] flutter pub get"
flutter pub get

release_tag="${1:-$(dart run tool/release_preflight.dart --print-tag-only)}"
if [ -z "$release_tag" ]; then
  echo "ERROR: failed to derive release tag from pubspec version"
  exit 1
fi

symbols_dir="$ROOT_DIR/build/symbols/$release_tag"
mkdir -p "$symbols_dir"

echo "[release_local] build appbundle --release (obfuscate)"
flutter build appbundle --release --obfuscate \
  --split-debug-info="$symbols_dir" \
  --extra-gen-snapshot-options="--save-obfuscation-map=$symbols_dir/dart_obfuscation_map.json"

echo "[release_local] build apk --release --split-per-abi (obfuscate)"
flutter build apk --release --split-per-abi --obfuscate \
  --split-debug-info="$symbols_dir" \
  --extra-gen-snapshot-options="--save-obfuscation-map=$symbols_dir/dart_obfuscation_map.json"
