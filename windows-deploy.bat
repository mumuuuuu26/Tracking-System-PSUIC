@echo off
setlocal EnableExtensions

REM One-click production deploy for Windows server.
REM Run this file inside C:\xampp\htdocs\app\server after SFTP upload.

cd /d "%~dp0"
if errorlevel 1 goto :err_cd

set "PM2_HOME=%CD%\.pm2"
if not exist "%PM2_HOME%" mkdir "%PM2_HOME%"

echo ============================================
echo Tracking System Windows Deploy
echo Project root: %CD%
echo PM2_HOME: %PM2_HOME%
echo ============================================

if not exist "package.json" goto :err_pkg
if not exist ".env.production" goto :err_env

if not exist "client\dist\index.html" goto :err_client_dist_missing
if not exist "client\dist\assets" goto :err_client_dist_missing

for /f "usebackq tokens=1,* delims==" %%A in (`findstr /B "DATABASE_URL=" ".env.production"`) do if /I "%%A"=="DATABASE_URL" set "DATABASE_URL=%%B"
if not defined DATABASE_URL goto :err_database_url

for /f "usebackq tokens=1,* delims==" %%A in (`findstr /B "PORT=" ".env.production"`) do if /I "%%A"=="PORT" set "APP_PORT=%%B"
if not defined APP_PORT set "APP_PORT=5002"

where node >nul 2>&1
if errorlevel 1 goto :err_node

where npm >nul 2>&1
if errorlevel 1 goto :err_npm

set "DIST_CHECK_CODE=0"
powershell -NoProfile -Command "if (-not (Test-Path 'client/dist/index.html')) { exit 11 }; if (-not (Test-Path 'client/dist/assets')) { exit 12 }; $f = Get-ChildItem 'client/dist/assets' -Filter 'Dashboard-*.js' | Sort-Object LastWriteTime -Descending | Select-Object -First 1; if (-not $f) { exit 2 }; if ((Get-Content $f.FullName -Raw).Contains('All Ticket')) { exit 0 } else { exit 2 }"
set "DIST_CHECK_CODE=%ERRORLEVEL%"
if "%DIST_CHECK_CODE%"=="11" goto :err_client_dist_missing
if "%DIST_CHECK_CODE%"=="12" goto :err_client_dist_missing
if not "%DIST_CHECK_CODE%"=="0" if not "%DIST_CHECK_CODE%"=="2" goto :err_client_dist_check
if "%DIST_CHECK_CODE%"=="2" (
  echo [WARN] Dashboard UI marker "All Ticket" was not found in latest Dashboard chunk.
  echo [WARN] Frontend may still be an old build. Continue for backend-only recovery.
)

echo [0/8] Repairing .env.production file structure...
call npm run fix:env:file:prod
if errorlevel 1 goto :err_env_file_fix

echo [0/8] Validating .env.production file structure...
call npm run validate:env:file:prod
if errorlevel 1 goto :err_env_file

set "DEPLOY_STATE_DIR=.deploy-state"
if not exist "%DEPLOY_STATE_DIR%" mkdir "%DEPLOY_STATE_DIR%"
set "LOCK_HASH_FILE=%DEPLOY_STATE_DIR%\package-lock.sha256"
set "RUN_NPM_CI=0"

for /f %%H in ('powershell -NoProfile -Command "(Get-FileHash -LiteralPath package-lock.json -Algorithm SHA256).Hash.ToLowerInvariant()"') do set "CURRENT_LOCK_HASH=%%H"
if not defined CURRENT_LOCK_HASH goto :err_lock_hash

if not exist "node_modules" (
  echo [INFO] node_modules not found. npm ci is required.
  set "RUN_NPM_CI=1"
) else if not exist "%LOCK_HASH_FILE%" (
  echo [INFO] No previous package-lock hash found. npm ci is required.
  set "RUN_NPM_CI=1"
) else (
  set /p PREV_LOCK_HASH=<"%LOCK_HASH_FILE%"
  if /I not "%PREV_LOCK_HASH%"=="%CURRENT_LOCK_HASH%" (
    echo [INFO] package-lock.json changed. npm ci is required.
    set "RUN_NPM_CI=1"
  ) else (
    echo [INFO] package-lock.json unchanged. Skipping npm ci.
  )
)

