param()

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$flutterw = Join-Path $PSScriptRoot 'flutterw.ps1'
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

Push-Location $repoRoot
try {
  Write-Host '[1/5] flutter pub get'
  & $flutterw pub get
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Write-Host '[2/5] dart format --set-exit-if-changed .'
  & $dartExe format --set-exit-if-changed .
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Write-Host '[3/5] flutter analyze'
  & $flutterw analyze
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Write-Host '[4/5] flutter test'
  & $flutterw test
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Write-Host '[5/5] flutter build apk --debug'
  & $flutterw build apk --debug
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Write-Host 'QA PASS'
} finally {
  Pop-Location
}
