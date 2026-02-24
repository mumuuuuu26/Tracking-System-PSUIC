param(
    [string]$AppDir = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

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

if ([string]::IsNullOrWhiteSpace($AppDir)) {
    $AppDir = Split-Path -Parent $MyInvocation.MyCommand.Path
}

$AppDir = (Resolve-Path -Path $AppDir).Path
Ensure-Admin

$env:Path = "$env:APPDATA\npm;$env:Path"
$pm2Cmd = Get-Command pm2 -ErrorAction SilentlyContinue
if (-not $pm2Cmd) {
    throw "pm2 not found in PATH. Install first: npm install -g pm2"
}

$pm2Path = $pm2Cmd.Source
$pm2Home = Join-Path $AppDir ".pm2"
if (-not (Test-Path $pm2Home)) {
    New-Item -ItemType Directory -Path $pm2Home -Force | Out-Null
}

$startupScript = @"
`$ErrorActionPreference = 'Stop'
`$env:PM2_HOME = '$pm2Home'
Set-Location '$AppDir'
& '$pm2Path' resurrect
"@

$encodedCommand = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($startupScript))
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -EncodedCommand $encodedCommand"
$triggers = @(
    New-ScheduledTaskTrigger -AtStartup,
    New-ScheduledTaskTrigger -AtLogOn
)
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

$taskName = "TrackingSystem-PM2-Resurrect"
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $triggers -Principal $principal -Settings $settings -Force | Out-Null

Write-Info "Scheduled task created/updated: $taskName"
Write-Info "PM2 home: $pm2Home"
Write-Info "PM2 command: $pm2Path"
