$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

python -m pip install --upgrade pip
python -m pip install pyinstaller -r requirements.txt

Push-Location "..\\pc-choice-ugc"
npm run build
Pop-Location

if (Test-Path ".\\web_dist") {
  Remove-Item -Recurse -Force ".\\web_dist"
}
Copy-Item -Recurse -Force "..\\pc-choice-ugc\\dist" ".\\web_dist"

pyinstaller --noconfirm --windowed --name UGCStudio --add-data "assets;assets" --add-data "web_dist;web_dist" launch_full_ugc.py

Write-Host "Build complete: dist/UGCStudio/UGCStudio.exe"
