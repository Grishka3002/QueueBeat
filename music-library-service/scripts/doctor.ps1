$ErrorActionPreference = "Stop"

function Read-EnvFile {
  param([string]$Path)

  $values = @{}
  if (!(Test-Path $Path)) {
    return $values
  }

  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if (!$line -or $line.StartsWith("#") -or !$line.Contains("=")) {
      return
    }

    $parts = $line.Split("=", 2)
    $key = $parts[0].Trim()
    $value = $parts[1].Trim().Trim('"').Trim("'")
    $values[$key] = $value
  }

  return $values
}

function Test-Port {
  param(
    [string]$HostName,
    [int]$Port,
    [int]$TimeoutMs = 900
  )

  try {
    $client = [System.Net.Sockets.TcpClient]::new()
    $task = $client.ConnectAsync($HostName, $Port)
    $ok = $task.Wait($TimeoutMs) -and $client.Connected
    $client.Dispose()
    return $ok
  } catch {
    return $false
  }
}

function Write-Check {
  param(
    [string]$Name,
    [bool]$Ok,
    [string]$Message
  )

  $mark = if ($Ok) { "[OK]" } else { "[!!]" }
  $color = if ($Ok) { "Green" } else { "Yellow" }
  Write-Host "$mark $Name" -ForegroundColor $color
  Write-Host "     $Message"
}

$envValues = Read-EnvFile ".env"
$databaseUrl = $envValues["DATABASE_URL"]
$storageDriver = $envValues["STORAGE_DRIVER"]
$s3Endpoint = $envValues["S3_ENDPOINT"]

Write-Host ""
Write-Host "Music Library doctor" -ForegroundColor Cyan
Write-Host "===================="
Write-Host ""

Write-Check ".env" (![string]::IsNullOrWhiteSpace($databaseUrl)) "DATABASE_URL=$databaseUrl"
Write-Check "Storage mode" ($storageDriver -eq "s3" -or $storageDriver -eq "postgres") "STORAGE_DRIVER=$storageDriver"

$docker = Get-Command docker -ErrorAction SilentlyContinue
Write-Check "Docker command" ($null -ne $docker) $(if ($docker) { "docker found at $($docker.Source)" } else { "docker not found. Install Docker Desktop, then restart PowerShell." })

$dbHost = "localhost"
$dbPort = 5432
if ($databaseUrl) {
  try {
    $uri = [System.Uri]$databaseUrl
    $dbHost = $uri.Host
    $dbPort = $uri.Port
  } catch {
    Write-Host "[!!] DATABASE_URL is not a valid URL: $databaseUrl" -ForegroundColor Yellow
  }
}

$dbOpen = Test-Port $dbHost $dbPort
Write-Check "PostgreSQL port" $dbOpen "$dbHost`:$dbPort"

$s3Host = "localhost"
$s3Port = 9000
if ($s3Endpoint) {
  try {
    $uri = [System.Uri]$s3Endpoint
    $s3Host = $uri.Host
    $s3Port = $uri.Port
  } catch {
    Write-Host "[!!] S3_ENDPOINT is not a valid URL: $s3Endpoint" -ForegroundColor Yellow
  }
}

if ($storageDriver -eq "s3") {
  $s3Open = Test-Port $s3Host $s3Port
  Write-Check "MinIO / S3 port" $s3Open "$s3Host`:$s3Port"
}

Write-Host ""
Write-Host "Next step" -ForegroundColor Cyan

if (!$docker -and $databaseUrl -match "localhost:5433") {
  Write-Host "Your .env uses Docker PostgreSQL on localhost:5433, but Docker is not installed or not in PATH."
  Write-Host ""
  Write-Host "Recommended:"
  Write-Host "  1. Install Docker Desktop"
  Write-Host "  2. Restart PowerShell"
  Write-Host "  3. Run: docker compose up -d"
  Write-Host "  4. Run: npm run prisma:push"
  Write-Host ""
  Write-Host "Alternative without Docker:"
  Write-Host "  1. Run: powershell -ExecutionPolicy Bypass -File .\scripts\create-local-postgres-db.ps1"
  Write-Host "  2. Change DATABASE_URL to postgresql://music:music@localhost:5432/music_library?schema=public"
  Write-Host "  3. Change STORAGE_DRIVER to postgres"
  Write-Host "  4. Run: npm run prisma:push"
} elseif (!$dbOpen) {
  Write-Host "PostgreSQL is not reachable. Start the database that matches DATABASE_URL, then run npm run prisma:push."
} elseif ($storageDriver -eq "s3" -and !$s3Open) {
  Write-Host "PostgreSQL looks reachable, but MinIO / S3 is not. Start MinIO or switch STORAGE_DRIVER to postgres for local testing."
} else {
  Write-Host "Core ports look reachable. Try: npm run prisma:push"
}

Write-Host ""

