@echo off
REM Deploy Script for Windows Server

echo  Starting Deployment...

REM 1. Pull latest code
echo  Pulling latest code...
call git pull
IF %ERRORLEVEL% NEQ 0 (
    echo  Git pull failed! Please check for conflicts.
    exit /b %ERRORLEVEL%
)

REM 2. Install Backend Dependencies
echo  Installing backend dependencies...
call npm install
IF %ERRORLEVEL% NEQ 0 (
    echo  npm install failed!
    exit /b %ERRORLEVEL%
)

REM 3. Build Frontend
echo  Building Frontend...
cd client
echo    - Installing client dependencies...
call npm install
IF %ERRORLEVEL% NEQ 0 (
    echo  Client npm install failed!
    exit /b %ERRORLEVEL%
)
echo    - Building React app...
call npm run build
IF %ERRORLEVEL% NEQ 0 (
    echo  Client build failed!
    exit /b %ERRORLEVEL%
)
cd ..

REM 3. Database Migration
echo  Running database migrations...
call npx prisma migrate deploy
IF %ERRORLEVEL% NEQ 0 (
    echo  Database migration failed!
    exit /b %ERRORLEVEL%
)

REM 4. Generate Prisma Client
echo  Generating Prisma Client...
call npx prisma generate

REM 5. Restart Application
echo  Restarting application with PM2...
call pm2 restart ecosystem.config.js --env production
IF %ERRORLEVEL% NEQ 0 (
    echo  PM2 restart failed!
    exit /b %ERRORLEVEL%
)

echo  Deployment Successful!
pause
