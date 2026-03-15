param(
  [switch]$NoPub,
  [switch]$SkipAnalyze,
  [switch]$SkipWidgetTest
)

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$flutterw = Join-Path $PSScriptRoot 'flutterw.ps1'

function Test-SymlinkSupport {
  $tmpRoot = Join-Path $env:TEMP "gamedev_symlink_test_$PID"
  $target = Join-Path $tmpRoot 'target.txt'
  $link = Join-Path $tmpRoot 'link.txt'
  try {
    New-Item -ItemType Directory -Path $tmpRoot -Force | Out-Null
    'ok' | Set-Content -Path $target -Encoding UTF8
    New-Item -ItemType SymbolicLink -Path $link -Target $target -ErrorAction Stop | Out-Null
    return $true
  } catch {
    return $false
  } finally {
    Remove-Item -Path $tmpRoot -Recurse -Force -ErrorAction SilentlyContinue
  }
}

Push-Location $repoRoot
try {
  $runWithoutPub = $NoPub
  if (-not $runWithoutPub) {
    if (-not (Test-SymlinkSupport)) {
      Write-Warning 'Windows Developer Mode (symlink permission) is disabled. Skipping pub get.'
      Write-Host 'Open settings: start ms-settings:developers'
      Write-Host 'Enable Developer Mode, then run this script again for full setup.'
      $runWithoutPub = $true
    } else {
      Write-Host '[1/3] flutter pub get'
      & $flutterw pub get
      if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }
  } else {
    Write-Host '[1/3] flutter pub get (skip: -NoPub)'
  }

  if (-not $SkipAnalyze) {
    Write-Host '[2/3] flutter analyze'
    if ($runWithoutPub) {
      & $flutterw analyze --no-pub --no-fatal-infos --no-fatal-warnings
    } else {
      & $flutterw analyze --no-fatal-infos --no-fatal-warnings
    }
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  } else {
    Write-Host '[2/3] flutter analyze (skip)'
  }

  if (-not $SkipWidgetTest) {
    Write-Host '[3/3] flutter test'
    if ($runWithoutPub) {
      & $flutterw test --no-pub
    } else {
      & $flutterw test
    }
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  } else {
    Write-Host '[3/3] flutter test (skip)'
  }

  Write-Host 'All test steps completed.'
} finally {
  Pop-Location
}
