@echo off
setlocal EnableExtensions

cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0windows-iis-https-proxy.ps1" %*
exit /b %ERRORLEVEL%
