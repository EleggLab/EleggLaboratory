param()

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$flutterw = Join-Path $PSScriptRoot 'flutterw.ps1'

Push-Location $repoRoot
try {
  & $flutterw pub get
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  & $flutterw pub run flutter_native_splash:create
  exit $LASTEXITCODE
} finally {
  Pop-Location
}
