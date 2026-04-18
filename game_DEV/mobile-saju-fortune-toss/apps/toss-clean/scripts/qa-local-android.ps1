param(
  [string]$DeviceId = "",
  [string]$PackageName = "viva.republica.toss",
  [switch]$SkipReverse
)

$ErrorActionPreference = "Stop"

$adb = "C:\Users\rndhr\AppData\Local\Android\Sdk\platform-tools\adb.exe"

if (-not (Test-Path $adb)) {
  throw "adb not found at $adb"
}

function Invoke-Adb {
  param([string[]]$AdbArgs)

  if ($DeviceId) {
    & $adb -s $DeviceId @AdbArgs
  } else {
    & $adb @AdbArgs
  }
}

if (-not $SkipReverse) {
  Write-Host "Setting adb reverse for 8081 and 5173..."
  Invoke-Adb -AdbArgs @("reverse", "tcp:8081", "tcp:8081") | Out-Null
  Invoke-Adb -AdbArgs @("reverse", "tcp:5173", "tcp:5173") | Out-Null
}

Write-Host "Clearing logcat buffer..."
Invoke-Adb -AdbArgs @("logcat", "-c") | Out-Null

Write-Host "Launching intoss://astra with package $PackageName ..."
Invoke-Adb -AdbArgs @(
  "shell",
  "am",
  "start",
  "-W",
  "-a",
  "android.intent.action.VIEW",
  "-d",
  "intoss://astra",
  $PackageName
)

Write-Host ""
Write-Host "Done. If chooser appears on device, select 토스, not MiniApp."
