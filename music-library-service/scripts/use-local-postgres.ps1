$ErrorActionPreference = "Stop"

$envPath = ".env"
if (!(Test-Path $envPath)) {
  Copy-Item ".env.example" $envPath
}

$content = Get-Content $envPath -Raw
$content = $content -replace 'DATABASE_URL="[^"]*"', 'DATABASE_URL="postgresql://music:music@localhost:5432/music_library?schema=public"'
$content = $content -replace 'STORAGE_DRIVER="[^"]*"', 'STORAGE_DRIVER="postgres"'
Set-Content -Path $envPath -Value $content -NoNewline

Write-Host "Switched .env to local PostgreSQL with PostgreSQL audio storage:"
Write-Host 'DATABASE_URL="postgresql://music:music@localhost:5432/music_library?schema=public"'
Write-Host 'STORAGE_DRIVER="postgres"'

