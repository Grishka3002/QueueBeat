param(
  [string]$DataDirectory = "C:\Program Files\PostgreSQL\18\data",
  [string]$ServiceName = "postgresql-x64-18",
  [string]$AdminUser = "postgres"
)

$ErrorActionPreference = "Stop"

function Test-Administrator {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = [Security.Principal.WindowsPrincipal]::new($identity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (!(Test-Administrator)) {
  throw "Run this script from PowerShell opened with 'Run as administrator'."
}

$hbaPath = Join-Path $DataDirectory "pg_hba.conf"
if (!(Test-Path $hbaPath)) {
  throw "pg_hba.conf was not found at $hbaPath"
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = "$hbaPath.backup-$timestamp"
Copy-Item -LiteralPath $hbaPath -Destination $backupPath -ErrorAction Stop

$temporaryRules = @"
# Temporary local access for password reset. This block is removed automatically.
host    all             $AdminUser      127.0.0.1/32            trust
host    all             $AdminUser      ::1/128                 trust

"@

$securePassword = Read-Host "Enter NEW password for PostgreSQL user '$AdminUser'" -AsSecureString
$passwordPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)

try {
  $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPtr)
  if ([string]::IsNullOrWhiteSpace($plainPassword)) {
    throw "The new password cannot be empty."
  }

  $originalConfig = Get-Content -LiteralPath $hbaPath -Raw
  Set-Content -LiteralPath $hbaPath -Value ($temporaryRules + $originalConfig) -NoNewline

  Write-Host "Temporarily enabling local password-reset access..."
  Restart-Service -Name $ServiceName -Force

  $escapedPassword = $plainPassword.Replace("'", "''")
  "ALTER ROLE $AdminUser WITH PASSWORD '$escapedPassword';" |
    psql -v ON_ERROR_STOP=1 -h 127.0.0.1 -p 5432 -U $AdminUser -d postgres

  if ($LASTEXITCODE -ne 0) {
    throw "PostgreSQL did not accept the password reset command."
  }

  Write-Host "PostgreSQL password was reset successfully." -ForegroundColor Green
} finally {
  if ($passwordPtr -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPtr)
  }

  if (Test-Path $backupPath) {
    Copy-Item -LiteralPath $backupPath -Destination $hbaPath -Force
    Restart-Service -Name $ServiceName -Force
    Write-Host "Original pg_hba.conf restored." -ForegroundColor Green
  }
}

Write-Host "Saved backup: $backupPath"
