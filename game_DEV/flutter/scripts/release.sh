#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[1/4] flutter pub get"
flutter pub get

echo "[2/4] flutter build appbundle"
flutter build appbundle

echo "[3/4] flutter build apk --split-per-abi"
flutter build apk --split-per-abi

echo "[4/4] optional obfuscated split build"
if ! flutter build apk --release --split-per-abi --obfuscate --split-debug-info=build/symbols; then
  echo "WARN: obfuscated build failed. Check your local toolchain/config."
fi

echo ""
echo "Release build completed."
echo "Signing checklist before Play upload:"
echo "1) Ensure android/key.properties and keystore are configured."
echo "2) Verify package name, versionCode/versionName."
echo "3) Replace test AdMob IDs with production IDs as needed."
