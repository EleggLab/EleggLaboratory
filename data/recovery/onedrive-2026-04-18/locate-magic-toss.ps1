param(
  [string]$WorkspaceRoot = (Get-Location).Path,
  [string[]]$Roots = @(
    'C:\Users\rndhr\OneDrive\Documents\GitHub',
    'C:\Users\rndhr\OneDrive\Documents',
    'C:\Users\rndhr\Documents'
  )
)

$ErrorActionPreference = 'SilentlyContinue'

$markers = @(
  'magic-toss.ait',
  'granite.config.ts',
  '토스_미니앱용_오늘의마법수업_상세기획서.md',
  'APP_REGISTRATION_SHEET.md'
)

$hits = New-Object System.Collections.Generic.List[object]
$rg = Get-Command rg -ErrorAction SilentlyContinue

function Add-Hit {
  param(
    [string]$Marker,
    [string]$FullName
  )

  $projectRoot = $null
  if ($FullName -match '(?i)^(.*\\magic_toss\\app)(\\.*)?$') {
    $projectRoot = $Matches[1]
  } else {
    $projectRoot = Split-Path -Parent $FullName
  }

  $hits.Add([pscustomobject]@{
    Marker = $Marker
    FullName = $FullName
    Parent = Split-Path -Parent $FullName
    ProjectRoot = $projectRoot
    WritableFromWorkspace = $projectRoot.StartsWith($WorkspaceRoot, [System.StringComparison]::OrdinalIgnoreCase)
  })
}

foreach ($root in $Roots) {
  if (-not (Test-Path $root)) {
    continue
  }

  if ($rg) {
    $files = & rg --files $root 2>$null
    foreach ($file in $files) {
      $name = Split-Path -Leaf $file
      if ($markers -contains $name) {
        Add-Hit -Marker $name -FullName $file
      }
    }
    continue
  }

  foreach ($marker in $markers) {
    Get-ChildItem -Path $root -Recurse -File -Filter $marker | ForEach-Object {
      Add-Hit -Marker $marker -FullName $_.FullName
    }
  }
}

$candidateRoots = $hits |
  Group-Object ProjectRoot |
  Sort-Object Count -Descending |
  Select-Object @{
    Name = 'CandidateRoot'
    Expression = { $_.Name }
  }, Count, @{
    Name = 'WritableFromWorkspace'
    Expression = { $_.Group[0].WritableFromWorkspace }
  }

$preferredRoot = $candidateRoots |
  Sort-Object @{
    Expression = { if ($_.CandidateRoot -match '(?i)\\magic_toss\\app$') { 0 } else { 1 } }
  }, @{
    Expression = { if ($_.WritableFromWorkspace) { 0 } else { 1 } }
  }, @{
    Expression = { -$_.Count }
  } |
  Select-Object -First 1 -ExpandProperty CandidateRoot

[pscustomobject]@{
  WorkspaceRoot = $WorkspaceRoot
  SearchedRoots = $Roots
  HitCount = $hits.Count
  MarkerHits = $hits
  CandidateRoots = $candidateRoots
  PreferredRoot = $preferredRoot
} | ConvertTo-Json -Depth 6
