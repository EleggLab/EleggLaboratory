#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

APK_PATH="build/app/outputs/flutter-apk/app-debug.apk"
GRADLE_KTS="android/app/build.gradle.kts"
MANIFEST="android/app/src/main/AndroidManifest.xml"

if ! command -v adb >/dev/null 2>&1; then
  echo "SKIP: adb not found in PATH."
  exit 0
fi

if [ "$(adb devices | grep -c 'device$')" -lt 1 ]; then
  echo "SKIP: no connected Android device/emulator."
  exit 0
fi

if [ ! -f "$APK_PATH" ]; then
  echo "[smoke] build debug apk"
  flutter build apk --debug
fi

PACKAGE_ID=""
if [ -f "$GRADLE_KTS" ]; then
  PACKAGE_ID="$(sed -n 's/.*applicationId[[:space:]]*=[[:space:]]*"\([^"]*\)".*/\1/p' "$GRADLE_KTS" | head -n1)"
fi
if [ -z "$PACKAGE_ID" ] && [ -f "$MANIFEST" ]; then
  PACKAGE_ID="$(sed -n 's/.*package="\([^"]*\)".*/\1/p' "$MANIFEST" | head -n1)"
fi
if [ -z "$PACKAGE_ID" ]; then
  echo "FAIL: unable to resolve package id"
  exit 1
fi

echo "[smoke] install apk: $APK_PATH"
adb install -r "$APK_PATH"

echo "[smoke] launch package: $PACKAGE_ID"
adb shell monkey -p "$PACKAGE_ID" -c android.intent.category.LAUNCHER 1

sleep 12

LOGS="$(adb logcat -d -t 220)"
for pattern in "FATAL EXCEPTION" "Missing application ID" "E/flutter" "SIGSEGV" "ANR"; do
  if echo "$LOGS" | grep -F -q "$pattern"; then
    echo "SMOKE FAIL: detected pattern '$pattern'"
    echo "$LOGS" | tail -n 120
    exit 1
  fi
done

echo "SMOKE PASS"
