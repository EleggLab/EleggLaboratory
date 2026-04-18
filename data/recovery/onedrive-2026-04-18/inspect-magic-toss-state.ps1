param(
  [string]$WorkspaceRoot = (Get-Location).Path,
  [string[]]$Roots = @(
    'C:\Users\rndhr\OneDrive\Documents\GitHub',
    'C:\Users\rndhr\OneDrive\Documents',
    'C:\Users\rndhr\Documents'
  )
)

$ErrorActionPreference = 'SilentlyContinue'

$locatorPath = Join-Path $PSScriptRoot 'locate-magic-toss.ps1'
$preferredRoot = $null

if (Test-Path $locatorPath) {
  $locator = & powershell -ExecutionPolicy Bypass -File $locatorPath -WorkspaceRoot $WorkspaceRoot | ConvertFrom-Json
  $preferredRoot = $locator.PreferredRoot
}

if (-not $preferredRoot) {
  $directMatch = Get-ChildItem -Path $Roots -Recurse -File -Filter 'granite.config.ts' |
    Where-Object { $_.FullName -match '(?i)\\magic_toss\\app\\granite\.config\.ts$' } |
    Select-Object -First 1

  if ($directMatch) {
    $preferredRoot = Split-Path -Parent $directMatch.FullName
  }
}

if (-not $preferredRoot -or -not (Test-Path $preferredRoot)) {
  [pscustomobject]@{
    WorkspaceRoot = $WorkspaceRoot
    PreferredRoot = $null
    Exists = $false
    Error = 'magic_toss root not found'
  } | ConvertTo-Json -Depth 6
  exit 0
}

$packageJsonPath = Join-Path $preferredRoot 'package.json'
$readmePath = Join-Path $preferredRoot 'README.md'
$appPath = Join-Path $preferredRoot 'src\app\App.tsx'
$srcPath = Join-Path $preferredRoot 'src'
$docsPath = Join-Path $preferredRoot 'docs'

$packageJson = $null
if (Test-Path $packageJsonPath) {
  $packageJson = Get-Content -Raw $packageJsonPath | ConvertFrom-Json
}

$readmePreview = @()
if (Test-Path $readmePath) {
  $readmePreview = @(Get-Content $readmePath | Select-Object -First 16 | ForEach-Object { "$_" })
}

$sceneKinds = @()
if (Test-Path $appPath) {
  $appText = Get-Content -Raw $appPath
  $sceneKinds = ([regex]::Matches($appText, "kind: '([^']+)'") | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique)
}

$topLevel = Get-ChildItem -Path $preferredRoot -Force | Select-Object Name, Mode, LastWriteTime
$recentFiles = Get-ChildItem -Path $preferredRoot -Recurse -File |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 12 FullName, LastWriteTime, Length

$gitRoot = Split-Path -Parent $preferredRoot
$gitStatus = @()
if (Test-Path (Join-Path $gitRoot '.git')) {
  $gitStatus = git -C $gitRoot status --short -- magic_toss/app 2>$null
}

[pscustomobject]@{
  WorkspaceRoot = $WorkspaceRoot
  PreferredRoot = $preferredRoot
  Exists = $true
  WritableFromWorkspace = $preferredRoot.StartsWith($WorkspaceRoot, [System.StringComparison]::OrdinalIgnoreCase)
  ProjectStructure = [pscustomobject]@{
    HasSrc = Test-Path $srcPath
    HasDocs = Test-Path $docsPath
    HasPackageJson = Test-Path $packageJsonPath
    HasReadme = Test-Path $readmePath
    TopLevel = $topLevel
  }
  Purpose = [pscustomobject]@{
    PackageName = $packageJson.name
    Version = $packageJson.version
    Scripts = $packageJson.scripts
    ReadmePreview = $readmePreview
  }
  UIStructure = [pscustomobject]@{
    SceneKinds = $sceneKinds
  }
  RecentChanges = [pscustomobject]@{
    GitStatus = $gitStatus
    RecentFiles = $recentFiles
  }
  RunHints = [pscustomobject]@{
    Dev = if ($packageJson.scripts.dev) { $packageJson.scripts.dev } else { $null }
    Build = if ($packageJson.scripts.build) { $packageJson.scripts.build } else { $null }
    Typecheck = if ($packageJson.scripts.typecheck) { $packageJson.scripts.typecheck } else { $null }
  }
} | ConvertTo-Json -Depth 7
