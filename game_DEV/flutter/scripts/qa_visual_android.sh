#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

APK_PATH="build/app/outputs/flutter-apk/app-debug.apk"
GRADLE_KTS="android/app/build.gradle.kts"
MANIFEST="android/app/src/main/AndroidManifest.xml"
SELFTEST_DEFINE="${SELFTEST:-1}"
SHOP_SELFTEST_DEFINE="${SHOP_SELFTEST:-0}"
AIM_SELFTEST_DEFINE="${AIM_SELFTEST:-1}"
AIM_VISIBILITY_SELFTEST_DEFINE="${AIM_VISIBILITY_SELFTEST:-1}"
PERF_SELFTEST_DEFINE="${PERF_SELFTEST:-1}"
BOSS_SELFTEST_DEFINE="${BOSS_SELFTEST:-1}"
BALL_DEBUG_DEFINE="${BALL_DEBUG:-0}"
LAYOUT_DEBUG_DEFINE="${LAYOUT_DEBUG:-0}"
BOARD_FIT_SELFTEST_DEFINE="${BOARD_FIT_SELFTEST:-0}"
VFX_SELFTEST_DEFINE="${VFX_SELFTEST:-0}"
ACH_SELFTEST_DEFINE="${ACH_SELFTEST:-0}"
SHOP_UI_SELFTEST_DEFINE="${SHOP_UI_SELFTEST:-0}"

if ! command -v adb >/dev/null 2>&1; then
  echo "SKIP: adb not found in PATH."
  exit 0
fi

if [ "$(adb devices | grep -c 'device$')" -lt 1 ]; then
  echo "SKIP: no connected Android device/emulator."
  exit 0
fi

echo "[visual] build debug apk (SELFTEST=$SELFTEST_DEFINE, AIM_SELFTEST=$AIM_SELFTEST_DEFINE, AIM_VISIBILITY_SELFTEST=$AIM_VISIBILITY_SELFTEST_DEFINE, PERF_SELFTEST=$PERF_SELFTEST_DEFINE, BOSS_SELFTEST=$BOSS_SELFTEST_DEFINE, SHOP_SELFTEST=$SHOP_SELFTEST_DEFINE, SHOP_UI_SELFTEST=$SHOP_UI_SELFTEST_DEFINE, BOARD_FIT_SELFTEST=$BOARD_FIT_SELFTEST_DEFINE, VFX_SELFTEST=$VFX_SELFTEST_DEFINE, ACH_SELFTEST=$ACH_SELFTEST_DEFINE, BALL_DEBUG=$BALL_DEBUG_DEFINE, LAYOUT_DEBUG=$LAYOUT_DEBUG_DEFINE)"
flutter build apk --debug \
  "--dart-define=SELFTEST=$SELFTEST_DEFINE" \
  "--dart-define=AIM_SELFTEST=$AIM_SELFTEST_DEFINE" \
  "--dart-define=AIM_VISIBILITY_SELFTEST=$AIM_VISIBILITY_SELFTEST_DEFINE" \
  "--dart-define=PERF_SELFTEST=$PERF_SELFTEST_DEFINE" \
  "--dart-define=BOSS_SELFTEST=$BOSS_SELFTEST_DEFINE" \
  "--dart-define=SHOP_SELFTEST=$SHOP_SELFTEST_DEFINE" \
  "--dart-define=SHOP_UI_SELFTEST=$SHOP_UI_SELFTEST_DEFINE" \
  "--dart-define=BOARD_FIT_SELFTEST=$BOARD_FIT_SELFTEST_DEFINE" \
  "--dart-define=VFX_SELFTEST=$VFX_SELFTEST_DEFINE" \
  "--dart-define=ACH_SELFTEST=$ACH_SELFTEST_DEFINE" \
  "--dart-define=BALL_DEBUG=$BALL_DEBUG_DEFINE" \
  "--dart-define=LAYOUT_DEBUG=$LAYOUT_DEBUG_DEFINE"

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

echo "[visual] install apk: $APK_PATH"
adb install -r "$APK_PATH"

echo "[visual] clear logcat"
adb logcat -c

echo "[visual] launch package: $PACKAGE_ID"
adb shell monkey -p "$PACKAGE_ID" -c android.intent.category.LAUNCHER 1

sleep 12

