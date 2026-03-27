@echo off
setlocal
cd /d "%~dp0"
echo [SAJU] Starting @saju/web on http://localhost:3100
corepack pnpm --filter @saju/web exec next dev -H 0.0.0.0 -p 3100
