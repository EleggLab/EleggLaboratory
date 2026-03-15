@echo off
setlocal
cd /d "%~dp0"
echo [SAJU] Starting @saju/mobile on http://localhost:8082
corepack pnpm --filter @saju/mobile start -- --web --port 8082 -c
