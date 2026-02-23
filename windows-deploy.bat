@echo off
setlocal EnableExtensions

REM One-click production deploy for Windows server.
REM Run this file inside C:\xampp\htdocs\app\server after SFTP upload.

cd /d "%~dp0"
if errorlevel 1 goto :err_cd

echo ============================================
echo Tracking System Windows Deploy
echo Project root: %CD%
echo ============================================

if not exist "package.json" goto :err_pkg
if not exist ".env.production" goto :err_env

for /f "usebackq tokens=1,* delims==" %%A in (`findstr /B "DATABASE_URL=" ".env.production"`) do if /I "%%A"=="DATABASE_URL" set "DATABASE_URL=%%B"
if not defined DATABASE_URL goto :err_database_url

where node >nul 2>&1
if errorlevel 1 goto :err_node

where npm >nul 2>&1
if errorlevel 1 goto :err_npm

where npx >nul 2>&1
if errorlevel 1 goto :err_npx

where pm2 >nul 2>&1
if errorlevel 1 (
  echo [INFO] pm2 not found. Installing globally...
  call npm install -g pm2
  if errorlevel 1 goto :err_pm2_install
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
call pm2 describe tracking-system-backend >nul 2>&1
if errorlevel 1 goto :deps_install
echo [INFO] Stopping tracking-system-backend temporarily for clean npm ci...
call pm2 stop tracking-system-backend >nul

:deps_install
echo [1/7] Installing dependencies with npm ci...
call npm ci
if errorlevel 1 goto :err_npm_ci

echo [2/7] Generating Prisma client...
call npx --no-install prisma generate
if errorlevel 1 goto :err_prisma_generate

echo [3/7] Validating production environment...
call npm run validate:env:prod
if errorlevel 1 goto :err_validate_env

echo [4/7] Checking database readiness...
call npm run preflight:db:prod
if errorlevel 1 goto :err_preflight_db

echo [5/7] Checking storage readiness...
call npm run preflight:storage:prod
if errorlevel 1 goto :err_preflight_storage

echo [6/7] Applying Prisma migrations...
call npx --no-install prisma migrate deploy
if errorlevel 1 goto :err_migrate

echo [7/7] Restarting backend with PM2...
call pm2 describe tracking-system-backend >nul 2>&1
if errorlevel 1 goto :pm2_start

call pm2 restart tracking-system-backend --update-env
if errorlevel 1 goto :err_pm2_run
goto :pm2_done

:pm2_start
call pm2 start ecosystem.config.js --env production
if errorlevel 1 goto :err_pm2_run

:pm2_done
call pm2 save >nul
call pm2 status

echo [HEALTH] Checking http://127.0.0.1:5002/health ...
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing http://127.0.0.1:5002/health -TimeoutSec 8; if ($r.Content.Trim() -eq 'OK') { exit 0 } else { exit 1 } } catch { exit 1 }"
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

:err_npx
echo [ERROR] npx is not available in PATH.
exit /b 1

:err_pm2_install
echo [ERROR] Failed to install pm2 globally.
exit /b 1

:err_mysql_start
echo [ERROR] Failed to start MySQL service %MYSQL_SERVICE%.
exit /b 1

:err_npm_ci
echo [ERROR] npm ci failed.
exit /b 1

:err_prisma_generate
echo [ERROR] npx prisma generate failed.
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
echo [ERROR] npx prisma migrate deploy failed.
exit /b 1

:err_pm2_run
echo [ERROR] PM2 start/restart failed.
exit /b 1

:err_health
echo [ERROR] Health check failed.
exit /b 1
