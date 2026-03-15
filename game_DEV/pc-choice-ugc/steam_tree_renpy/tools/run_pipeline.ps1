param(
  [string]$Source = "content/story_tree.json",
  [string]$Target = "project/game/ugc/story_tree.json",
  [switch]$Strict
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $root "..")

Write-Host "[pipeline] validate tree"
python tools/validate_tree.py $Source

Write-Host "[pipeline] build runtime json"
$strictArg = ""
if ($Strict) {
  $strictArg = "--strict"
}
python tools/build_renpy_story.py --source $Source --target $Target $strictArg

Write-Host "[pipeline] done"
