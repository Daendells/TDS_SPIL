# start-dev.ps1 ? Script untuk menjalankan tds-devto
# Usage: .\start-dev.ps1

$MYSQL_NAME = "mysql-container"
$NETWORK = "tds-devto_tds-net"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  TDS DevTo -- Startup Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Cek mysql-container
Write-Host "[1/3] Mengecek mysql-container..." -ForegroundColor Yellow
$mysqlRunning = docker inspect --format "{{.State.Running}}" $MYSQL_NAME 2>$null
if ($mysqlRunning -ne "true") {
    Write-Host "      mysql-container belum berjalan. Menjalankan mysql-container..." -ForegroundColor Yellow
    docker start $MYSQL_NAME | Out-Null
    Start-Sleep -Seconds 3
}
Write-Host "      mysql-container OK" -ForegroundColor Green

# 2. Cek Network
Write-Host "[2/3] Mengecek network..." -ForegroundColor Yellow
$netInspect = docker network inspect $NETWORK 2>&1
if ($LASTEXITCODE -ne 0) {
    docker network create $NETWORK | Out-Null
}
docker network connect $NETWORK $MYSQL_NAME 2>&1 | Out-Null
Write-Host "      Network OK" -ForegroundColor Green

# 3. Start services via docker-compose
Write-Host "[3/3] Menjalankan services tds-devto..." -ForegroundColor Yellow
docker-compose up -d

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  tds-devto SIAP BERJALAN!" -ForegroundColor Green
Write-Host "  Frontend : http://localhost:3001" -ForegroundColor Green
Write-Host "  Backend  : http://localhost:8081" -ForegroundColor Green
Write-Host "  Login    : username=davin  password=davin" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""