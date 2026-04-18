param(
  [string[]]$Roots = @(
    'C:\Users\rndhr\OneDrive\Documents\GitHub',
    'C:\Users\rndhr\OneDrive\Documents',
    'C:\Users\rndhr\Documents',
    'C:\Users\rndhr\Desktop'
  )
)

$ErrorActionPreference = 'SilentlyContinue'

$directoryMarkers = @(
  'text-choice-frame-studio'
)

$fileMarkers = @(
  'sample_story.json',
  'REFERENCE_AND_SCOPE.md',
  '2026-03-30-ui-30pass.md',
  '2026-03-30-features-content-30pass.md',
  '2026-03-30-game-30pass.md'
)

$hits = New-Object System.Collections.Generic.List[object]
$rg = Get-Command rg -ErrorAction SilentlyContinue

function Add-Hit {
  param(
    [string]$MarkerType,
    [string]$Marker,
    [string]$FullName
  )

  $hits.Add([pscustomobject]@{
    MarkerType = $MarkerType
    Marker = $Marker
    FullName = $FullName
    Parent = Split-Path -Parent $FullName
  })
}

foreach ($root in $Roots) {
  if (-not (Test-Path $root)) {
    continue
  }

  foreach ($directoryMarker in $directoryMarkers) {
    Get-ChildItem -Path $root -Recurse -Directory -Filter $directoryMarker | ForEach-Object {
      Add-Hit -MarkerType 'directory' -Marker $directoryMarker -FullName $_.FullName
    }
  }

  if ($rg) {
    $files = & rg --files $root 2>$null
    foreach ($file in $files) {
      $name = Split-Path -Leaf $file
      if ($fileMarkers -contains $name) {
        Add-Hit -MarkerType 'file' -Marker $name -FullName $file
      }
    }
    continue
  }

  foreach ($fileMarker in $fileMarkers) {
    Get-ChildItem -Path $root -Recurse -File -Filter $fileMarker | ForEach-Object {
      Add-Hit -MarkerType 'file' -Marker $fileMarker -FullName $_.FullName
    }
  }
}

$candidateRoots = $hits |
  ForEach-Object {
    if ($_.MarkerType -eq 'directory') {
      $_.FullName
    } else {
      Split-Path -Parent $_.FullName
    }
  } |
  Group-Object |
  Sort-Object Count -Descending |
  Select-Object @{
    Name = 'CandidateRoot'
    Expression = { $_.Name }
  }, Count

[pscustomobject]@{
  SearchedRoots = $Roots
  HitCount = $hits.Count
  MarkerHits = $hits
  CandidateRoots = $candidateRoots
} | ConvertTo-Json -Depth 6
