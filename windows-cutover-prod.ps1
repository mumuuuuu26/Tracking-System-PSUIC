param(
    [string]$ServerHost = "10.135.2.226",
    [string]$AppDir = "",
    [string]$SqlDumpPath = "",
    [string]$DbName = "tracking_system_prod",
    [string]$DbUser = "tracking_app",
    [string]$DbPass = "",
    [string]$MySqlRootUser = "root",
    [string]$MySqlRootPass = "",
    [int]$Port = 80,
    [bool]$ResetDatabase = $true
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step([string]$Message) {
    Write-Host "[STEP] $Message" -ForegroundColor Green
}

function Write-Info([string]$Message) {
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Ensure-Admin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)) {
        throw "Run this script in PowerShell as Administrator."
    }
}

function Escape-SqlLiteral([string]$Value) {
    return $Value.Replace("'", "''")
}

function Read-Secret([string]$PromptText) {
    $secure = Read-Host -AsSecureString -Prompt $PromptText
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    }
}

function Set-EnvValue {
    param(
        [Parameter(Mandatory = $true)]
        [string]$FilePath,
        [Parameter(Mandatory = $true)]
        [string]$Key,
        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string]$Value
    )

    $raw = @()
    if (Test-Path $FilePath) {
        $raw = Get-Content -Path $FilePath
    }

    $updated = $false
    for ($i = 0; $i -lt $raw.Count; $i++) {
        if ($raw[$i] -match "^\s*$([Regex]::Escape($Key))\s*=") {
            $raw[$i] = "$Key=$Value"
            $updated = $true
            break
        }
    }

    if (-not $updated) {
        $raw += "$Key=$Value"
    }

    Set-Content -Path $FilePath -Value $raw -Encoding UTF8
}

function Get-EnvValue {
    param(
        [Parameter(Mandatory = $true)]
        [string]$FilePath,
        [Parameter(Mandatory = $true)]
        [string]$Key
    )

    if (-not (Test-Path $FilePath)) {
        return ""
    }

    foreach ($line in Get-Content -Path $FilePath) {
        if ($line -match "^\s*$([Regex]::Escape($Key))\s*=(.*)$") {
            return $Matches[1].Trim()
        }
    }

    return ""
}

function Resolve-MySqlExe {
    $xamppMySql = "C:\xampp\mysql\bin\mysql.exe"
    if (Test-Path $xamppMySql) {
        return $xamppMySql
    }

    $fromPath = Get-Command mysql.exe -ErrorAction SilentlyContinue
    if ($fromPath) {
        return $fromPath.Source
    }

    throw "mysql.exe not found. Install XAMPP MySQL or add mysql.exe to PATH."
}

function Invoke-CommandOrThrow {
    param(
        [Parameter(Mandatory = $true)]
        [scriptblock]$Command,
        [Parameter(Mandatory = $true)]
        [string]$ErrorMessage
    )

    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw $ErrorMessage
    }
}

function Resolve-MySqlRootAuthArgs {
    param(
        [Parameter(Mandatory = $true)]
        [string]$MySqlExe,
        [Parameter(Mandatory = $true)]
        [string]$RootUser,
        [Parameter(Mandatory = $false)]
        [AllowEmptyString()]
        [string]$RootPass
    )

    $attempts = @()
    if (-not [string]::IsNullOrWhiteSpace($RootPass)) {
        $attempts += ,@("-u", $RootUser, "-p$RootPass")
    }
    $attempts += ,@("-u", $RootUser)

    foreach ($authArgs in $attempts) {
        & $MySqlExe @authArgs --default-character-set=utf8mb4 -e "SELECT 1;" | Out-Null
        if ($LASTEXITCODE -eq 0) {
            if (
                $authArgs.Count -eq 2 -and
                -not [string]::IsNullOrWhiteSpace($RootPass)
            ) {
                Write-Info "MySQL root password was not accepted. Fallback to local root login without password."
            }
            return $authArgs
        }
    }

    throw "Unable to authenticate MySQL root user. Check root credentials and MySQL auth mode."
}

function Invoke-MySqlQuery {
    param(
        [Parameter(Mandatory = $true)]
        [string]$MySqlExe,
        [Parameter(Mandatory = $true)]
        [string[]]$RootAuthArgs,
        [Parameter(Mandatory = $true)]
        [string]$Query
    )

    $args = @() + $RootAuthArgs + @("--default-character-set=utf8mb4", "-e", $Query)
    & $MySqlExe @args
    if ($LASTEXITCODE -ne 0) {
        throw "mysql query failed."
    }
}

if ([string]::IsNullOrWhiteSpace($AppDir)) {
    $AppDir = Split-Path -Parent $MyInvocation.MyCommand.Path
}

$envPath = Join-Path $AppDir ".env.production"
$runtimeCheckBat = Join-Path $AppDir "windows-runtime-check.bat"

Write-Step "Validating inputs and prerequisites"
Ensure-Admin

if (-not (Test-Path $AppDir)) {
    throw "App directory not found: $AppDir"
}

if (-not (Test-Path $envPath)) {
    throw ".env.production not found at: $envPath"
}