LOGS="$(adb logcat -d -t 260)"
PATTERNS=("AIM_SELFTEST_FAIL" "AIM_VIS_FAIL" "PERF_FAIL_SEVERE" "BOSS_SELFTEST_FAIL" "SELFTEST_FAIL" "BOARD_FIT_FAIL" "UI_OVERFLOW" "FATAL EXCEPTION" "Missing application ID")
if [ "$SHOP_SELFTEST_DEFINE" = "1" ]; then
  PATTERNS+=("SHOP_SELFTEST_FAIL")
fi
if [ "$SHOP_UI_SELFTEST_DEFINE" = "1" ]; then
  PATTERNS+=("SHOP_UI_SELFTEST_FAIL")
fi
if [ "$VFX_SELFTEST_DEFINE" = "1" ]; then
  PATTERNS+=("VFX_SELFTEST_FAIL")
fi
if [ "$ACH_SELFTEST_DEFINE" = "1" ]; then
  PATTERNS+=("ACH_SELFTEST_FAIL")
fi
for pattern in "${PATTERNS[@]}"; do
  if echo "$LOGS" | grep -F -q "$pattern"; then
    echo "VISUAL QA FAIL: detected pattern '$pattern'"
    echo "$LOGS" | tail -n 140
    exit 1
  fi
done

if [ "$SELFTEST_DEFINE" = "1" ] && ! echo "$LOGS" | grep -F -q "SELFTEST_OK"; then
  echo "VISUAL QA FAIL: missing SELFTEST_OK"
  echo "$LOGS" | tail -n 140
  exit 1
fi
if [ "$AIM_SELFTEST_DEFINE" = "1" ] && ! echo "$LOGS" | grep -F -q "AIM_SELFTEST_OK"; then
  echo "VISUAL QA FAIL: missing AIM_SELFTEST_OK"
  echo "$LOGS" | tail -n 140
  exit 1
fi
if [ "$AIM_VISIBILITY_SELFTEST_DEFINE" = "1" ]; then
  for token in AIM_VIS_OK_IDLE AIM_VIS_OK_DRAG AIM_VIS_OK_END; do
    if ! echo "$LOGS" | grep -F -q "$token"; then
      echo "VISUAL QA FAIL: missing $token"
      echo "$LOGS" | tail -n 140
      exit 1
    fi
  done
fi
if [ "$BOSS_SELFTEST_DEFINE" = "1" ] && ! echo "$LOGS" | grep -F -q "BOSS_SELFTEST_OK"; then
  echo "VISUAL QA FAIL: missing BOSS_SELFTEST_OK"
  echo "$LOGS" | tail -n 140
  exit 1
fi
if [ "$PERF_SELFTEST_DEFINE" = "1" ] && ! echo "$LOGS" | grep -E -q "PERF_OK|PERF_TIMING"; then
  echo "VISUAL QA FAIL: missing PERF_OK/PERF_TIMING"
  echo "$LOGS" | tail -n 140
  exit 1
fi
if [ "$SHOP_SELFTEST_DEFINE" = "1" ] && ! echo "$LOGS" | grep -F -q "SHOP_SELFTEST_OK"; then
  echo "VISUAL QA FAIL: missing SHOP_SELFTEST_OK"
  echo "$LOGS" | tail -n 140
  exit 1
fi
if [ "$SHOP_UI_SELFTEST_DEFINE" = "1" ] && ! echo "$LOGS" | grep -F -q "SHOP_UI_SELFTEST_OK"; then
  echo "VISUAL QA FAIL: missing SHOP_UI_SELFTEST_OK"
  echo "$LOGS" | tail -n 140
  exit 1
fi
if [ "$BOARD_FIT_SELFTEST_DEFINE" = "1" ] && ! echo "$LOGS" | grep -F -q "BOARD_FIT_OK"; then
  echo "VISUAL QA FAIL: missing BOARD_FIT_OK"
  echo "$LOGS" | tail -n 140
  exit 1
fi
if [ "$VFX_SELFTEST_DEFINE" = "1" ] && ! echo "$LOGS" | grep -F -q "VFX_SELFTEST_OK"; then
  echo "VISUAL QA FAIL: missing VFX_SELFTEST_OK"
  echo "$LOGS" | tail -n 140
  exit 1
fi
if [ "$ACH_SELFTEST_DEFINE" = "1" ] && ! echo "$LOGS" | grep -F -q "ACH_SELFTEST_OK"; then
  echo "VISUAL QA FAIL: missing ACH_SELFTEST_OK"
  echo "$LOGS" | tail -n 140
  exit 1
fi

echo "VISUAL QA PASS"
