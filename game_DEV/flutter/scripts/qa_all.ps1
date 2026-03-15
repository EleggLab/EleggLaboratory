param()

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$flutterw = Join-Path $PSScriptRoot 'flutterw.ps1'
$qa = Join-Path $PSScriptRoot 'qa.ps1'
$smoke = Join-Path $PSScriptRoot 'qa_smoke_android.ps1'
$visual = Join-Path $PSScriptRoot 'qa_visual_android.ps1'
$qaRelease = Join-Path $PSScriptRoot 'qa_release.ps1'

Push-Location $repoRoot
try {
  Write-Host '[qa_all] run base QA'
  & $qa
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Write-Host '[qa_all] build appbundle --debug'
  & $flutterw build appbundle --debug
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Write-Host '[qa_all] run android smoke QA'
  & $smoke
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Write-Host '[qa_all] run android visual QA'
  & $visual
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Write-Host '[qa_all] run release QA gate'
  & $qaRelease
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Write-Host 'QA ALL PASS'
} finally {
  Pop-Location
}