if (-not (Test-Path $runtimeCheckBat)) {
    throw "windows-runtime-check.bat not found at: $runtimeCheckBat"
}

if ($DbName -notmatch "^[A-Za-z0-9_]+$") {
    throw "DbName must match ^[A-Za-z0-9_]+$"
}

if ($DbUser -notmatch "^[A-Za-z0-9_]+$") {
    throw "DbUser must match ^[A-Za-z0-9_]+$"
}

if ([string]::IsNullOrWhiteSpace($MySqlRootPass)) {
    $MySqlRootPass = Read-Secret "Enter MySQL root password"
}

if ([string]::IsNullOrWhiteSpace($DbPass)) {
    $DbPass = Read-Secret "Enter application DB password for user '$DbUser'"
}
if ([string]::IsNullOrWhiteSpace($DbPass)) {
    throw "Application DB password cannot be empty. Re-run and enter a non-empty password for '$DbUser'."
}

if ([string]::IsNullOrWhiteSpace($SqlDumpPath)) {
    $latestDump = Get-ChildItem -Path $AppDir -Filter "*.sql" -File |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1

    if (-not $latestDump) {
        throw "No .sql dump found in $AppDir. Put your dump file there or pass -SqlDumpPath."
    }
    $SqlDumpPath = $latestDump.FullName
}

$SqlDumpPath = (Resolve-Path -Path $SqlDumpPath).Path
if (-not (Test-Path $SqlDumpPath)) {
    throw "SQL dump file not found: $SqlDumpPath"
}

$mysqlExe = Resolve-MySqlExe
Write-Info "Using mysql client: $mysqlExe"
Write-Info "Using SQL dump: $SqlDumpPath"
$rootAuthArgs = Resolve-MySqlRootAuthArgs -MySqlExe $mysqlExe -RootUser $MySqlRootUser -RootPass $MySqlRootPass

Write-Step "Creating database/user and importing data"
$safeDbPass = Escape-SqlLiteral $DbPass
$safeDbUser = Escape-SqlLiteral $DbUser

if ($ResetDatabase) {
    Write-Info "ResetDatabase=true -> dropping and recreating database '$DbName'"
    Invoke-MySqlQuery -MySqlExe $mysqlExe -RootAuthArgs $rootAuthArgs -Query "DROP DATABASE IF EXISTS $DbName;"
}

$sqlSetup = @"
CREATE DATABASE IF NOT EXISTS $DbName CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$safeDbUser'@'localhost' IDENTIFIED BY '$safeDbPass';
ALTER USER '$safeDbUser'@'localhost' IDENTIFIED BY '$safeDbPass';
GRANT ALL PRIVILEGES ON $DbName.* TO '$safeDbUser'@'localhost';
FLUSH PRIVILEGES;
"@
Invoke-MySqlQuery -MySqlExe $mysqlExe -RootAuthArgs $rootAuthArgs -Query $sqlSetup

$dbCheckQuery = "SHOW DATABASES LIKE '$DbName';"
$dbCheckArgs = @() + $rootAuthArgs + @("--default-character-set=utf8mb4", "-N", "-e", $dbCheckQuery)
$dbCheckOutput = (& $mysqlExe @dbCheckArgs | Out-String).Trim()
if ($dbCheckOutput -ne $DbName) {
    throw "Database '$DbName' was not created successfully. Found: '$dbCheckOutput'"
}

$importArgs = @() + $rootAuthArgs + @("--default-character-set=utf8mb4", $DbName)
Get-Content -Path $SqlDumpPath | & $mysqlExe @importArgs
if ($LASTEXITCODE -ne 0) {
    throw "SQL import failed."
}

