$searchRoots = @(
  "C:\Users\rndhr\OneDrive\Documents\GitHub",
  "C:\Users\rndhr\OneDrive\Documents",
  "C:\Users\rndhr\Documents\GitHub",
  "C:\Users\rndhr\Documents",
  "C:\Users\rndhr\Desktop"
) | Select-Object -Unique

$workspaceRoot = (Get-Location).Path
$projectRoot = $null

foreach ($root in $searchRoots) {
  if (-not (Test-Path $root)) { continue }

  $hit = Get-ChildItem -Path $root -Directory -Recurse -Filter "text-choice-frame-studio" -ErrorAction SilentlyContinue |
    Select-Object -First 1

  if ($hit) {
    $projectRoot = $hit.FullName
    break
  }
}

if (-not $projectRoot) {
  [ordered]@{
    WorkspaceRoot = $workspaceRoot
    ProjectFound = $false
    Error = "text-choice-frame-studio not found under known roots"
  } | ConvertTo-Json -Depth 6
  exit 0
}

$readmePath = Join-Path $projectRoot "README.md"
$indexPath = Join-Path $projectRoot "index.html"

$readmeLines = if (Test-Path $readmePath) { Get-Content -Path $readmePath } else { @() }
$indexRaw = if (Test-Path $indexPath) { Get-Content -Path $indexPath -Raw } else { "" }

$purpose = @(
  $readmeLines |
    ForEach-Object { $_.ToString().Trim() } |
    Where-Object {
      $_ -and
      -not $_.StartsWith("#") -and
      -not $_.StartsWith("- ") -and
      -not $_.StartsWith('```')
    }
)[0]

$uiSections = [regex]::Matches($indexRaw, '<h2>([^<]+)</h2>') |
  ForEach-Object { $_.Groups[1].Value.Trim() }

$recentFiles = Get-ChildItem -Path $projectRoot -File -Recurse -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 8 @{Name="Name";Expression={$_.Name}}, @{Name="FullName";Expression={$_.FullName}}, LastWriteTime

$topLevel = Get-ChildItem -Path $projectRoot -Force -ErrorAction SilentlyContinue |
  Select-Object Name, @{Name="Type";Expression={ if ($_.PSIsContainer) { "dir" } else { "file" } }}, LastWriteTime

$runHint = $null
$port = $null
if (($readmeLines -join "`n") -match 'python -m http\.server\s+(\d+)') {
  $port = [int]($Matches[1])
  $runHint = "python -m http.server $port"
}

$portListening = $false
if ($port) {
  try {
    $portListening = @(
      Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction Stop
    ).Count -gt 0
  } catch {
    $portListening = $false
  }
}

[ordered]@{
  WorkspaceRoot = $workspaceRoot
  DetectedProjectRoot = $projectRoot
  ProjectFound = $true
  WritableInsideCurrentWorkspace = $projectRoot.StartsWith($workspaceRoot, [System.StringComparison]::OrdinalIgnoreCase)
  InferredPurpose = $purpose
  UiSections = $uiSections
  TopLevelEntries = $topLevel
  RecentFiles = $recentFiles
  RunHint = $runHint
  PortListening = $portListening
} | ConvertTo-Json -Depth 6
