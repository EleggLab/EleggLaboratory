[CmdletBinding(SupportsShouldProcess)]
param(
    [switch]$AlsoRemoveAdobeAcrobatChromeExtension,
    [string]$BackupRoot = ''
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($BackupRoot)) {
    $scriptBase = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
    $BackupRoot = Join-Path -Path $scriptBase -ChildPath ("cleanup-backups\" + (Get-Date -Format 'yyyyMMdd-HHmmss'))
}

$deleted = [System.Collections.Generic.List[string]]::new()
$updated = [System.Collections.Generic.List[string]]::new()
$skipped = [System.Collections.Generic.List[string]]::new()
$backedUp = [System.Collections.Generic.List[string]]::new()

function Add-Result {
    param(
        [Parameter(Mandatory)]
        [System.Collections.Generic.List[string]]$List,
        [Parameter(Mandatory)]
        [string]$Message
    )

    $List.Add($Message) | Out-Null
}

function Backup-File {
    param(
        [Parameter(Mandatory)]
        [string]$Path
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        return
    }

    $backup = "$Path.bak"
    if (-not (Test-Path -LiteralPath $backup)) {
        Copy-Item -LiteralPath $Path -Destination $backup -Force
    }
}

function Ensure-BackupDirectory {
    param(
        [string]$SubPath
    )

    $target = if ($SubPath) {
        Join-Path -Path $BackupRoot -ChildPath $SubPath
    } else {
        $BackupRoot
    }

    if (-not (Test-Path -LiteralPath $target) -and -not $WhatIfPreference) {
        New-Item -ItemType Directory -Path $target -Force | Out-Null
    }

    return $target
}

function Convert-ToRegExePath {
    param(
        [Parameter(Mandatory)]
        [string]$RegistryPath
    )

    return ($RegistryPath -replace '^HKLM:', 'HKLM' -replace '^HKCU:', 'HKCU' -replace '^HKCR:', 'HKCR' -replace '^HKU:', 'HKU' -replace '^HKCC:', 'HKCC')
}

function Export-RegistryKeyBackup {
    param(
        [Parameter(Mandatory)]
        [string]$RegistryPath,
        [Parameter(Mandatory)]
        [string]$Label
    )

    if (-not (Test-Path -LiteralPath $RegistryPath)) {
        return
    }

    $registryDir = Ensure-BackupDirectory -SubPath 'registry'
    $safeLabel = ($Label -replace '[^A-Za-z0-9._-]', '_')
    $destination = Join-Path -Path $registryDir -ChildPath "$safeLabel.reg"

    if (Test-Path -LiteralPath $destination) {
        return
    }

    $regPath = Convert-ToRegExePath -RegistryPath $RegistryPath
    if ($PSCmdlet.ShouldProcess($RegistryPath, "Export registry backup to $destination")) {
        & reg.exe export $regPath $destination /y | Out-Null
        Add-Result -List $backedUp -Message "Backed up registry key: $RegistryPath -> $destination"
    }
}

function Get-DPathFromText {
    param(
        [AllowNull()]
        [string]$Text
    )

    if ([string]::IsNullOrWhiteSpace($Text)) {
        return $null
    }

    $match = [regex]::Match($Text, 'D:\\[^"''\s,;]*')
    if ($match.Success) {
        return $match.Value
    }

    return $null
}

function Test-BrokenDReference {
    param(
        [AllowNull()]
        [string]$Text
    )

    $candidate = Get-DPathFromText -Text $Text
    if (-not $candidate) {
        return $false
    }

    return -not (Test-Path -LiteralPath $candidate)
}

function Test-BrokenRegistryReference {
    param(
        [Parameter(Mandatory)]
        [string]$RegistryPath
    )

    if (-not (Test-Path -LiteralPath $RegistryPath)) {
        return $false
    }

    try {
        $item = Get-Item -LiteralPath $RegistryPath -ErrorAction Stop
        $defaultValue = $item.GetValue('')
        if ($defaultValue -is [string] -and (Test-BrokenDReference $defaultValue)) {
            return $true
        }

        $props = Get-ItemProperty -LiteralPath $RegistryPath -ErrorAction Stop
        foreach ($prop in $props.PSObject.Properties) {
            if ($prop.Name -match '^PS') {
                continue
            }

            if ($prop.Value -is [string] -and (Test-BrokenDReference $prop.Value)) {
                return $true
            }
        }
    } catch {
        Add-Result -List $skipped -Message "Skipped registry probe: $RegistryPath ($($_.Exception.Message))"
    }

    return $false
}

function Remove-DeadShortcuts {
    $shell = New-Object -ComObject WScript.Shell
    $roots = @(
        'C:\ProgramData\Microsoft\Windows\Start Menu',
        "$env:APPDATA\Microsoft\Windows\Start Menu\Programs",
        "$env:USERPROFILE\Desktop",
        "$env:OneDrive\Desktop",
        "$env:APPDATA\Microsoft\Windows\Recent"
    )

    Get-ChildItem $roots -Recurse -Filter *.lnk -ErrorAction SilentlyContinue | ForEach-Object {
        try {
            $shortcut = $shell.CreateShortcut($_.FullName)
            $targetRef = $shortcut.TargetPath
            $argRef = $shortcut.Arguments
            if ((Test-BrokenDReference $targetRef) -or (Test-BrokenDReference $argRef)) {
                if ($PSCmdlet.ShouldProcess($_.FullName, 'Remove broken D: shortcut')) {
                    Remove-Item -LiteralPath $_.FullName -Force
                    Add-Result -List $deleted -Message "Removed shortcut: $($_.FullName)"
                }
            }
        } catch {
            Add-Result -List $skipped -Message "Skipped shortcut: $($_.FullName) ($($_.Exception.Message))"
        }
    }

    Get-ChildItem $roots -Recurse -Filter *.url -ErrorAction SilentlyContinue | ForEach-Object {
        try {
            $content = Get-Content -LiteralPath $_.FullName -Raw -ErrorAction Stop
            if (Test-BrokenDReference $content) {
                if ($PSCmdlet.ShouldProcess($_.FullName, 'Remove broken D: url shortcut')) {
                    Remove-Item -LiteralPath $_.FullName -Force
                    Add-Result -List $deleted -Message "Removed url shortcut: $($_.FullName)"
                }
            }
        } catch {
            Add-Result -List $skipped -Message "Skipped url shortcut: $($_.FullName) ($($_.Exception.Message))"
        }
    }
}

function Remove-UninstallEntries {
    $roots = @(
        'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall',
        'HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall',
        'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall'
    )

    foreach ($root in $roots) {
        Get-ChildItem $root -ErrorAction SilentlyContinue | ForEach-Object {
            try {
                $props = Get-ItemProperty $_.PSPath -ErrorAction Stop
                $candidates = @(
                    $props.InstallLocation,
                    $props.DisplayIcon,
                    $props.UninstallString
                ) | Where-Object { $_ }

                if ($candidates | Where-Object { Test-BrokenDReference $_ }) {
                    $name = if ($props.DisplayName) { $props.DisplayName } else { $_.PSChildName }
                    if ($PSCmdlet.ShouldProcess($name, 'Remove stale uninstall registry key')) {
                        Export-RegistryKeyBackup -RegistryPath $_.PSPath -Label ("uninstall_" + $name)
                        Remove-Item -LiteralPath $_.PSPath -Recurse -Force
                        Add-Result -List $deleted -Message "Removed uninstall entry: $name"
                    }
                }
            } catch {
                Add-Result -List $skipped -Message "Skipped uninstall key: $($_.PSPath) ($($_.Exception.Message))"
            }
        }
    }
}

function Remove-BrokenServices {
    Get-ChildItem 'HKLM:\SYSTEM\CurrentControlSet\Services' -ErrorAction SilentlyContinue | ForEach-Object {
        try {
            $props = Get-ItemProperty $_.PSPath -ErrorAction Stop
            if (Test-BrokenDReference $props.ImagePath) {
                if ($PSCmdlet.ShouldProcess($_.PSChildName, 'Delete service pointing to missing D: executable')) {
                    Export-RegistryKeyBackup -RegistryPath $_.PSPath -Label ("service_" + $_.PSChildName)
                    & sc.exe delete $_.PSChildName | Out-Null
                    Add-Result -List $deleted -Message "Deleted service: $($_.PSChildName)"
                }
            }
        } catch {
            Add-Result -List $skipped -Message "Skipped service: $($_.PSChildName) ($($_.Exception.Message))"
        }
    }
}

function Remove-EpicManifests {
    $manifestRoot = 'C:\ProgramData\Epic\EpicGamesLauncher\Data\Manifests'
    Get-ChildItem $manifestRoot -Filter *.item -ErrorAction SilentlyContinue | ForEach-Object {
        try {
            $content = Get-Content -LiteralPath $_.FullName -Raw -ErrorAction Stop
            if (Test-BrokenDReference $content) {
                if ($PSCmdlet.ShouldProcess($_.FullName, 'Remove Epic manifest pointing to D:')) {
                    Remove-Item -LiteralPath $_.FullName -Force
                    Add-Result -List $deleted -Message "Removed Epic manifest: $($_.FullName)"
                }
            }
        } catch {
            Add-Result -List $skipped -Message "Skipped Epic manifest: $($_.FullName) ($($_.Exception.Message))"
        }
    }
}

function Remove-VdfBlocksWithBrokenDPath {
    param(
        [Parameter(Mandatory)]
        [string]$Path
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        return
    }

    $lines = [System.Collections.Generic.List[string]]::new()
    foreach ($line in Get-Content -LiteralPath $Path) {
        $lines.Add($line) | Out-Null
    }

    $output = [System.Collections.Generic.List[string]]::new()
    $index = 0
    $changed = $false

    while ($index -lt $lines.Count) {
        $line = $lines[$index]
        if ($line -match '^\s*"\d+"\s*$') {
            $block = [System.Collections.Generic.List[string]]::new()
            $block.Add($line) | Out-Null
            $index++
            $depth = 0
            $opened = $false

            while ($index -lt $lines.Count) {
                $line = $lines[$index]
                $block.Add($line) | Out-Null
                $depth += ([regex]::Matches($line, '\{')).Count
                if ($depth -gt 0) {
                    $opened = $true
                }
                $depth -= ([regex]::Matches($line, '\}')).Count
                $index++
                if ($opened -and $depth -le 0) {
                    break
                }
            }

            $blockText = $block -join "`r`n"
            if (Test-BrokenDReference $blockText) {
                $changed = $true
                continue
            }

            foreach ($item in $block) {
                $output.Add($item) | Out-Null
            }
        } else {
            $output.Add($line) | Out-Null
            $index++
        }
    }

    if ($changed) {
        Backup-File -Path $Path
        if ($PSCmdlet.ShouldProcess($Path, 'Rewrite VDF without broken D: library blocks')) {
            Set-Content -LiteralPath $Path -Value $output -Encoding UTF8
            Add-Result -List $updated -Message "Updated VDF: $Path"
        }
    }
}

function Clean-SteamLibraries {
    $files = @(
        'C:\Program Files (x86)\Steam\steamapps\libraryfolders.vdf',
        'C:\Program Files (x86)\Steam\config\libraryfolders.vdf'
    )

    foreach ($file in $files) {
        Remove-VdfBlocksWithBrokenDPath -Path $file
    }
}

function Clean-GameDvrHistory {
    $path = 'C:\Users\rndhr\AppData\Local\Microsoft\GameDVR\GameMRU\LocalMruGameList.json'
    if (-not (Test-Path -LiteralPath $path)) {
        return
    }

    try {
        $json = Get-Content -LiteralPath $path -Raw | ConvertFrom-Json
        $before = @($json.titles).Count
        $json.titles = @($json.titles | Where-Object { $_.ExePath -notlike 'D:\*' })
        $after = @($json.titles).Count

        if ($after -ne $before) {
            Backup-File -Path $path
            if ($PSCmdlet.ShouldProcess($path, 'Remove D: launch history entries')) {
                $json | ConvertTo-Json -Depth 8 -Compress | Set-Content -LiteralPath $path -Encoding UTF8
                Add-Result -List $updated -Message "Updated GameDVR MRU: $path"
            }
        }
    } catch {
        Add-Result -List $skipped -Message "Skipped GameDVR MRU: $path ($($_.Exception.Message))"
    }
}

function Clean-NvidiaScanPaths {
    $path = 'C:\Users\rndhr\AppData\Local\NVIDIA Corporation\NVIDIA App\NvBackend\config.xml'
    if (-not (Test-Path -LiteralPath $path)) {
        return
    }

    try {
        [xml]$xml = Get-Content -LiteralPath $path
        $settings = @($xml.BackendConfiguration.Setting | Where-Object { $_.name -eq 'ApplicationScanPaths' })
        if (-not $settings) {
            return
        }

        $changed = $false
        foreach ($setting in $settings) {
            $nodes = @($setting.ChildNodes | Where-Object { $_.Name -eq 'String' })
            foreach ($node in $nodes) {
                $text = $node.InnerText
                if (Test-BrokenDReference $text) {
                    $null = $setting.RemoveChild($node)
                    $changed = $true
                }
            }
        }

        if ($changed) {
            Backup-File -Path $path
            if ($PSCmdlet.ShouldProcess($path, 'Remove broken D: NVIDIA scan paths')) {
                $xml.Save($path)
                Add-Result -List $updated -Message "Updated NVIDIA config: $path"
            }
        }
    } catch {
        Add-Result -List $skipped -Message "Skipped NVIDIA config: $path ($($_.Exception.Message))"
    }
}

function Remove-OpggCache {
    $path = 'C:\Users\rndhr\AppData\Roaming\opgg-electron-app\store-web.json'
    if (-not (Test-Path -LiteralPath $path)) {
        return
    }

    try {
        $content = Get-Content -LiteralPath $path -Raw -ErrorAction Stop
        if (Test-BrokenDReference $content) {
            if ($PSCmdlet.ShouldProcess($path, 'Remove cache file containing stale D: entries')) {
                Remove-Item -LiteralPath $path -Force
                Add-Result -List $deleted -Message "Removed OPGG cache: $path"
            }
        }
    } catch {
        Add-Result -List $skipped -Message "Skipped OPGG cache: $path ($($_.Exception.Message))"
    }
}

function Remove-StaleLogs {
    $roots = @(
        'C:\Users\rndhr\AppData\Local\Battle.net\Logs',
        'C:\Users\rndhr\AppData\Roaming\Cognosphere\HYP\1_0\logs'
    )

    foreach ($root in $roots) {
        Get-ChildItem $root -File -ErrorAction SilentlyContinue | ForEach-Object {
            try {
                $content = Get-Content -LiteralPath $_.FullName -Raw -ErrorAction Stop
                if (Test-BrokenDReference $content) {
                    if ($PSCmdlet.ShouldProcess($_.FullName, 'Remove stale log containing D: path')) {
                        Remove-Item -LiteralPath $_.FullName -Force
                        Add-Result -List $deleted -Message "Removed log: $($_.FullName)"
                    }
                }
            } catch {
                Add-Result -List $skipped -Message "Skipped log: $($_.FullName) ($($_.Exception.Message))"
            }
        }
    }
}

function Remove-NikkeRegistryArtifacts {
    $paths = @(
        'HKCU:\Software\Classes\nikkelauncher',
        'HKCU:\Software\Classes\nikkelauncher\DefaultIcon',
        'HKCU:\Software\Classes\nikkelauncher\Shell\Open\Command',
        'HKCU:\Software\Microsoft\Windows\CurrentVersion\App Paths\nikke_launcher.exe',
        'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\nikke_launcher'
    )

    foreach ($path in $paths) {
        try {
            if ((Test-Path -LiteralPath $path) -and (Test-BrokenRegistryReference -RegistryPath $path)) {
                if ($PSCmdlet.ShouldProcess($path, 'Remove broken NIKKE registry key')) {
                    Export-RegistryKeyBackup -RegistryPath $path -Label ("nikke_" + (($path -replace '[:\\]', '_')))
                    Remove-Item -LiteralPath $path -Recurse -Force
                    Add-Result -List $deleted -Message "Removed NIKKE registry key: $path"
                }
            }
        } catch {
            Add-Result -List $skipped -Message "Skipped NIKKE registry key: $path ($($_.Exception.Message))"
        }
    }
}

function Remove-StaleNikkeFiles {
    $directFiles = @(
        'C:\Users\rndhr\AppData\Local\nikkeminiloader\Local.xml',
        'C:\Users\rndhr\AppData\Roaming\nikke_launcher.reg'
    )

    foreach ($path in $directFiles) {
        if (-not (Test-Path -LiteralPath $path)) {
            continue
        }

        try {
            $content = Get-Content -LiteralPath $path -Raw -ErrorAction Stop
            if (Test-BrokenDReference $content) {
                Backup-File -Path $path
                if ($PSCmdlet.ShouldProcess($path, 'Remove stale NIKKE path file')) {
                    Remove-Item -LiteralPath $path -Force
                    Add-Result -List $deleted -Message "Removed NIKKE path file: $path"
                }
            }
        } catch {
            Add-Result -List $skipped -Message "Skipped NIKKE path file: $path ($($_.Exception.Message))"
        }
    }

    $roots = @(
        'C:\Users\rndhr\AppData\Local\nikkeminiloader\Logs',
        'C:\Users\rndhr\AppData\Local\nikkeminiloader\tiny_dl\log',
        'C:\Users\rndhr\AppData\Roaming\nikke_launcher'
    )

    $extensions = @('.log', '.txt', '.json', '.xml', '.ini', '.cfg', '.dat', '.reg')

    Get-ChildItem $roots -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
        $extensions -contains $_.Extension.ToLowerInvariant()
    } | ForEach-Object {
        try {
            $content = Get-Content -LiteralPath $_.FullName -Raw -ErrorAction Stop
            if (Test-BrokenDReference $content) {
                if ($PSCmdlet.ShouldProcess($_.FullName, 'Remove stale NIKKE text/cache file containing D: path')) {
                    Remove-Item -LiteralPath $_.FullName -Force
                    Add-Result -List $deleted -Message "Removed NIKKE stale file: $($_.FullName)"
                }
            }
        } catch {
            Add-Result -List $skipped -Message "Skipped NIKKE stale file: $($_.FullName) ($($_.Exception.Message))"
        }
    }
}

