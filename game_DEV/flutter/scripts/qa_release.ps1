param()

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$flutterw = Join-Path $PSScriptRoot 'flutterw.ps1'
$preflight = Join-Path $PSScriptRoot 'preflight_release.ps1'
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
    if ([string]::IsNullOrWhiteSpace($trimmed)) { continue }
    if ($trimmed.StartsWith('#')) { continue }
    $idx = $trimmed.IndexOf('=')
    if ($idx -lt 1) { continue }
    $key = $trimmed.Substring(0, $idx).Trim()
    $value = $trimmed.Substring($idx + 1).Trim()
    $map[$key] = $value
  }
  return $map
}

Push-Location $repoRoot
try {
  Write-Host '[1/7] flutter pub get'
  & $flutterw pub get
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Write-Host '[2/7] dart format --set-exit-if-changed .'
  & $dartExe format --set-exit-if-changed .
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Write-Host '[3/7] flutter analyze'
  & $flutterw analyze
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Write-Host '[4/7] flutter test'
  & $flutterw test
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Write-Host '[5/7] flutter build appbundle --debug'
  & $flutterw build appbundle --debug
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Write-Host '[6/7] flutter build apk --debug'
  & $flutterw build apk --debug
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  $keyPropsPath = Join-Path $repoRoot 'android\key.properties'
  $props = Get-KeyProperties $keyPropsPath
  $storeFile = $props['storeFile']
  $hasAllFields =
    -not [string]::IsNullOrWhiteSpace($props['storeFile']) -and
    -not [string]::IsNullOrWhiteSpace($props['storePassword']) -and
    -not [string]::IsNullOrWhiteSpace($props['keyAlias']) -and
    -not [string]::IsNullOrWhiteSpace($props['keyPassword'])

  $resolvedStoreFile = $null
  if (-not [string]::IsNullOrWhiteSpace($storeFile)) {
    if ([IO.Path]::IsPathRooted($storeFile)) {
      $resolvedStoreFile = [IO.Path]::GetFullPath($storeFile)
    } else {
      $resolvedStoreFile = [IO.Path]::GetFullPath((Join-Path (Split-Path $keyPropsPath) $storeFile))
    }
  }

  $hasSigning = (Test-Path $keyPropsPath) -and $hasAllFields -and
    -not [string]::IsNullOrWhiteSpace($resolvedStoreFile) -and (Test-Path $resolvedStoreFile)

  if (-not $hasSigning) {
    Write-Warning 'RELEASE SKIP (no signing): android/key.properties or keystore file is missing/incomplete.'
    Write-Host 'QA RELEASE PASS'
    exit 0
  }

  Write-Host '[7/7] release builds with obfuscation + symbols'
  & $preflight
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  $releaseTag = (& $dartExe run tool/release_preflight.dart --print-tag-only).Trim()
  if ([string]::IsNullOrWhiteSpace($releaseTag)) {
    Write-Error 'Failed to resolve release tag from pubspec version.'
    exit 1
  }

  $symbolsDir = Join-Path $repoRoot "build\symbols\$releaseTag"
  New-Item -ItemType Directory -Force -Path $symbolsDir | Out-Null
  $splitArg = "--split-debug-info=$($symbolsDir -replace '\\', '/')"
  $mapPath = Join-Path $symbolsDir 'dart_obfuscation_map.json'
  $extraSnapshotArg = "--extra-gen-snapshot-options=--save-obfuscation-map=$($mapPath -replace '\\', '/')"

  & $flutterw build appbundle --release --obfuscate $splitArg $extraSnapshotArg
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  & $flutterw build apk --release --split-per-abi --obfuscate $splitArg $extraSnapshotArg
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Write-Host "[qa_release] symbols: $symbolsDir"
  Write-Host 'QA RELEASE PASS'
} finally {
  Pop-Location
}
