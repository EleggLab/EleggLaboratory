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
  $selfTestDefine = if ([string]::IsNullOrWhiteSpace($env:SELFTEST)) { '1' } else { $env:SELFTEST }
  $shopSelfTestDefine = if ([string]::IsNullOrWhiteSpace($env:SHOP_SELFTEST)) { '0' } else { $env:SHOP_SELFTEST }
  $aimSelfTestDefine = if ([string]::IsNullOrWhiteSpace($env:AIM_SELFTEST)) { '1' } else { $env:AIM_SELFTEST }
  $aimVisibilitySelfTestDefine = if ([string]::IsNullOrWhiteSpace($env:AIM_VISIBILITY_SELFTEST)) { '1' } else { $env:AIM_VISIBILITY_SELFTEST }
  $perfSelfTestDefine = if ([string]::IsNullOrWhiteSpace($env:PERF_SELFTEST)) { '1' } else { $env:PERF_SELFTEST }
  $bossSelfTestDefine = if ([string]::IsNullOrWhiteSpace($env:BOSS_SELFTEST)) { '1' } else { $env:BOSS_SELFTEST }
  $ballDebugDefine = if ([string]::IsNullOrWhiteSpace($env:BALL_DEBUG)) { '0' } else { $env:BALL_DEBUG }
  $layoutDebugDefine = if ([string]::IsNullOrWhiteSpace($env:LAYOUT_DEBUG)) { '0' } else { $env:LAYOUT_DEBUG }
  $boardFitSelfTestDefine = if ([string]::IsNullOrWhiteSpace($env:BOARD_FIT_SELFTEST)) { '0' } else { $env:BOARD_FIT_SELFTEST }
  $vfxSelfTestDefine = if ([string]::IsNullOrWhiteSpace($env:VFX_SELFTEST)) { '0' } else { $env:VFX_SELFTEST }
  $achSelfTestDefine = if ([string]::IsNullOrWhiteSpace($env:ACH_SELFTEST)) { '0' } else { $env:ACH_SELFTEST }
  $shopUiSelfTestDefine = if ([string]::IsNullOrWhiteSpace($env:SHOP_UI_SELFTEST)) { '0' } else { $env:SHOP_UI_SELFTEST }

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

  Write-Host "[visual] build debug apk (SELFTEST=$selfTestDefine, AIM_SELFTEST=$aimSelfTestDefine, AIM_VISIBILITY_SELFTEST=$aimVisibilitySelfTestDefine, PERF_SELFTEST=$perfSelfTestDefine, BOSS_SELFTEST=$bossSelfTestDefine, SHOP_SELFTEST=$shopSelfTestDefine, SHOP_UI_SELFTEST=$shopUiSelfTestDefine, BOARD_FIT_SELFTEST=$boardFitSelfTestDefine, VFX_SELFTEST=$vfxSelfTestDefine, ACH_SELFTEST=$achSelfTestDefine, BALL_DEBUG=$ballDebugDefine, LAYOUT_DEBUG=$layoutDebugDefine)"
  & $flutterw build apk --debug "--dart-define=SELFTEST=$selfTestDefine" "--dart-define=AIM_SELFTEST=$aimSelfTestDefine" "--dart-define=AIM_VISIBILITY_SELFTEST=$aimVisibilitySelfTestDefine" "--dart-define=PERF_SELFTEST=$perfSelfTestDefine" "--dart-define=BOSS_SELFTEST=$bossSelfTestDefine" "--dart-define=SHOP_SELFTEST=$shopSelfTestDefine" "--dart-define=SHOP_UI_SELFTEST=$shopUiSelfTestDefine" "--dart-define=BOARD_FIT_SELFTEST=$boardFitSelfTestDefine" "--dart-define=VFX_SELFTEST=$vfxSelfTestDefine" "--dart-define=ACH_SELFTEST=$achSelfTestDefine" "--dart-define=BALL_DEBUG=$ballDebugDefine" "--dart-define=LAYOUT_DEBUG=$layoutDebugDefine"
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  $packageId = Resolve-PackageId
  if ([string]::IsNullOrWhiteSpace($packageId)) {
    throw 'Unable to resolve Android applicationId.'
  }

  Write-Host "[visual] install apk: $apkPath"
  & $adbPath install -r $apkPath | Out-Host
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Write-Host '[visual] clear logcat'
  & $adbPath logcat -c | Out-Null

  Write-Host "[visual] launch package: $packageId"
  & $adbPath shell monkey -p $packageId -c android.intent.category.LAUNCHER 1 | Out-Host
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Start-Sleep -Seconds 12

  $logs = & $adbPath logcat -d -t 260
  $patterns = @(
    'AIM_SELFTEST_FAIL',
    'AIM_VIS_FAIL',
    'PERF_FAIL_SEVERE',
    'BOSS_SELFTEST_FAIL',
    'SELFTEST_FAIL',
    'BOARD_FIT_FAIL',
    'UI_OVERFLOW',
    'FATAL EXCEPTION',
    'Missing application ID'
  )
  if ($shopSelfTestDefine -eq '1') {
    $patterns += 'SHOP_SELFTEST_FAIL'
  }
  if ($shopUiSelfTestDefine -eq '1') {
    $patterns += 'SHOP_UI_SELFTEST_FAIL'
  }
  if ($vfxSelfTestDefine -eq '1') {
    $patterns += 'VFX_SELFTEST_FAIL'
  }
  if ($achSelfTestDefine -eq '1') {
    $patterns += 'ACH_SELFTEST_FAIL'
  }
  $matched = @()
  foreach ($p in $patterns) {
    if ($logs -match [regex]::Escape($p)) {
      $matched += $p
    }
  }

  if ($matched.Count -gt 0) {
    Write-Error ("VISUAL QA FAIL: detected patterns -> " + ($matched -join ', '))
    $logs | Select-Object -Last 140 | Out-Host
    exit 1
  }

  $requiredOk = @()
  if ($selfTestDefine -eq '1') {
    $requiredOk += 'SELFTEST_OK'
  }
  if ($aimSelfTestDefine -eq '1') {
    $requiredOk += 'AIM_SELFTEST_OK'
  }
  if ($aimVisibilitySelfTestDefine -eq '1') {
    $requiredOk += 'AIM_VIS_OK_IDLE'
    $requiredOk += 'AIM_VIS_OK_DRAG'
    $requiredOk += 'AIM_VIS_OK_END'
  }
  if ($bossSelfTestDefine -eq '1') {
    $requiredOk += 'BOSS_SELFTEST_OK'
  }
  if ($shopSelfTestDefine -eq '1') {
    $requiredOk += 'SHOP_SELFTEST_OK'
  }
  if ($shopUiSelfTestDefine -eq '1') {
    $requiredOk += 'SHOP_UI_SELFTEST_OK'
  }
  if ($boardFitSelfTestDefine -eq '1') {
    $requiredOk += 'BOARD_FIT_OK'
  }
  if ($vfxSelfTestDefine -eq '1') {
    $requiredOk += 'VFX_SELFTEST_OK'
  }
  if ($achSelfTestDefine -eq '1') {
    $requiredOk += 'ACH_SELFTEST_OK'
  }

  $missingOk = @()
  foreach ($ok in $requiredOk) {
    if (-not ($logs -match [regex]::Escape($ok))) {
      $missingOk += $ok
    }
  }
  if ($missingOk.Count -gt 0) {
    Write-Error ("VISUAL QA FAIL: missing success logs -> " + ($missingOk -join ', '))
    $logs | Select-Object -Last 140 | Out-Host
    exit 1
  }

  if ($perfSelfTestDefine -eq '1') {
    $hasPerfOk = ($logs -match [regex]::Escape('PERF_OK'))
    $hasPerfTiming = ($logs -match [regex]::Escape('PERF_TIMING'))
    if (-not ($hasPerfOk -or $hasPerfTiming)) {
      Write-Error 'VISUAL QA FAIL: missing PERF_OK/PERF_TIMING log'
      $logs | Select-Object -Last 140 | Out-Host
      exit 1
    }
  }

  Write-Host 'VISUAL QA PASS'
} finally {
  Pop-Location
}