if not "%APPDATA%"=="" (
  set "PATH=%APPDATA%\npm;%PATH%"
)

where pm2 >nul 2>&1
if errorlevel 1 (
  echo [INFO] pm2 not found. Installing globally...
  call npm install -g pm2
  if errorlevel 1 goto :err_pm2_install
  if not "%APPDATA%"=="" (
    set "PATH=%APPDATA%\npm;%PATH%"
  )
  where pm2 >nul 2>&1
  if errorlevel 1 goto :err_pm2_path
)

if not exist "uploads" mkdir "uploads"
if not exist "backups\uploads" mkdir "backups\uploads"

set "MYSQL_SERVICE=MySQLXampp"
sc query "%MYSQL_SERVICE%" >nul 2>&1
if errorlevel 1 set "MYSQL_SERVICE=MySQL"

sc query "%MYSQL_SERVICE%" >nul 2>&1
if errorlevel 1 goto :mysql_not_found

sc query "%MYSQL_SERVICE%" | findstr /I "RUNNING" >nul
if not errorlevel 1 goto :mysql_ok

echo [INFO] Starting service %MYSQL_SERVICE%...
net start "%MYSQL_SERVICE%" >nul 2>&1
if errorlevel 1 goto :err_mysql_start

:mysql_ok
echo [INFO] MySQL service ready: %MYSQL_SERVICE%
goto :deps

:mysql_not_found
echo [WARN] MySQL service (MySQLXampp/MySQL) not found. Ensure DB is already running.

:deps
if /I "%RUN_NPM_CI%"=="1" goto :deps_install

echo [1/8] Installing dependencies with npm ci...
echo [INFO] Skipped (no dependency changes).
goto :deps_generate

:deps_install
call pm2 describe tracking-system-backend >nul 2>&1
if errorlevel 1 goto :deps_install_run
echo [INFO] Stopping tracking-system-backend temporarily for clean npm ci...
call pm2 stop tracking-system-backend >nul

:deps_install_run
echo [1/8] Installing dependencies with npm ci...
set "PRISMA_SKIP_POSTINSTALL_GENERATE=1"
call npm ci
set "PRISMA_SKIP_POSTINSTALL_GENERATE="
if errorlevel 1 goto :err_npm_ci
>"%LOCK_HASH_FILE%" echo %CURRENT_LOCK_HASH%

:deps_generate

echo [2/8] Generating Prisma client (safe mode)...
if not defined PRISMA_ALLOW_INSECURE_TLS_FALLBACK (
  set "PRISMA_ALLOW_INSECURE_TLS_FALLBACK=true"
)
call node scripts\prisma-generate-safe.js
if errorlevel 1 goto :err_prisma_generate

echo [3/8] Validating production environment...
call npm run validate:env:prod
if errorlevel 1 goto :err_validate_env

echo [INFO] Checking Google Calendar integration readiness...
call npm run check:google:prod
if errorlevel 1 (
  echo [WARN] Google Calendar integration is not ready.
  echo [WARN] IT Schedule sync will fail until GOOGLE_* in .env.production is fixed.
)

echo [4/8] Checking database readiness...
call npm run preflight:db:prod
if errorlevel 1 goto :err_preflight_db

echo [5/8] Checking storage readiness...
call npm run preflight:storage:prod
if errorlevel 1 goto :err_preflight_storage

echo [6/8] Applying migrations (SQL mode, no Prisma engine download)...
call npm run migrate:sql:prod
if errorlevel 1 goto :err_migrate

echo [7/8] Restarting backend with PM2...
call pm2 describe tracking-system-backend >nul 2>&1
if errorlevel 1 goto :pm2_start

