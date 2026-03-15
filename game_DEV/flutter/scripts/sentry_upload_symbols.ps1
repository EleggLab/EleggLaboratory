param(
  [string]$ReleaseTag = ''
)

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$flutterBat = $null
if ($env:FLUTTER_ROOT) {
  $candidate = Join-Path $env:FLUTTER_ROOT 'bin\flutter.bat'
  if (Test-Path $candidate) { $flutterBat = $candidate }
}
if ($null -eq $flutterBat) {
  $localProps = Join-Path $repoRoot 'android\local.properties'
  if (Test-Path $localProps) {
    $line = Select-String -Path $localProps -Pattern '^flutter\.sdk=' | Select-Object -First 1
    if ($line) {
      $raw = ($line.Line -replace '^flutter\.sdk=', '').Trim()
      if ($raw) {
        $sdkPath = $raw -replace '\\\\', '\'
        $candidate = Join-Path $sdkPath 'bin\flutter.bat'
        if (Test-Path $candidate) { $flutterBat = $candidate }
      }
    }
  }
}
if ($null -eq $flutterBat) {
  $candidate = 'C:\Users\rndhr\flutter\bin\flutter.bat'
  if (Test-Path $candidate) { $flutterBat = $candidate }
}
if ($null -eq $flutterBat) {
  throw 'flutter.bat not found. Set FLUTTER_ROOT or android/local.properties flutter.sdk.'
}
$flutterBinDir = Split-Path $flutterBat
$dartExe = Join-Path $flutterBinDir 'cache\dart-sdk\bin\dart.exe'
if (-not (Test-Path $dartExe)) {
  throw "dart executable not found: $dartExe"
}

$token = ($env:SENTRY_AUTH_TOKEN ?? '').Trim()
$org = ($env:SENTRY_ORG ?? '').Trim()
$project = ($env:SENTRY_PROJECT ?? '').Trim()

if ([string]::IsNullOrWhiteSpace($token) -or [string]::IsNullOrWhiteSpace($org) -or [string]::IsNullOrWhiteSpace($project)) {
  Write-Host 'SENTRY UPLOAD SKIP (no token/org/project env).'
  exit 0
}

Push-Location $repoRoot
try {
  if ([string]::IsNullOrWhiteSpace($ReleaseTag)) {
    $ReleaseTag = (& $dartExe run tool/release_preflight.dart --print-tag-only).Trim()
  }
  if ([string]::IsNullOrWhiteSpace($ReleaseTag)) {
    Write-Error 'Failed to resolve release tag for symbol upload.'
    exit 1
  }

  $symbolsDir = Join-Path $repoRoot "build\symbols\$ReleaseTag"
  if (-not (Test-Path $symbolsDir)) {
    Write-Error "Symbols directory not found: $symbolsDir"
    exit 1
  }

  $sentryCli = Get-Command sentry-cli -ErrorAction SilentlyContinue
  if ($null -eq $sentryCli) {
    Write-Error 'sentry-cli not found, cannot upload symbols with provided token.'
    exit 1
  }

  & $sentryCli.SourceMaps upload --help 2>$null 1>$null
  $hasSourceMapCommand = ($LASTEXITCODE -eq 0)

  if ($hasSourceMapCommand) {
    $mapPath = Join-Path $symbolsDir 'dart_obfuscation_map.json'
    if (Test-Path $mapPath) {
      & $sentryCli.SourceMaps upload --org $org --project $project --release $ReleaseTag $mapPath
      if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }
  }

  & $sentryCli debug-files upload --org $org --project $project $symbolsDir
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Write-Host "SENTRY UPLOAD PASS ($ReleaseTag)"
} finally {
  Pop-Location
}
