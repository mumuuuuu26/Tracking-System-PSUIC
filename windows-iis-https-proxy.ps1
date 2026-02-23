param(
    [string]$SiteName = "Default Web Site",
    [string]$BackendUrl = "http://127.0.0.1:5002",
    [string]$PublicHost = "10.135.2.226",
    [string]$CertThumbprint = "",
    [string]$CertExportPath = "C:\xampp\htdocs\app\server\certs\tracking-system.cer"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Info([string]$Message) {
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Warn([string]$Message) {
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
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

function Ensure-Command([string]$CommandName) {
    $cmd = Get-Command $CommandName -ErrorAction SilentlyContinue
    if (-not $cmd) {
        throw "Required command not found: $CommandName"
    }
}

function Ensure-IisModules([string]$AppCmdPath) {
    $modules = & $AppCmdPath list modules
    if ($modules -notmatch "RewriteModule") {
        throw "IIS URL Rewrite is missing. Install from https://www.iis.net/downloads/microsoft/url-rewrite"
    }
    if (($modules -notmatch "ApplicationRequestRouting") -and ($modules -notmatch "ARR")) {
        throw "IIS Application Request Routing (ARR) is missing. Install from https://www.iis.net/downloads/microsoft/application-request-routing"
    }
}

function Ensure-Binding([string]$Name, [string]$Protocol, [int]$Port) {
    $existing = Get-WebBinding -Name $Name -Protocol $Protocol -Port $Port -ErrorAction SilentlyContinue
    if (-not $existing) {
        New-WebBinding -Name $Name -Protocol $Protocol -Port $Port -IPAddress "*" -HostHeader "" | Out-Null
        Write-Info "Created $Protocol binding on port $Port for site '$Name'."
    } else {
        Write-Info "$Protocol binding on port $Port already exists for site '$Name'."
    }
}

function New-OrGetCertificate([string]$HostName, [string]$Thumbprint, [string]$ExportPath) {
    if (-not [string]::IsNullOrWhiteSpace($Thumbprint)) {
        $normalized = $Thumbprint.Replace(" ", "")
        $existing = Get-Item "Cert:\LocalMachine\My\$normalized" -ErrorAction SilentlyContinue
        if (-not $existing) {
            throw "Certificate not found by thumbprint: $Thumbprint"
        }
        Write-Info "Using existing certificate thumbprint: $normalized"
        return $existing
    }

    Write-Info "Creating self-signed certificate for '$HostName' (LocalMachine\My)."

    $cert = $null
    try {
        # Preferred: include IP SAN for direct IP access.
        $cert = New-SelfSignedCertificate `
            -Type Custom `
            -Subject "CN=$HostName" `
            -FriendlyName "TrackingSystem-$HostName" `
            -CertStoreLocation "Cert:\LocalMachine\My" `
            -KeyAlgorithm RSA `
            -KeyLength 2048 `
            -HashAlgorithm SHA256 `
            -NotAfter (Get-Date).AddYears(2) `
            -TextExtension @("2.5.29.17={text}IPAddress=$HostName&DNS=$HostName")
    } catch {
        Write-Warn "IP SAN creation failed, fallback to DNS SAN only."
        $cert = New-SelfSignedCertificate `
            -Subject "CN=$HostName" `
            -DnsName $HostName `
            -FriendlyName "TrackingSystem-$HostName" `
            -CertStoreLocation "Cert:\LocalMachine\My" `
            -KeyAlgorithm RSA `
            -KeyLength 2048 `
            -HashAlgorithm SHA256 `
            -NotAfter (Get-Date).AddYears(2)
    }

    if (-not [string]::IsNullOrWhiteSpace($ExportPath)) {
        $exportDir = Split-Path -Parent $ExportPath
        if (-not [string]::IsNullOrWhiteSpace($exportDir) -and -not (Test-Path $exportDir)) {
            New-Item -ItemType Directory -Path $exportDir -Force | Out-Null
        }
        Export-Certificate -Cert $cert -FilePath $ExportPath -Force | Out-Null
        Write-Info "Exported public certificate to: $ExportPath"
    }

    return $cert
}

function Set-SslBinding([string]$Thumbprint) {
    if (Test-Path "IIS:\SslBindings\0.0.0.0!443") {
        Remove-Item "IIS:\SslBindings\0.0.0.0!443" -Force
    }
    New-Item "IIS:\SslBindings\0.0.0.0!443" -Thumbprint $Thumbprint -SSLFlags 0 | Out-Null
    Write-Info "Bound certificate $Thumbprint to 0.0.0.0:443"
}

function Write-RewriteConfig([string]$SitePath, [string]$Backend) {
    $webConfigPath = Join-Path $SitePath "web.config"

    if (Test-Path $webConfigPath) {
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $backupPath = "$webConfigPath.$timestamp.bak"
        Copy-Item $webConfigPath $backupPath -Force
        Write-Info "Backed up existing web.config to: $backupPath"
    }

    $config = @"
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <allowedServerVariables>
        <add name="HTTP_X_FORWARDED_PROTO" />
        <add name="HTTP_X_FORWARDED_HOST" />
      </allowedServerVariables>
      <rules>
        <rule name="Redirect HTTP to HTTPS" stopProcessing="true">
          <match url="(.*)" />
          <conditions>
            <add input="{HTTPS}" pattern="off" ignoreCase="true" />
          </conditions>
          <action type="Redirect" url="https://{HTTP_HOST}/{R:1}" redirectType="Permanent" />
        </rule>
        <rule name="Reverse Proxy to Node" stopProcessing="true">
          <match url="(.*)" />
          <serverVariables>
            <set name="HTTP_X_FORWARDED_PROTO" value="https" />
            <set name="HTTP_X_FORWARDED_HOST" value="{HTTP_HOST}" />
          </serverVariables>
          <action type="Rewrite" url="$Backend/{R:1}" appendQueryString="true" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
"@

    Set-Content -Path $webConfigPath -Value $config -Encoding UTF8
    Write-Info "Wrote reverse-proxy web.config to: $webConfigPath"
}

Write-Step "Validating prerequisites"
Ensure-Admin
Ensure-Command "iisreset"
Ensure-Command "curl.exe"
Import-Module WebAdministration

$appCmd = Join-Path $env:windir "System32\inetsrv\appcmd.exe"
if (-not (Test-Path $appCmd)) {
    throw "appcmd.exe not found: $appCmd"
}

Ensure-IisModules -AppCmdPath $appCmd

Write-Step "Enabling ARR proxy mode"
& $appCmd set config /section:system.webServer/proxy /enabled:"True" /preserveHostHeader:"True" /reverseRewriteHostInResponseHeaders:"False" /commit:apphost | Out-Null

Write-Step "Configuring IIS site"
$siteItem = Get-Item "IIS:\Sites\$SiteName" -ErrorAction SilentlyContinue
if (-not $siteItem) {
    throw "IIS site not found: $SiteName"
}

$sitePath = [Environment]::ExpandEnvironmentVariables($siteItem.physicalPath)
if (-not (Test-Path $sitePath)) {
    New-Item -ItemType Directory -Path $sitePath -Force | Out-Null
}
Write-Info "Site physical path: $sitePath"

Write-RewriteConfig -SitePath $sitePath -Backend $BackendUrl

Ensure-Binding -Name $SiteName -Protocol "http" -Port 80
Ensure-Binding -Name $SiteName -Protocol "https" -Port 443

Write-Step "Configuring certificate and HTTPS binding"
$certificate = New-OrGetCertificate -HostName $PublicHost -Thumbprint $CertThumbprint -ExportPath $CertExportPath
Set-SslBinding -Thumbprint $certificate.Thumbprint

Write-Step "Reloading IIS"
iisreset /noforce | Out-Null

Write-Step "Running health checks"
$backendHealth = & curl.exe -sS "$BackendUrl/health"
if ($backendHealth -ne "OK") {
    throw "Backend health check failed on $BackendUrl/health"
}
Write-Info "Backend health: OK"

$httpStatus = & curl.exe -sS -o NUL -w "%{http_code}" "http://127.0.0.1/health"
Write-Info "HTTP(80) /health status: $httpStatus (expect 301 redirect)"

$httpsHealth = & curl.exe -k -sS "https://127.0.0.1/health"
if ($httpsHealth -ne "OK") {
    throw "HTTPS reverse-proxy health check failed on https://127.0.0.1/health"
}
Write-Info "HTTPS reverse-proxy health: OK"

Write-Host ""
Write-Host "Done. Next actions:" -ForegroundColor Green
Write-Host "1) Update .env.production CLIENT_URL and FRONTEND_URL to https://$PublicHost"
Write-Host "2) Restart backend: pm2 restart tracking-system-backend --update-env"
Write-Host "3) Open: https://$PublicHost/"
Write-Host "4) If browser still warns, trust certificate file: $CertExportPath on client machines"
