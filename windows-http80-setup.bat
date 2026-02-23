@echo off
setlocal EnableExtensions

cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0windows-http80-setup.ps1" %*
exit /b %ERRORLEVEL%
