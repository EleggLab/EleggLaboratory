@echo off
setlocal

set "PROJECT_SLUG=%~1"
set "WORKLOG_URL=http://127.0.0.1:4173"

if not "%PROJECT_SLUG%"=="" (
  set "WORKLOG_URL=%WORKLOG_URL%/?project=%PROJECT_SLUG%"
)

start "worklog-dev" cmd /k "cd /d %~dp0 && corepack pnpm dev:worklog"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$deadline = (Get-Date).AddSeconds(45);" ^
  "while ((Get-Date) -lt $deadline) {" ^
  "  try {" ^
  "    $response = Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:4173' -TimeoutSec 2;" ^
  "    if ($response.StatusCode -ge 200) { Start-Process '%WORKLOG_URL%'; exit 0 }" ^
  "  } catch {}" ^
  "  Start-Sleep -Milliseconds 750" ^
  "}" ^
  "Start-Process '%WORKLOG_URL%'; exit 0"