function Remove-AdobeAcrobatChromeExtension {
    $paths = @(
        'C:\Users\rndhr\AppData\Local\Google\Chrome\User Data\Default\Extensions\efaidnbmnnnibpcajpcglclefindmkaj',
        'C:\Users\rndhr\AppData\Local\Google\Chrome\User Data\Profile 1\Extensions\efaidnbmnnnibpcajpcglclefindmkaj',
        'C:\Users\rndhr\AppData\Local\Google\Chrome\User Data\Profile 7\Extensions\efaidnbmnnnibpcajpcglclefindmkaj'
    )

    foreach ($path in $paths) {
        if (Test-Path -LiteralPath $path) {
            if ($PSCmdlet.ShouldProcess($path, 'Remove Adobe Acrobat Chrome extension folder')) {
                Remove-Item -LiteralPath $path -Recurse -Force
                Add-Result -List $deleted -Message "Removed Chrome extension folder: $path"
            }
        }
    }
}

Remove-DeadShortcuts
Remove-UninstallEntries
Remove-BrokenServices
Remove-EpicManifests
Clean-SteamLibraries
Clean-GameDvrHistory
Clean-NvidiaScanPaths
Remove-OpggCache
Remove-StaleLogs
Remove-NikkeRegistryArtifacts
Remove-StaleNikkeFiles

if ($AlsoRemoveAdobeAcrobatChromeExtension) {
    Remove-AdobeAcrobatChromeExtension
}

[pscustomobject]@{
    BackupRoot = $BackupRoot
    BackedUpCount = $backedUp.Count
    DeletedCount = $deleted.Count
    UpdatedCount = $updated.Count
    SkippedCount = $skipped.Count
    BackedUp = $backedUp
    Deleted = $deleted
    Updated = $updated
    Skipped = $skipped
} | Format-List
