@echo off
setlocal EnableExtensions

cd /d "%~dp0"
set "PM2_HOME=%CD%\.pm2"
if not exist "%PM2_HOME%" mkdir "%PM2_HOME%"

set "PM2_CMD=%APPDATA%\npm\pm2.cmd"
if not exist "%PM2_CMD%" set "PM2_CMD=C:\Users\PSUIC\AppData\Roaming\npm\pm2.cmd"

if not exist "%PM2_CMD%" (
  echo [PM2 RESURRECT] pm2.cmd not found.
  exit /b 1
)

call "%PM2_CMD%" resurrect
set "RC=%ERRORLEVEL%"
if not "%RC%"=="0" exit /b %RC%

call "%PM2_CMD%" save >nul 2>&1
exit /b 0
