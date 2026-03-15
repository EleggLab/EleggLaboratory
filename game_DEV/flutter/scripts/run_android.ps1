$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$flutterw = Join-Path $PSScriptRoot 'flutterw.ps1'

Push-Location $repoRoot
try {
  & $flutterw run -d android
  exit $LASTEXITCODE
} finally {
  Pop-Location
}
