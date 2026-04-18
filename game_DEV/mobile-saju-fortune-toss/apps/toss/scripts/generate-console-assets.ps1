$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$assetsRoot = Join-Path $projectRoot 'assets\console'
$sourceRoot = Join-Path $projectRoot 'src\legacy\assets'
$iconPath = Join-Path $sourceRoot 'app-icon.png'

$cards = @(
  @{
    Output = 'app-logo.png'
    Width = 600
    Height = 600
    Background = $iconPath
    Title = $null
    Subtitle = $null
  },
  @{
    Output = 'thumbnail-square.png'
    Width = 1000
    Height = 1000
    Background = (Join-Path $sourceRoot 'backgrounds\bg-saju.png')
    Title = 'ASTRA'
    Subtitle = 'TODAY''S FORTUNE COMPANION'
  },
  @{
    Output = 'thumbnail-landscape.png'
    Width = 1932
    Height = 828
    Background = (Join-Path $sourceRoot 'backgrounds\bg-daily.png')
    Title = 'ASTRA'
    Subtitle = 'FORTUNE FROM DAILY FLOW TO DEEP READINGS'
  },
  @{
    Output = 'screenshot-portrait-1.png'
    Width = 636
    Height = 1048
    Background = (Join-Path $sourceRoot 'backgrounds\bg-daily.png')
    Title = 'TODAY'
    Subtitle = 'CHECK THE DAY AT A GLANCE'
  },
  @{
    Output = 'screenshot-portrait-2.png'
    Width = 636
    Height = 1048
    Background = (Join-Path $sourceRoot 'backgrounds\bg-saju.png')
    Title = 'SAJU'
    Subtitle = 'INPUT TO RESULT IN ONE FLOW'
  },
  @{
    Output = 'screenshot-portrait-3.png'
    Width = 636
    Height = 1048
    Background = (Join-Path $sourceRoot 'backgrounds\bg-iching.png')
    Title = 'TAROT + ICHING'
    Subtitle = 'INTUITIVE AND QUESTION FLOWS'
  }
)

function New-ColorBrush([string]$html) {
  return New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($html))
}

function Draw-CoverImage {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Image]$Image,
    [int]$TargetWidth,
    [int]$TargetHeight
  )

  $scale = [Math]::Max($TargetWidth / $Image.Width, $TargetHeight / $Image.Height)
  $drawWidth = [int][Math]::Ceiling($Image.Width * $scale)
  $drawHeight = [int][Math]::Ceiling($Image.Height * $scale)
  $drawX = [int](($TargetWidth - $drawWidth) / 2)
  $drawY = [int](($TargetHeight - $drawHeight) / 2)
  $Graphics.DrawImage($Image, $drawX, $drawY, $drawWidth, $drawHeight)
}

if (-not (Test-Path $assetsRoot)) {
  New-Item -ItemType Directory -Path $assetsRoot | Out-Null
}

$icon = [System.Drawing.Image]::FromFile($iconPath)

foreach ($card in $cards) {
  $bitmap = New-Object System.Drawing.Bitmap $card.Width, $card.Height
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  $backgroundBrush = New-ColorBrush '#151515'
  $graphics.FillRectangle($backgroundBrush, 0, 0, $card.Width, $card.Height)

  if ($card.Background -and (Test-Path $card.Background)) {
    $background = [System.Drawing.Image]::FromFile($card.Background)
    Draw-CoverImage -Graphics $graphics -Image $background -TargetWidth $card.Width -TargetHeight $card.Height
    if ($card.Title) {
      $overlayBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(120, 13, 13, 13))
      $graphics.FillRectangle($overlayBrush, 0, 0, $card.Width, $card.Height)
      $overlayBrush.Dispose()
    }
    $background.Dispose()
  }

  $panelBrush = $null
  $centerFormat = $null
  $whiteBrush = $null
  $goldBrush = $null
  $subtitleFont = $null
  $titleFont = $null

  if ($card.Title) {
    $panelWidth = [Math]::Round($card.Width * 0.78)
    $panelHeight = [Math]::Round($card.Height * 0.38)
    $panelX = [Math]::Round(($card.Width - $panelWidth) / 2)
    $panelY = [Math]::Round($card.Height * 0.47)
    $panelBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(180, 18, 18, 18))
    $graphics.FillRectangle($panelBrush, $panelX, $panelY, $panelWidth, $panelHeight)

    $iconSize = [Math]::Round([Math]::Min($card.Width, $card.Height) * 0.24)
    if ($card.Width -ge 1000) {
      $iconSize = [Math]::Round([Math]::Min($card.Width, $card.Height) * 0.22)
    }
    $iconX = [Math]::Round(($card.Width - $iconSize) / 2)
    $iconY = [Math]::Round($card.Height * 0.12)
    $graphics.DrawImage($icon, $iconX, $iconY, $iconSize, $iconSize)

    $titleFontSize = [Math]::Round([Math]::Min($card.Width, $card.Height) * 0.08)
    $subtitleFontSize = [Math]::Round([Math]::Min($card.Width, $card.Height) * 0.035)
    if ($card.Width -gt $card.Height) {
      $titleFontSize = [Math]::Round($card.Height * 0.16)
      $subtitleFontSize = [Math]::Round($card.Height * 0.06)
    }

    $titleFont = New-Object System.Drawing.Font 'Segoe UI', $titleFontSize, ([System.Drawing.FontStyle]::Bold)
    $subtitleFont = New-Object System.Drawing.Font 'Segoe UI', $subtitleFontSize, ([System.Drawing.FontStyle]::Regular)
    $goldBrush = New-ColorBrush '#F7C948'
    $whiteBrush = New-ColorBrush '#F5F1E8'

    $titleRect = New-Object System.Drawing.RectangleF ($panelX + 32), ($panelY + 28), ($panelWidth - 64), ($panelHeight * 0.36)
    $subtitleRect = New-Object System.Drawing.RectangleF ($panelX + 32), ($panelY + ($panelHeight * 0.46)), ($panelWidth - 64), ($panelHeight * 0.34)
    $centerFormat = New-Object System.Drawing.StringFormat
    $centerFormat.Alignment = [System.Drawing.StringAlignment]::Center
    $centerFormat.LineAlignment = [System.Drawing.StringAlignment]::Center

    $graphics.DrawString($card.Title, $titleFont, $goldBrush, $titleRect, $centerFormat)
    $graphics.DrawString($card.Subtitle, $subtitleFont, $whiteBrush, $subtitleRect, $centerFormat)
  }

  $outputPath = Join-Path $assetsRoot $card.Output
  $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

  if ($centerFormat) { $centerFormat.Dispose() }
  if ($whiteBrush) { $whiteBrush.Dispose() }
  if ($goldBrush) { $goldBrush.Dispose() }
  if ($subtitleFont) { $subtitleFont.Dispose() }
  if ($titleFont) { $titleFont.Dispose() }
  if ($panelBrush) { $panelBrush.Dispose() }
  $backgroundBrush.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}

$icon.Dispose()

Write-Output "Generated console assets at $assetsRoot"
