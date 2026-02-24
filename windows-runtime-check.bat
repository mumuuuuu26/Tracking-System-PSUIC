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

echo [1/6] PM2 status
pm2 status
if errorlevel 1 goto :err_pm2
echo.

echo [2/6] Local health endpoint
powershell -NoProfile -Command "(Invoke-WebRequest -UseBasicParsing http://127.0.0.1:%APP_PORT%/health -TimeoutSec 8).Content"
if errorlevel 1 goto :err_health_local
echo.

echo [3/6] LAN health endpoint (10.135.2.226:%APP_PORT%)
powershell -NoProfile -Command "(Invoke-WebRequest -UseBasicParsing http://10.135.2.226:%APP_PORT%/health -TimeoutSec 8).Content"
if errorlevel 1 goto :err_health_lan
echo.

echo [4/6] Listening port %APP_PORT%
netstat -ano | findstr /R /C:":%APP_PORT% .*LISTENING"
echo.

echo [5/6] Firewall rule TrackingSystem80
netsh advfirewall firewall show rule name="TrackingSystem80"
echo.

echo [6/6] Frontend root status
curl -I http://127.0.0.1:%APP_PORT%/
if errorlevel 1 goto :err_root
echo.

echo [7/7] PM2 startup task status
schtasks /Query /TN "TrackingSystem-PM2-Resurrect"
if errorlevel 1 echo [WARN] Startup task not found. Run windows-enable-pm2-startup.bat as Administrator.
echo.

echo ============================================
echo Runtime check finished successfully.
echo ============================================
exit /b 0

:err_pm2
echo [ERROR] PM2 status failed.
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
