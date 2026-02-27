@echo off
setlocal EnableExtensions

REM Legacy wrapper retained for backward compatibility.
REM Route all deployments to the hardened root script.

cd /d "%~dp0\.."
if errorlevel 1 (
  echo [ERROR] Failed to switch to project root.
  exit /b 1
)

if not exist "windows-deploy.bat" (
  echo [ERROR] windows-deploy.bat not found in project root.
  exit /b 1
)

echo [INFO] Redirecting to windows-deploy.bat...
call windows-deploy.bat
exit /b %ERRORLEVEL%
