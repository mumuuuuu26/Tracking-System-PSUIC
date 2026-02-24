@echo off
setlocal EnableExtensions
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File ".\windows-enable-pm2-startup.ps1" -AppDir "%CD%"
exit /b %errorlevel%