call pm2 restart tracking-system-backend --update-env
if errorlevel 1 goto :err_pm2_run
goto :pm2_done

:pm2_start
call pm2 start ecosystem.config.js --env production
if errorlevel 1 goto :err_pm2_run

:pm2_done
call pm2 start db-backup-cron --update-env >nul 2>&1
if errorlevel 1 (
  call pm2 start ecosystem.config.js --only db-backup-cron --env production >nul 2>&1
)
call pm2 save >nul
call pm2 status

echo [8/8] Configuring PM2 auto-resurrect on startup...
call powershell -NoProfile -ExecutionPolicy Bypass -File ".\windows-enable-pm2-startup.ps1" -AppDir "%CD%" >nul 2>&1
if errorlevel 1 (
  echo [WARN] Could not configure PM2 startup task automatically.
  echo [WARN] Run as Administrator: .\windows-enable-pm2-startup.bat
) else (
  echo [INFO] PM2 startup task configured.
)

echo [HEALTH] Checking http://127.0.0.1:%APP_PORT%/health ...
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing http://127.0.0.1:%APP_PORT%/health -TimeoutSec 8; if ($r.Content.Trim() -eq 'OK') { exit 0 } else { exit 1 } } catch { exit 1 }"
if errorlevel 1 goto :err_health

echo ============================================
echo Deploy completed successfully.
echo ============================================
exit /b 0

:err_cd
echo [ERROR] Cannot change directory to script location.
exit /b 1

:err_pkg
echo [ERROR] package.json not found in %CD%
exit /b 1

:err_env
echo [ERROR] .env.production not found in %CD%
echo [HINT] Create C:\xampp\htdocs\app\server\.env.production first.
exit /b 1

:err_database_url
echo [ERROR] DATABASE_URL not found in .env.production
exit /b 1

:err_node
echo [ERROR] node is not available in PATH.
exit /b 1

:err_npm
echo [ERROR] npm is not available in PATH.
exit /b 1

:err_client_dist_missing
echo [ERROR] Frontend bundle missing: client\dist\index.html or client\dist\assets not found.
echo [HINT] Upload client\dist from your Mac workspace first.
echo [HINT] Use: sftp -b deploy.sftp psuic@10.135.2.226
exit /b 1

:err_client_dist_check
echo [ERROR] Frontend bundle verification failed unexpectedly.
exit /b 1

:err_env_file
echo [ERROR] .env.production has invalid structure.
echo [HINT] Ensure each KEY=VALUE is on its own line, especially GOOGLE_PRIVATE_KEY.
exit /b 1

:err_env_file_fix
echo [ERROR] Auto-fix for .env.production failed.
echo [HINT] Check malformed GOOGLE_PRIVATE_KEY or duplicated keys in .env.production.
exit /b 1

:err_lock_hash
echo [ERROR] Failed to read package-lock.json hash.
exit /b 1

:err_pm2_install
echo [ERROR] Failed to install pm2 globally.
exit /b 1

:err_pm2_path
echo [ERROR] pm2 installed but not found in PATH.
echo [HINT] Run this once: set PATH=%%APPDATA%%\npm;%%PATH%%
exit /b 1

:err_mysql_start
echo [ERROR] Failed to start MySQL service %MYSQL_SERVICE%.
exit /b 1

:err_npm_ci
echo [ERROR] npm ci failed.
exit /b 1

:err_prisma_generate
echo [ERROR] Safe Prisma generate failed.
exit /b 1

:err_validate_env
echo [ERROR] validate:env:prod failed.
exit /b 1

:err_preflight_db
echo [ERROR] preflight:db:prod failed.
exit /b 1

:err_preflight_storage
echo [ERROR] preflight:storage:prod failed.
exit /b 1

:err_migrate
echo [ERROR] SQL migration apply failed.
exit /b 1

:err_pm2_run
echo [ERROR] PM2 start/restart failed.
exit /b 1

:err_health
echo [ERROR] Health check failed.
exit /b 1
