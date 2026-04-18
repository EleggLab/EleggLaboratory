$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$appDir = Split-Path -Parent $PSScriptRoot
$targetDir = Join-Path $appDir 'assets\user-provided\tabbar'
New-Item -ItemType Directory -Force -Path $targetDir | Out-Null

function New-IconCanvas {
  param([int]$Size = 128)

  $bitmap = New-Object System.Drawing.Bitmap $Size, $Size
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

  return @{
    Bitmap = $bitmap
    Graphics = $graphics
  }
}

function Save-Icon {
  param(
    [Parameter(Mandatory = $true)]$Canvas,
    [Parameter(Mandatory = $true)][string]$FileName
  )

  $path = Join-Path $targetDir $FileName
  $Canvas.Bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $Canvas.Graphics.Dispose()
  $Canvas.Bitmap.Dispose()
}

function New-Pen {
  param(
    [string]$Hex = '#F2F1EF',
    [float]$Width = 8
  )

  $color = [System.Drawing.ColorTranslator]::FromHtml($Hex)
  $pen = New-Object System.Drawing.Pen($color, $Width)
  $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  return $pen
}

function Get-RoundedRectPath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $diameter = $Radius * 2
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function Draw-SunIcon {
  $canvas = New-IconCanvas
  $g = $canvas.Graphics
  $pen = New-Pen -Width 8

  $g.DrawEllipse($pen, 38, 38, 52, 52)
  foreach ($ray in @(
      @(64, 16, 64, 28),
      @(64, 100, 64, 112),
      @(16, 64, 28, 64),
      @(100, 64, 112, 64),
      @(30, 30, 39, 39),
      @(89, 89, 98, 98),
      @(30, 98, 39, 89),
      @(89, 39, 98, 30)
    )) {
    $g.DrawLine($pen, $ray[0], $ray[1], $ray[2], $ray[3])
  }

  Save-Icon -Canvas $canvas -FileName 'daily-sun.png'
}

function Draw-SparkleIcon {
  $canvas = New-IconCanvas
  $g = $canvas.Graphics
  $pen = New-Pen -Width 8

  $g.DrawLine($pen, 64, 20, 64, 108)
  $g.DrawLine($pen, 20, 64, 108, 64)
  $g.DrawLine($pen, 34, 34, 94, 94)
  $g.DrawLine($pen, 34, 94, 94, 34)
  $g.DrawEllipse($pen, 90, 18, 18, 18)

  Save-Icon -Canvas $canvas -FileName 'tarot-sparkle.png'
}

function Draw-HouseIcon {
  $canvas = New-IconCanvas
  $g = $canvas.Graphics
  $pen = New-Pen -Width 8

  $roof = [System.Drawing.PointF[]]@(
    (New-Object System.Drawing.PointF(25, 60)),
    (New-Object System.Drawing.PointF(64, 26)),
    (New-Object System.Drawing.PointF(103, 60))
  )
  $g.DrawLines($pen, $roof)
  $g.DrawRectangle($pen, 34, 58, 60, 44)
  $g.DrawLine($pen, 64, 102, 64, 74)

  Save-Icon -Canvas $canvas -FileName 'home-house.png'
}

function Draw-GridIcon {
  $canvas = New-IconCanvas
  $g = $canvas.Graphics
  $pen = New-Pen -Width 7

  foreach ($cell in @(
      @(24, 24),
      @(66, 24),
      @(24, 66),
      @(66, 66)
    )) {
    $path = Get-RoundedRectPath -X $cell[0] -Y $cell[1] -Width 26 -Height 26 -Radius 7
    $g.DrawPath($pen, $path)
    $path.Dispose()
  }

  Save-Icon -Canvas $canvas -FileName 'saju-grid.png'
}

function Draw-ClockIcon {
  $canvas = New-IconCanvas
  $g = $canvas.Graphics
  $pen = New-Pen -Width 8

  $g.DrawEllipse($pen, 24, 24, 80, 80)
  $g.DrawLine($pen, 64, 64, 64, 40)
  $g.DrawLine($pen, 64, 64, 82, 72)

  Save-Icon -Canvas $canvas -FileName 'iching-clock.png'
}

Draw-SunIcon
Draw-SparkleIcon
Draw-HouseIcon
Draw-GridIcon
Draw-ClockIcon
