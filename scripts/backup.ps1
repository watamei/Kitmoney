$timestamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
$rootDir = (Get-Item $PSScriptRoot).Parent.FullName
$src = Join-Path $rootDir "prisma\dev.db"

if (!(Test-Path $src)) {
    Write-Host "[ERROR] Cannot find: $src" -ForegroundColor Red
    exit 1
}

$backupDir = Join-Path $rootDir "backups"
if (!(Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

$destLocal = Join-Path $backupDir "dev_backup_$timestamp.db"
Copy-Item -Path $src -Destination $destLocal -Force

Write-Host "========================================================" -ForegroundColor Green
Write-Host "  [SUCCESS] Backup Completed successfully!" -ForegroundColor Green
Write-Host "  Local: $destLocal" -ForegroundColor Cyan

if ($env:OneDrive -and (Test-Path $env:OneDrive)) {
    $oneDriveDir = Join-Path $env:OneDrive "KidYa_Backups"
    if (!(Test-Path $oneDriveDir)) {
        New-Item -ItemType Directory -Path $oneDriveDir | Out-Null
    }
    $destOneDrive = Join-Path $oneDriveDir "dev_backup_$timestamp.db"
    Copy-Item -Path $src -Destination $destOneDrive -Force
    Write-Host "  [OneDrive Cloud] Auto-saved to: $destOneDrive" -ForegroundColor Yellow
}

Write-Host "========================================================" -ForegroundColor Green
