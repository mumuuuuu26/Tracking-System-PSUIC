@echo off
setlocal EnableExtensions

cd /d "%~dp0"
if errorlevel 1 goto :err_cd

set "PM2_HOME=%CD%\.pm2"
if not exist "%PM2_HOME%" mkdir "%PM2_HOME%"

if not "%APPDATA%"=="" (
  set "PATH=%APPDATA%\npm;%PATH%"
)

for /f "usebackq tokens=1,* delims==" %%A in (`findstr /B "PORT=" ".env.production"`) do if /I "%%A"=="PORT" set "APP_PORT=%%B"
if not defined APP_PORT set "APP_PORT=5002"

echo ============================================
echo Tracking System Runtime Recovery
echo Project root: %CD%
echo PM2_HOME: %PM2_HOME%
echo ============================================

if not exist ".env.production" goto :err_env
if not exist "client\dist\index.html" goto :err_frontend_missing
if not exist "client\dist\assets" goto :err_frontend_missing

where pm2 >nul 2>&1
if errorlevel 1 goto :err_pm2_missing

echo [1/6] Restarting backend with PM2...
call pm2 describe tracking-system-backend >nul 2>&1
if errorlevel 1 (
  call pm2 start ecosystem.config.js --env production
) else (
  call pm2 restart tracking-system-backend --update-env
)
if errorlevel 1 goto :err_pm2_run

echo [2/6] Ensuring db-backup-cron process...
call pm2 start db-backup-cron --update-env >nul 2>&1
if errorlevel 1 (
  call pm2 start ecosystem.config.js --only db-backup-cron --env production >nul 2>&1
)
call pm2 save >nul

echo [3/6] Local health endpoint
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing http://127.0.0.1:%APP_PORT%/health -TimeoutSec 8; if ($r.Content.Trim() -eq 'OK') { exit 0 } else { exit 1 } } catch { exit 1 }"
if errorlevel 1 goto :err_health_local

echo [4/6] LAN health endpoint (10.135.2.226:%APP_PORT%)
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing http://10.135.2.226:%APP_PORT%/health -TimeoutSec 8; if ($r.Content.Trim() -eq 'OK') { exit 0 } else { exit 1 } } catch { exit 1 }"
if errorlevel 1 goto :err_health_lan

echo [5/6] Full runtime check
call windows-runtime-check.bat
if errorlevel 1 goto :err_runtime_check

echo [6/6] PM2 process status
call pm2 status

echo ============================================
echo Runtime recovery completed successfully.
echo ============================================
exit /b 0

:err_cd
echo [ERROR] Cannot change directory to script location.
exit /b 1

:err_env
echo [ERROR] .env.production not found in %CD%.
exit /b 1

:err_frontend_missing
echo [ERROR] Frontend bundle missing: client\dist\index.html or client\dist\assets.
echo [HINT] Upload client\dist from your Mac workspace first.
exit /b 1

:err_pm2_missing
echo [ERROR] pm2 not found in PATH.
echo [HINT] Install first: npm install -g pm2
exit /b 1

:err_pm2_run
echo [ERROR] PM2 start/restart failed.
exit /b 1

:err_health_local
echo [ERROR] Local health check failed.
exit /b 1

:err_health_lan
echo [ERROR] LAN health check failed.
exit /b 1

:err_runtime_check
echo [ERROR] windows-runtime-check.bat failed.
exit /b 1
