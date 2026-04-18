param(
    [string]$SourceRepo = "C:\Users\rndhr\Documents\GitHub\EleggLaboratory",
    [string]$DestinationRepo = "C:\Users\rndhr\Documents\GitHub\aaa\EleggLaboratory",
    [string]$OneDriveCopy = "C:\Users\rndhr\OneDrive\Documents\GitHub\EleggLaboratory",
    [switch]$ForceDeleteOneDrive
)

$ErrorActionPreference = "Stop"

function Assert-PathExists {
    param(
        [string]$Path,
        [string]$Label
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "$Label not found: $Path"
    }
}

function Invoke-RobocopySync {
    param(
        [string]$Source,
        [string]$Destination
    )

    $excludeDirs = @(
        ".git",
        "node_modules",
        ".pnpm-store",
        ".pub-cache",
        ".codex_home",
        ".android-temp",
        ".runlogs",
        ".wrangler"
    )

    $args = @(
        $Source,
        $Destination,
        "/E",
        "/R:1",
        "/W:1",
        "/FFT",
        "/XD"
    ) + $excludeDirs

    & robocopy @args
    $code = $LASTEXITCODE

    if ($code -ge 8) {
        throw "robocopy failed with exit code $code"
    }

    return $code
}

Assert-PathExists -Path $SourceRepo -Label "Source repo"
Assert-PathExists -Path $DestinationRepo -Label "Destination repo"

$syncCode = Invoke-RobocopySync -Source $SourceRepo -Destination $DestinationRepo
Write-Host "Sync finished with robocopy exit code $syncCode"

if (-not (Test-Path -LiteralPath $OneDriveCopy)) {
    Write-Host "OneDrive copy not found. Nothing to delete: $OneDriveCopy"
    exit 0
}

$oneDriveTmp = Join-Path $OneDriveCopy "tmp"
if (Test-Path -LiteralPath $oneDriveTmp) {
    $tmpMeasure = Get-ChildItem -Path $oneDriveTmp -Recurse -File -ErrorAction SilentlyContinue |
        Measure-Object -Property Length -Sum

    if ($tmpMeasure.Count -gt 0 -and -not $ForceDeleteOneDrive) {
        $tmpMb = [math]::Round(($tmpMeasure.Sum / 1MB), 2)
        Write-Warning "OneDrive copy still contains tmp/ (~$tmpMb MB, $($tmpMeasure.Count) files). Review it first or rerun with -ForceDeleteOneDrive."
        exit 0
    }
}

if (-not $ForceDeleteOneDrive) {
    Write-Host "OneDrive copy was not deleted. Rerun with -ForceDeleteOneDrive when ready."
    exit 0
}

Add-Type -AssemblyName Microsoft.VisualBasic
[Microsoft.VisualBasic.FileIO.FileSystem]::DeleteDirectory(
    $OneDriveCopy,
    [Microsoft.VisualBasic.FileIO.UIOption]::OnlyErrorDialogs,
    [Microsoft.VisualBasic.FileIO.RecycleOption]::SendToRecycleBin
)

Write-Host "Moved OneDrive copy to Recycle Bin: $OneDriveCopy"
