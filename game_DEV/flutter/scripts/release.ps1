param()

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$flutterw = Join-Path $PSScriptRoot 'flutterw.ps1'

Push-Location $repoRoot
try {
  Write-Host '[1/4] flutter pub get'
  & $flutterw pub get
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Write-Host '[2/4] flutter build appbundle'
  & $flutterw build appbundle
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Write-Host '[3/4] flutter build apk --split-per-abi'
  & $flutterw build apk --split-per-abi
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Write-Host '[4/4] optional obfuscated split build'
  & $flutterw build apk --release --split-per-abi --obfuscate --split-debug-info=build/symbols
  if ($LASTEXITCODE -ne 0) {
    Write-Warning 'Obfuscated build failed. Check configuration and try again.'
  }

  Write-Host ''
  Write-Host 'Release build completed.'
  Write-Host 'Signing checklist before Play upload:'
  Write-Host '1) Ensure android/key.properties and keystore are configured.'
  Write-Host '2) Verify package name, versionCode/versionName.'
  Write-Host '3) Replace test AdMob IDs with production IDs as needed.'
} finally {
  Pop-Location
}
