param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$FlutterArgs
)

$ErrorActionPreference = 'Stop'

function Resolve-FlutterBat {
  if ($env:FLUTTER_ROOT) {
    $candidate = Join-Path $env:FLUTTER_ROOT 'bin\flutter.bat'
    if (Test-Path $candidate) { return $candidate }
  }

  $localProps = Join-Path $PSScriptRoot '..\android\local.properties'
  if (Test-Path $localProps) {
    $line = Select-String -Path $localProps -Pattern '^flutter\.sdk=' | Select-Object -First 1
    if ($line) {
      $raw = ($line.Line -replace '^flutter\.sdk=', '').Trim()
      if ($raw) {
        $sdkPath = $raw -replace '\\\\', '\'
        $candidate = Join-Path $sdkPath 'bin\flutter.bat'
        if (Test-Path $candidate) { return $candidate }
      }
    }
  }

  $fallback = 'C:\Users\rndhr\flutter\bin\flutter.bat'
  if (Test-Path $fallback) { return $fallback }

  throw "flutter.bat를 찾지 못했습니다. FLUTTER_ROOT 또는 android/local.properties의 flutter.sdk를 확인하세요."
}

$flutterBat = Resolve-FlutterBat
Write-Host "[flutterw] Using: $flutterBat"
& $flutterBat @FlutterArgs
exit $LASTEXITCODE
