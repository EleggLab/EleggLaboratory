[CmdletBinding()]
param(
  [ValidateSet('list', 'status', 'start', 'stop', 'restart', 'logs', 'install', 'doctor')]
  [string]$Action = 'list',
  [string]$Target = 'all',
  [int]$Tail = 80,
  [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ManifestPath = Join-Path $ScriptRoot 'workspace.projects.json'
$StateDir = Join-Path $ScriptRoot '.workspace-control'
$LogDir = Join-Path $StateDir 'logs'
$PidDir = Join-Path $StateDir 'pids'

New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
New-Item -ItemType Directory -Path $PidDir -Force | Out-Null

if (-not (Test-Path $ManifestPath)) {
  throw "Manifest file not found: $ManifestPath"
}

$Manifest = Get-Content -Raw -Path $ManifestPath | ConvertFrom-Json
$Projects = @($Manifest.projects)

function Write-Info([string]$Message) {
  Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-WarnText([string]$Message) {
  Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Get-ProjectCwd([object]$Project) {
  $Relative = [string]$Project.cwd
  $Relative = $Relative -replace '/', '\'
  return Join-Path $ScriptRoot $Relative
}

function Get-ProjectPorts([object]$Project) {
  $Ports = @()
  if ($null -eq $Project.ports) {
    return $Ports
  }

  foreach ($Port in @($Project.ports)) {
    if ($null -eq $Port) {
      continue
    }

    $Text = ([string]$Port).Trim()
    if ([string]::IsNullOrWhiteSpace($Text)) {
      continue
    }

    $Ports += [int]$Port
  }
  return @($Ports)
}

function Get-PidFile([object]$Project) {
  return Join-Path $PidDir ($Project.id + '.json')
}

function Get-OutLog([object]$Project) {
  return Join-Path $LogDir ($Project.id + '.out.log')
}

function Get-ErrLog([object]$Project) {
  return Join-Path $LogDir ($Project.id + '.err.log')
}

function Read-PidState([object]$Project) {
  $PidFile = Get-PidFile $Project
  if (-not (Test-Path $PidFile)) {
    return $null
  }

  try {
    return Get-Content -Raw -Path $PidFile | ConvertFrom-Json
  } catch {
    return $null
  }
}

function Remove-PidState([object]$Project) {
  $PidFile = Get-PidFile $Project
  if (Test-Path $PidFile) {
    Remove-Item -Path $PidFile -Force
  }
}

function Test-PidAlive([Nullable[int]]$ProcessId) {
  if (-not $ProcessId) {
    return $false
  }

  try {
    $null = Get-Process -Id $ProcessId -ErrorAction Stop
    return $true
  } catch {
    return $false
  }
}

function Get-ListeningPidForPort([int]$Port) {
  $GetNetTcpConnection = Get-Command -Name Get-NetTCPConnection -ErrorAction SilentlyContinue
  if ($GetNetTcpConnection) {
    try {
      $Conn = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction Stop | Select-Object -First 1
      if ($Conn) {
        return [int]$Conn.OwningProcess
      }
    } catch {
      return $null
    }
    return $null
  }

  $Lines = & netstat -ano -p tcp | Select-String -Pattern "LISTENING"
  foreach ($Line in $Lines) {
    $Text = $Line.ToString()
    if ($Text -match ":\Q$Port\E\s+") {
      $Parts = $Text -split '\s+'
      $PidText = $Parts[-1]
      if ($PidText -match '^\d+$') {
        return [int]$PidText
      }
    }
  }
  return $null
}

function Resolve-Targets([string]$TargetSpec) {
  if ($TargetSpec -eq 'all') {
    return $Projects
  }

  $Ids = @($TargetSpec -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' })
  if (@($Ids).Count -eq 0) {
    throw "No target id provided. Use -Target all or -Target id1,id2"
  }

  $Resolved = @()
  foreach ($Id in $Ids) {
    $Project = $Projects | Where-Object { $_.id -eq $Id } | Select-Object -First 1
    if (-not $Project) {
      throw "Unknown target id: $Id"
    }
    $Resolved += $Project
  }
  return $Resolved
}

function Ensure-ProjectPaths([object[]]$TargetProjects) {
  foreach ($Project in $TargetProjects) {
    $Cwd = Get-ProjectCwd $Project
    if (-not (Test-Path $Cwd)) {
      throw "Project path does not exist: $($Project.id) -> $Cwd"
    }
  }
}

function Ensure-PortsFree([object]$Project) {
  foreach ($PortInt in @(Get-ProjectPorts $Project)) {
    $OwnerPid = Get-ListeningPidForPort -Port $PortInt
    if (-not $OwnerPid) {
      continue
    }

    $State = Read-PidState $Project
    if ($State -and [int]$State.pid -eq $OwnerPid) {
      continue
    }

    $OwnerName = ''
    try {
      $OwnerName = (Get-Process -Id $OwnerPid -ErrorAction Stop).ProcessName
    } catch {
      $OwnerName = 'unknown'
    }

    throw "Port $PortInt is already in use by PID $OwnerPid ($OwnerName)."
  }
}

function Start-Project([object]$Project) {
  $DevCommand = ([string]$Project.dev).Trim()
  if ([string]::IsNullOrWhiteSpace($DevCommand)) {
    Write-WarnText "$($Project.id) has no dev command. Start skipped."
    return
  }

  $Existing = Read-PidState $Project
  if ($Existing -and (Test-PidAlive ([int]$Existing.pid))) {
    Write-WarnText "$($Project.id) is already running (PID $($Existing.pid))."
    return
  }

  if ($Existing) {
    Remove-PidState $Project
  }

  $Cwd = Get-ProjectCwd $Project
  Ensure-PortsFree $Project

  $OutLog = Get-OutLog $Project
  $ErrLog = Get-ErrLog $Project

  Write-Info "Starting $($Project.id)"
  Write-Host "       cwd: $Cwd"
  Write-Host "       cmd: $DevCommand"

  $Proc = Start-Process `
    -FilePath 'cmd.exe' `
    -ArgumentList '/d', '/c', $DevCommand `
    -WorkingDirectory $Cwd `
    -RedirectStandardOutput $OutLog `
    -RedirectStandardError $ErrLog `
    -PassThru

  Start-Sleep -Milliseconds 900
  if (-not (Test-PidAlive $Proc.Id)) {
    throw "Failed to start $($Project.id). Check logs: $OutLog / $ErrLog"
  }

  $StateObject = [ordered]@{
    id = [string]$Project.id
    pid = [int]$Proc.Id
    startedAt = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
    cwd = $Cwd
    command = $DevCommand
    ports = @(Get-ProjectPorts $Project)
  }

  $StateObject | ConvertTo-Json -Depth 8 | Set-Content -Path (Get-PidFile $Project) -Encoding UTF8
  Write-Host "Started $($Project.id) (PID $($Proc.Id))."
}

function Stop-Project([object]$Project) {
  $State = Read-PidState $Project
  if (-not $State) {
    Write-WarnText "$($Project.id) has no PID record."
    return
  }

  $ProcessId = [int]$State.pid
  if (Test-PidAlive $ProcessId) {
    Write-Info "Stopping $($Project.id) (PID $ProcessId)"
    $KillArgs = @('/PID', "$ProcessId", '/T')
    if ($Force) {
      $KillArgs += '/F'
    } else {
      $KillArgs += '/F'
    }

    $null = & taskkill @KillArgs
    Start-Sleep -Milliseconds 500
  } else {
    Write-WarnText "$($Project.id) PID $ProcessId is not running."
  }

  Remove-PidState $Project
}

function Get-ProjectStatus([object]$Project) {
  $State = Read-PidState $Project
  $Running = $false
  $StatePid = $null
  $ProcessIdText = ''

  if ($State) {
    $PidInt = [int]$State.pid
    $StatePid = $PidInt
    if (Test-PidAlive $PidInt) {
      $Running = $true
      $ProcessIdText = [string]$PidInt
    } else {
      Remove-PidState $Project
    }
  }

  $PortSummary = @()
  $PortBlocked = $false
  foreach ($PortInt in @(Get-ProjectPorts $Project)) {
    $OwnerPid = Get-ListeningPidForPort -Port $PortInt
    if ($OwnerPid) {
      $PortSummary += "$($PortInt):PID$OwnerPid"
      if ((-not $Running) -or ($StatePid -and $OwnerPid -ne $StatePid)) {
        $PortBlocked = $true
      }
    } else {
      $PortSummary += "$($PortInt):free"
    }
  }

  $StatusText = 'stopped'
  if ($Running) {
    $StatusText = 'running'
  } elseif ($PortBlocked) {
    $StatusText = 'blocked'
  }

  [pscustomobject]@{
    Id = [string]$Project.id
    Name = if ($Project.name) { [string]$Project.name } else { '-' }
    Platform = if ($Project.platform) { [string]$Project.platform } else { '-' }
    Status = $StatusText
    PID = $ProcessIdText
    Ports = if (@($PortSummary).Count -gt 0) { $PortSummary -join ', ' } else { '-' }
    Path = [string]$Project.cwd
  }
}

function Show-ProjectLogs([object]$Project, [int]$Lines) {
  $OutLog = Get-OutLog $Project
  $ErrLog = Get-ErrLog $Project

  Write-Host "===== $($Project.id) stdout ====="
  if (Test-Path $OutLog) {
    Get-Content -Path $OutLog -Tail $Lines
  } else {
    Write-Host "(no stdout log)"
  }

  Write-Host ''
  Write-Host "===== $($Project.id) stderr ====="
  if (Test-Path $ErrLog) {
    Get-Content -Path $ErrLog -Tail $Lines
  } else {
    Write-Host "(no stderr log)"
  }
}

function Install-Project([object]$Project) {
  $InstallCommand = ([string]$Project.install).Trim()
  if ([string]::IsNullOrWhiteSpace($InstallCommand)) {
    Write-WarnText "$($Project.id) has no install command."
    return
  }

  $Cwd = Get-ProjectCwd $Project
  Write-Info "Installing deps for $($Project.id)"
  Write-Host "       cwd: $Cwd"
  Write-Host "       cmd: $InstallCommand"

  Push-Location $Cwd
  try {
    & cmd.exe /d /c $InstallCommand
    if ($LASTEXITCODE -ne 0) {
      throw "Install command failed for $($Project.id) with exit code $LASTEXITCODE"
    }
  } finally {
    Pop-Location
  }
}

function Show-ProjectList {
  $Projects | ForEach-Object {
    $Ports = @(Get-ProjectPorts $_)
    $DevCommand = ([string]$_.dev).Trim()
    [pscustomobject]@{
      Id = [string]$_.id
      Name = if ($_.name) { [string]$_.name } else { '-' }
      Platform = if ($_.platform) { [string]$_.platform } else { '-' }
      Category = if ($_.category) { [string]$_.category } else { '-' }
      Path = [string]$_.cwd
      Ports = if ($Ports.Count -gt 0) { ($Ports -join ', ') } else { '-' }
      Runtime = if ([string]::IsNullOrWhiteSpace($DevCommand)) { 'manual' } else { 'managed' }
    }
  } | Format-Table -AutoSize
}

function Run-Doctor([object[]]$TargetProjects) {
  $Issues = @()

  foreach ($Project in $TargetProjects) {
    $Cwd = Get-ProjectCwd $Project
    if (-not (Test-Path $Cwd)) {
      $Issues += "Missing path: $($Project.id) -> $($Project.cwd)"
    }

    foreach ($Port in @(Get-ProjectPorts $Project)) {
      $OwnerPid = Get-ListeningPidForPort -Port ([int]$Port)
      if ($OwnerPid) {
        $Issues += "Port $Port in use by PID $OwnerPid"
      }
    }
  }

  if (@($Issues).Count -eq 0) {
    Write-Host 'Doctor: OK'
    return
  }

  Write-Host 'Doctor issues:'
  foreach ($Issue in $Issues) {
    Write-Host " - $Issue"
  }
  exit 1
}

$Targets = Resolve-Targets -TargetSpec $Target
Ensure-ProjectPaths -TargetProjects $Targets

switch ($Action) {
  'list' {
    Show-ProjectList
  }
  'status' {
    $Targets |
      ForEach-Object { Get-ProjectStatus $_ } |
      Select-Object Id, Name, Platform, Status, PID, Ports |
      Format-Table -AutoSize
  }
  'start' {
    foreach ($Project in $Targets) {
      Start-Project $Project
    }
  }
  'stop' {
    foreach ($Project in $Targets) {
      Stop-Project $Project
    }
  }
  'restart' {
    foreach ($Project in $Targets) {
      Stop-Project $Project
      Start-Project $Project
    }
  }
  'logs' {
    foreach ($Project in $Targets) {
      Show-ProjectLogs -Project $Project -Lines $Tail
      Write-Host ''
    }
  }
  'install' {
    $SeenKeys = @{}
    foreach ($Project in $Targets) {
      $Key = ([string]$Project.cwd) + '|' + ([string]$Project.install)
      if ($SeenKeys.ContainsKey($Key)) {
        Write-Info "Skipping duplicate install target for $($Project.id)"
        continue
      }
      Install-Project $Project
      $SeenKeys[$Key] = $true
    }
  }
  'doctor' {
    Run-Doctor -TargetProjects $Targets
  }
}
