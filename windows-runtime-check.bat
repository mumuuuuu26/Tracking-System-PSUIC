@echo off
setlocal EnableExtensions

cd /d "%~dp0"
set "PM2_HOME=%CD%\.pm2"

for /f "usebackq tokens=1,* delims==" %%A in (`findstr /B "PORT=" ".env.production"`) do if /I "%%A"=="PORT" set "APP_PORT=%%B"
if not defined APP_PORT set "APP_PORT=5002"

echo ============================================
echo Tracking System Runtime Check
echo ============================================
echo.

echo [0/8] Frontend bundle files
if not exist "client\dist\index.html" goto :err_frontend_missing
if not exist "client\dist\assets" goto :err_frontend_missing
node scripts\check-frontend-dist.js
if errorlevel 1 goto :err_frontend_check
echo.

echo [1/8] PM2 status
pm2 status
if errorlevel 1 goto :err_pm2
echo.

echo [2/8] Backup scheduler policy
for /f "usebackq tokens=1,* delims==" %%A in (`findstr /B "DB_BACKUP_CRON=" ".env.production"`) do if /I "%%A"=="DB_BACKUP_CRON" set "DB_BACKUP_CRON=%%B"
if not defined DB_BACKUP_CRON set "DB_BACKUP_CRON=0 3 * * *"
call pm2 describe db-backup-cron >nul 2>&1
if not errorlevel 1 (
  echo [WARN] Legacy PM2 app db-backup-cron still exists. Backup should run via backend scheduler.
) else (
  echo [INFO] Backups are handled by backend scheduler (DB_BACKUP_CRON=%DB_BACKUP_CRON%).
)
echo.

echo [3/8] Local health endpoint
powershell -NoProfile -Command "(Invoke-WebRequest -UseBasicParsing http://127.0.0.1:%APP_PORT%/health -TimeoutSec 8).Content"
if errorlevel 1 goto :err_health_local
echo.

echo [4/8] LAN health endpoint (10.135.2.226:%APP_PORT%)
powershell -NoProfile -Command "(Invoke-WebRequest -UseBasicParsing http://10.135.2.226:%APP_PORT%/health -TimeoutSec 8).Content"
if errorlevel 1 goto :err_health_lan
echo.

echo [5/8] Listening port %APP_PORT%
netstat -ano | findstr /R /C:":%APP_PORT% .*LISTENING"
echo.

echo [6/8] Firewall rule TrackingSystem80
netsh advfirewall firewall show rule name="TrackingSystem80"
echo.

echo [7/8] Frontend root status
curl -I http://127.0.0.1:%APP_PORT%/
if errorlevel 1 goto :err_root
echo.

echo [8/8] PM2 startup task status
schtasks /Query /TN "TrackingSystem-PM2-Resurrect"
if errorlevel 1 echo [WARN] Startup task not found. Run windows-enable-pm2-startup.bat as Administrator.
echo.

echo [INFO] Latest frontend entry chunk
for /f %%F in ('dir /b /o-d "client\dist\assets\index-*.js" 2^>nul') do (
  echo [INFO] Latest entry chunk: %%F
  goto :after_index_chunk
)
echo [WARN] No index-* entry chunk found in client\dist\assets
:after_index_chunk
echo.

echo ============================================
echo Runtime check finished successfully.
echo ============================================
exit /b 0

:err_pm2
echo [ERROR] PM2 status failed.
exit /b 1

:err_frontend_missing
echo [ERROR] Frontend bundle missing: client\dist\index.html or client\dist\assets.
echo [HINT] Upload client\dist from your Mac workspace before runtime check.
exit /b 1

:err_frontend_check
echo [ERROR] Frontend bundle integrity check failed.
exit /b 1

:err_health_local
echo [ERROR] Local health check failed.
exit /b 1

:err_health_lan
echo [ERROR] LAN health check failed.
exit /b 1

:err_root
echo [ERROR] Frontend root check failed.
exit /b 1
