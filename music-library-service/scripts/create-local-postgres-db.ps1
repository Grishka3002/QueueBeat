param(
  [string]$HostName = "127.0.0.1",
  [int]$Port = 5432,
  [string]$AdminUser = "postgres",
  [string]$AppUser = "music",
  [string]$AppPassword = "music",
  [string]$Database = "music_library"
)

$ErrorActionPreference = "Stop"
$env:PGCONNECT_TIMEOUT = "10"

$roleSql = @"
SELECT 'CREATE ROLE $AppUser LOGIN PASSWORD ''$AppPassword'''
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '$AppUser')\gexec
"@

$passwordSql = "ALTER ROLE $AppUser WITH LOGIN PASSWORD '$AppPassword';"

$dbSql = @"
SELECT 'CREATE DATABASE $Database OWNER $AppUser'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = '$Database')\gexec
"@

$ownerSql = "ALTER DATABASE $Database OWNER TO $AppUser;"

function Invoke-PsqlCommand {
  param([string]$Sql)

  $Sql | psql -v ON_ERROR_STOP=1 -h $HostName -p $Port -U $AdminUser -d postgres
  if ($LASTEXITCODE -ne 0) {
    throw "PostgreSQL command failed. The password for '$AdminUser' may be incorrect."
  }
}

Write-Host "Creating PostgreSQL role '$AppUser' and database '$Database' on ${HostName}:${Port}..."
if (!$env:PGPASSWORD) {
  $securePassword = Read-Host "Enter password for PostgreSQL admin user '$AdminUser'" -AsSecureString
  $passwordPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
  try {
    $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPtr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPtr)
  }
}

Invoke-PsqlCommand $roleSql
Invoke-PsqlCommand $passwordSql
Invoke-PsqlCommand $dbSql
Invoke-PsqlCommand $ownerSql

Write-Host "Done. Use this DATABASE_URL:"
Write-Host "postgresql://${AppUser}:${AppPassword}@localhost:${Port}/${Database}?schema=public"
