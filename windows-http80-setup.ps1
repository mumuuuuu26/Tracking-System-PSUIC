param(
    [string]$ServerHost = "10.135.2.226",
    [string]$AppDir = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Info([string]$Message) {
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Step([string]$Message) {
    Write-Host "[STEP] $Message" -ForegroundColor Green
}

function Ensure-Admin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)) {
        throw "Run this script in PowerShell as Administrator."
    }
}

function Set-EnvValue {
    param(
        [Parameter(Mandatory = $true)]
        [string]$FilePath,
        [Parameter(Mandatory = $true)]
        [string]$Key,
        [Parameter(Mandatory = $true)]
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

if ([string]::IsNullOrWhiteSpace($AppDir)) {
    $AppDir = Split-Path -Parent $MyInvocation.MyCommand.Path
}

$envPath = Join-Path $AppDir ".env.production"

Write-Step "Validating prerequisites"
Ensure-Admin

if (-not (Test-Path $AppDir)) {
    throw "App directory not found: $AppDir"
}

if (-not (Test-Path $envPath)) {
    throw ".env.production not found at: $envPath"
}

$env:Path = "$env:APPDATA\npm;$env:Path"

if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
    throw "pm2 not found in PATH. Install first: npm install -g pm2"
}

Write-Step "Stopping IIS and disabling W3SVC"
try {
    & iisreset /stop | Out-Null
    Write-Info "IIS stopped."
} catch {
    Write-Info "IIS stop skipped (not running or unavailable)."
}

$w3svc = Get-Service -Name "W3SVC" -ErrorAction SilentlyContinue
if ($w3svc) {
    if ($w3svc.Status -eq "Running") {
        Stop-Service -Name "W3SVC" -Force
    }
    Set-Service -Name "W3SVC" -StartupType Disabled
    Write-Info "W3SVC startup type set to Disabled."
}

Write-Step "Updating .env.production for HTTP on port 80"
Set-EnvValue -FilePath $envPath -Key "PORT" -Value "80"
Set-EnvValue -FilePath $envPath -Key "CLIENT_URL" -Value "http://$ServerHost"
Set-EnvValue -FilePath $envPath -Key "FRONTEND_URL" -Value "http://$ServerHost"
Set-EnvValue -FilePath $envPath -Key "HTTPS_ONLY" -Value "false"
Set-EnvValue -FilePath $envPath -Key "ENABLE_HTTPS_HEADERS" -Value "false"
Set-EnvValue -FilePath $envPath -Key "TLS_KEY_FILE" -Value ""
Set-EnvValue -FilePath $envPath -Key "TLS_CERT_FILE" -Value ""
Set-EnvValue -FilePath $envPath -Key "HTTP_REDIRECT_PORT" -Value ""

Write-Info "Updated: PORT=80"
Write-Info "Updated: CLIENT_URL=http://$ServerHost"
Write-Info "Updated: FRONTEND_URL=http://$ServerHost"
Write-Info "Updated: HTTPS_ONLY=false"
Write-Info "Updated: ENABLE_HTTPS_HEADERS=false"

Write-Step "Restarting backend with PM2"
Push-Location $AppDir
try {
    & pm2 restart tracking-system-backend --update-env | Out-Null
    & pm2 save | Out-Null
} finally {
    Pop-Location
}

Write-Step "Ensuring firewall allows TCP/80"
$ruleName = "TrackingSystem80"
$rule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if (-not $rule) {
    New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Action Allow -Protocol TCP -LocalPort 80 | Out-Null
    Write-Info "Created firewall rule: $ruleName"
} else {
    Write-Info "Firewall rule already exists: $ruleName"
}

Write-Step "Running health checks"
$localHealth = (Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1/health" -TimeoutSec 8).Content.Trim()
if ($localHealth -ne "OK") {
    throw "Local health check failed. Expected OK, got: $localHealth"
}
Write-Info "Local health: OK"

$lanHealth = (Invoke-WebRequest -UseBasicParsing -Uri "http://$ServerHost/health" -TimeoutSec 8).Content.Trim()
if ($lanHealth -ne "OK") {
    throw "LAN health check failed. Expected OK, got: $lanHealth"
}
Write-Info "LAN health: OK"

Write-Host ""
Write-Host "Done. Open this URL on Mac/Windows clients:" -ForegroundColor Green
Write-Host "http://$ServerHost/"
