@echo off
setlocal
cd /d "%~dp0"
set CI=1
set EXPO_OFFLINE=1
set EXPO_NO_DEPENDENCY_VALIDATION=1
echo [SAJU] Starting 10-pass copy @saju/mobile on http://localhost:8082
corepack pnpm --filter @saju/mobile exec expo start --port 8082 --host localhost --max-workers 0
