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
powershell -NoProfile -Command "$f = Get-ChildItem 'client/dist/assets' -Filter 'Dashboard-*.js' | Sort-Object LastWriteTime -Descending | Select-Object -First 1; if (-not $f) { exit 2 }; if ((Get-Content $f.FullName -Raw).Contains('All Ticket')) { exit 0 } else { exit 2 }"
set "FRONTEND_CHECK_CODE=%ERRORLEVEL%"
if not "%FRONTEND_CHECK_CODE%"=="0" if not "%FRONTEND_CHECK_CODE%"=="2" goto :err_frontend_check
if "%FRONTEND_CHECK_CODE%"=="2" (
  echo [WARN] Dashboard UI marker "All Ticket" not found in latest Dashboard chunk.
  echo [WARN] UI may still be old build.
) else (
  echo [INFO] Dashboard UI marker "All Ticket" found.
)
echo.

echo [1/8] PM2 status
pm2 status
if errorlevel 1 goto :err_pm2
echo.

echo [2/8] Local health endpoint
powershell -NoProfile -Command "(Invoke-WebRequest -UseBasicParsing http://127.0.0.1:%APP_PORT%/health -TimeoutSec 8).Content"
if errorlevel 1 goto :err_health_local
echo.

echo [3/8] LAN health endpoint (10.135.2.226:%APP_PORT%)
powershell -NoProfile -Command "(Invoke-WebRequest -UseBasicParsing http://10.135.2.226:%APP_PORT%/health -TimeoutSec 8).Content"
if errorlevel 1 goto :err_health_lan
echo.

echo [4/8] Listening port %APP_PORT%
netstat -ano | findstr /R /C:":%APP_PORT% .*LISTENING"
echo.

echo [5/8] Firewall rule TrackingSystem80
netsh advfirewall firewall show rule name="TrackingSystem80"
echo.

echo [6/8] Frontend root status
curl -I http://127.0.0.1:%APP_PORT%/
if errorlevel 1 goto :err_root
echo.

echo [7/8] PM2 startup task status
schtasks /Query /TN "TrackingSystem-PM2-Resurrect"
if errorlevel 1 echo [WARN] Startup task not found. Run windows-enable-pm2-startup.bat as Administrator.
echo.

echo [8/8] Latest Dashboard chunk
for /f %%F in ('dir /b /o-d "client\dist\assets\Dashboard-*.js" 2^>nul') do (
  echo [INFO] Latest Dashboard chunk: %%F
  goto :after_dashboard_chunk
)
echo [WARN] No Dashboard chunk found in client\dist\assets
:after_dashboard_chunk
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
echo [ERROR] Frontend bundle marker check failed unexpectedly.
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
