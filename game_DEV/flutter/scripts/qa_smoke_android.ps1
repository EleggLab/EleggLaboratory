param()

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$flutterw = Join-Path $PSScriptRoot 'flutterw.ps1'
$apkPath = Join-Path $repoRoot 'build\app\outputs\flutter-apk\app-debug.apk'
$gradleKts = Join-Path $repoRoot 'android\app\build.gradle.kts'
$manifestPath = Join-Path $repoRoot 'android\app\src\main\AndroidManifest.xml'

function Resolve-Adb {
  $adb = Get-Command adb -ErrorAction SilentlyContinue
  if ($adb) { return $adb.Source }
  return $null
}

function Resolve-PackageId {
  if (Test-Path $gradleKts) {
    $content = Get-Content $gradleKts -Raw
    $m = [regex]::Match($content, 'applicationId\s*=\s*"([^"]+)"')
    if ($m.Success) { return $m.Groups[1].Value }
  }
  if (Test-Path $manifestPath) {
    $content = Get-Content $manifestPath -Raw
    $m = [regex]::Match($content, 'package\s*=\s*"([^"]+)"')
    if ($m.Success) { return $m.Groups[1].Value }
  }
  return ''
}

Push-Location $repoRoot
try {
  $adbPath = Resolve-Adb
  if (-not $adbPath) {
    Write-Warning 'SKIP: adb not found in PATH.'
    exit 0
  }

  $deviceList = & $adbPath devices
  $online = ($deviceList | Select-String "device$").Count
  if ($online -lt 1) {
    Write-Warning 'SKIP: no connected Android device/emulator.'
    exit 0
  }

  if (-not (Test-Path $apkPath)) {
    Write-Host '[smoke] build debug apk'
    & $flutterw build apk --debug
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  }

  $packageId = Resolve-PackageId
  if ([string]::IsNullOrWhiteSpace($packageId)) {
    throw 'Unable to resolve Android applicationId.'
  }

  Write-Host "[smoke] install apk: $apkPath"
  & $adbPath install -r $apkPath | Out-Host
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Write-Host "[smoke] launch package: $packageId"
  & $adbPath shell monkey -p $packageId -c android.intent.category.LAUNCHER 1 | Out-Host
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Start-Sleep -Seconds 12

  $logs = & $adbPath logcat -d -t 220
  $patterns = @(
    'FATAL EXCEPTION',
    'Missing application ID',
    'E/flutter',
    'SIGSEGV',
    'ANR'
  )
  $matched = @()
  foreach ($p in $patterns) {
    if ($logs -match [regex]::Escape($p)) {
      $matched += $p
    }
  }

  if ($matched.Count -gt 0) {
    Write-Error ("Smoke FAIL: detected patterns -> " + ($matched -join ', '))
    $logs | Select-Object -Last 120 | Out-Host
    exit 1
  }

  Write-Host 'SMOKE PASS'
} finally {
  Pop-Location
}