Write-Step "Updating .env.production for server-only database + HTTP mode"
$existingSecret = Get-EnvValue -FilePath $envPath -Key "SECRET"
if ([string]::IsNullOrWhiteSpace($existingSecret) -or $existingSecret -eq "replace_with_long_random_secret_at_least_16_chars") {
    $existingSecret = ([guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N"))
    Write-Info "SECRET was missing/placeholder; generated a new secret."
}

$encodedDbPass = [Uri]::EscapeDataString($DbPass)
$databaseUrl = "mysql://{0}:{1}@127.0.0.1:3306/{2}" -f $DbUser, $encodedDbPass, $DbName

Set-EnvValue -FilePath $envPath -Key "NODE_ENV" -Value "production"
Set-EnvValue -FilePath $envPath -Key "PORT" -Value "$Port"
Set-EnvValue -FilePath $envPath -Key "SECRET" -Value $existingSecret
Set-EnvValue -FilePath $envPath -Key "CLIENT_URL" -Value "http://$ServerHost"
Set-EnvValue -FilePath $envPath -Key "FRONTEND_URL" -Value "http://$ServerHost"
Set-EnvValue -FilePath $envPath -Key "HTTPS_ONLY" -Value "false"
Set-EnvValue -FilePath $envPath -Key "ENABLE_HTTPS_HEADERS" -Value "false"
Set-EnvValue -FilePath $envPath -Key "TLS_KEY_FILE" -Value ""
Set-EnvValue -FilePath $envPath -Key "TLS_CERT_FILE" -Value ""
Set-EnvValue -FilePath $envPath -Key "HTTP_REDIRECT_PORT" -Value ""
Set-EnvValue -FilePath $envPath -Key "DATABASE_URL" -Value "`"$databaseUrl`""
Set-EnvValue -FilePath $envPath -Key "UPLOAD_DIR" -Value "C:/xampp/htdocs/app/server/uploads"
Set-EnvValue -FilePath $envPath -Key "UPLOAD_BACKUP_DIR" -Value "C:/xampp/htdocs/app/server/backups/uploads"

New-Item -ItemType Directory -Path (Join-Path $AppDir "uploads") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $AppDir "backups\uploads") -Force | Out-Null

Write-Step "Running backend deploy flow"
Push-Location $AppDir
try {
    if (-not [string]::IsNullOrWhiteSpace($env:APPDATA)) {
        $env:Path = "$env:APPDATA\npm;$env:Path"
    }

    $pm2Cmd = Get-Command pm2 -ErrorAction SilentlyContinue
    if (-not $pm2Cmd) {
        Write-Info "pm2 not found. Installing globally..."
        Invoke-CommandOrThrow -Command { npm install -g pm2 } -ErrorMessage "Failed to install pm2 globally."
        if (-not [string]::IsNullOrWhiteSpace($env:APPDATA)) {
            $env:Path = "$env:APPDATA\npm;$env:Path"
        }
        $pm2Cmd = Get-Command pm2 -ErrorAction SilentlyContinue
        if (-not $pm2Cmd) {
            throw "pm2 installed but still not found in PATH."
        }
    }

    if (Test-Path (Join-Path $AppDir "node_modules")) {
        Write-Info "node_modules exists. Skipping npm ci to avoid unnecessary registry/network dependency."
    } else {
        Write-Step "Installing dependencies (npm ci)"
        $previousSkip = $env:PRISMA_SKIP_POSTINSTALL_GENERATE
        $env:PRISMA_SKIP_POSTINSTALL_GENERATE = "1"
        try {
            Invoke-CommandOrThrow -Command { npm ci } -ErrorMessage "npm ci failed."
        } finally {
            if ($null -eq $previousSkip) {
                Remove-Item Env:\PRISMA_SKIP_POSTINSTALL_GENERATE -ErrorAction SilentlyContinue
            } else {
                $env:PRISMA_SKIP_POSTINSTALL_GENERATE = $previousSkip
            }
        }
    }

    Write-Step "Generating Prisma client (safe mode)"
    if ([string]::IsNullOrWhiteSpace($env:PRISMA_ALLOW_INSECURE_TLS_FALLBACK)) {
        $env:PRISMA_ALLOW_INSECURE_TLS_FALLBACK = "true"
    }
    Invoke-CommandOrThrow -Command { node scripts\prisma-generate-safe.js } -ErrorMessage "Safe Prisma generate failed."

    Write-Step "Validating production env"
    Invoke-CommandOrThrow -Command { npm run validate:env:prod } -ErrorMessage "validate:env:prod failed."

    Write-Step "Checking DB and storage preflight"
    Invoke-CommandOrThrow -Command { npm run preflight:db:prod } -ErrorMessage "preflight:db:prod failed."
    Invoke-CommandOrThrow -Command { npm run preflight:storage:prod } -ErrorMessage "preflight:storage:prod failed."

    Write-Step "Applying migrations (SQL mode, no Prisma engine download)"
    Invoke-CommandOrThrow -Command { npm run migrate:sql:prod } -ErrorMessage "SQL migration apply failed."

    Write-Step "Restarting backend with PM2"
    & pm2 describe tracking-system-backend | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Invoke-CommandOrThrow -Command { pm2 restart tracking-system-backend --update-env } -ErrorMessage "PM2 restart failed."
    } else {
        Invoke-CommandOrThrow -Command { pm2 start ecosystem.config.js --env production } -ErrorMessage "PM2 start failed."
    }
    & pm2 start db-backup-cron --update-env | Out-Null
    if ($LASTEXITCODE -ne 0) {
        & pm2 start ecosystem.config.js --only db-backup-cron --env production | Out-Null
    }
    & pm2 save | Out-Null

    Write-Step "Running windows-runtime-check.bat"
    cmd.exe /c "`"$runtimeCheckBat`""
    if ($LASTEXITCODE -ne 0) {
        throw "windows-runtime-check.bat failed."
    }
} finally {
    Pop-Location
}

Write-Step "Verifying imported row counts"
$verifyQuery = "SELECT COUNT(*) AS users FROM $DbName.`User`; SELECT COUNT(*) AS tickets FROM $DbName.`Ticket`;"
$verifyArgs = @() + $rootAuthArgs + @("--default-character-set=utf8mb4", "-e", $verifyQuery)
& $mysqlExe @verifyArgs
if ($LASTEXITCODE -ne 0) {
    throw "Post-import verification query failed."
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "Cutover completed successfully." -ForegroundColor Green
Write-Host "URL: http://$ServerHost/" -ForegroundColor Green
Write-Host "DB : $DbName (on server only)" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
