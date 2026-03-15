@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0workspace-control.ps1" %*
