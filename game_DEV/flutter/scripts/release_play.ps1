param(
  [string]$ReleaseTag = ''
)

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$flutterw = Join-Path $PSScriptRoot 'flutterw.ps1'
$preflight = Join-Path $PSScriptRoot 'preflight_release.ps1'
$uploadScript = Join-Path $PSScriptRoot 'sentry_upload_symbols.ps1'
$keyProps = Join-Path $repoRoot 'android\key.properties'
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

function Get-KeyProperties([string]$path) {
  $map = @{}
  if (-not (Test-Path $path)) {
    return $map
  }
  foreach ($line in Get-Content $path) {
    $trimmed = $line.Trim()
    if ([string]::IsNullOrWhiteSpace($trimmed) -or $trimmed.StartsWith('#')) { continue }
    $idx = $trimmed.IndexOf('=')
    if ($idx -lt 1) { continue }
    $key = $trimmed.Substring(0, $idx).Trim()
    $value = $trimmed.Substring($idx + 1).Trim()
    $map[$key] = $value
  }
  return $map
}

if (-not (Test-Path $keyProps)) {
  Write-Error 'Missing android/key.properties. Play release build requires signing config.'
  Write-Host 'Copy android/key.properties.example -> android/key.properties and fill keystore values.'
  exit 1
}

$props = Get-KeyProperties $keyProps
$required = @('storeFile', 'storePassword', 'keyAlias', 'keyPassword')
foreach ($key in $required) {
  if ([string]::IsNullOrWhiteSpace($props[$key])) {
    Write-Error "android/key.properties missing required field: $key"
    exit 1
  }
}

$storeFile = $props['storeFile']
$resolvedStoreFile = if ([IO.Path]::IsPathRooted($storeFile)) {
  [IO.Path]::GetFullPath($storeFile)
} else {
  [IO.Path]::GetFullPath((Join-Path (Split-Path $keyProps) $storeFile))
}

if (-not (Test-Path $resolvedStoreFile)) {
  Write-Error "Keystore file not found: $resolvedStoreFile"
  exit 1
}

Push-Location $repoRoot
try {
  & $preflight
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Write-Host '[release_play] flutter pub get'
  & $flutterw pub get
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  if ([string]::IsNullOrWhiteSpace($ReleaseTag)) {
    $ReleaseTag = (& $dartExe run tool/release_preflight.dart --print-tag-only).Trim()
  }
  if ([string]::IsNullOrWhiteSpace($ReleaseTag)) {
    Write-Error 'Failed to derive release tag from pubspec version.'
    exit 1
  }

  $symbolsDir = Join-Path $repoRoot "build\symbols\$ReleaseTag"
  New-Item -ItemType Directory -Force -Path $symbolsDir | Out-Null

  $splitArg = "--split-debug-info=$($symbolsDir -replace '\\', '/')"
  $mapPath = Join-Path $symbolsDir 'dart_obfuscation_map.json'
  $extraSnapshotArg = "--extra-gen-snapshot-options=--save-obfuscation-map=$($mapPath -replace '\\', '/')"

  Write-Host '[release_play] build appbundle --release (obfuscate)'
  & $flutterw build appbundle --release --obfuscate $splitArg $extraSnapshotArg
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Write-Host '[release_play] build apk --release --split-per-abi (obfuscate)'
  & $flutterw build apk --release --split-per-abi --obfuscate $splitArg $extraSnapshotArg
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Write-Host "[release_play] symbols dir: $symbolsDir"
  Write-Host '[release_play] appbundle: build/app/outputs/bundle/release/app-release.aab'
  Write-Host '[release_play] split apks: build/app/outputs/flutter-apk/'

  & $uploadScript -ReleaseTag $ReleaseTag
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Write-Host '[release_play] PASS'
} finally {
  Pop-Location
}
