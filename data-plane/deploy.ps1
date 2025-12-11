# NetSentinel Production Deployment Script
# Usage: .\deploy.ps1

Write-Host "🚀 NetSentinel Production Deployment" -ForegroundColor Green
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "Please create a .env file with required environment variables." -ForegroundColor Yellow
    Write-Host "See PRODUCTION_DEPLOYMENT.md for details." -ForegroundColor Yellow
    exit 1
}

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker is not running!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker is running" -ForegroundColor Green

# Pull latest images
Write-Host ""
Write-Host "📥 Pulling latest Docker images..." -ForegroundColor Cyan
docker-compose -f docker-compose.prod.yml pull

# Start services
Write-Host ""
Write-Host "🚀 Starting services..." -ForegroundColor Cyan
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
Write-Host ""
Write-Host "⏳ Waiting for services to be healthy..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Check service status
Write-Host ""
Write-Host "📊 Service Status:" -ForegroundColor Cyan
docker-compose -f docker-compose.prod.yml ps

# Run migrations (first time only)
Write-Host ""
$runMigrations = Read-Host "Run database migrations? (y/n)"
if ($runMigrations -eq "y" -or $runMigrations -eq "Y") {
    Write-Host "🔄 Running migrations..." -ForegroundColor Cyan
    docker-compose -f docker-compose.prod.yml exec -T backend python manage.py migrate
}

# Collect static files
Write-Host ""
$collectStatic = Read-Host "Collect static files? (y/n)"
if ($collectStatic -eq "y" -or $collectStatic -eq "Y") {
    Write-Host "📦 Collecting static files..." -ForegroundColor Cyan
    docker-compose -f docker-compose.prod.yml exec -T backend python manage.py collectstatic --noinput
}

# Test health endpoints
Write-Host ""
Write-Host "🏥 Testing health endpoints..." -ForegroundColor Cyan
try {
    $health = Invoke-WebRequest -Uri "http://localhost/health" -UseBasicParsing
    if ($health.StatusCode -eq 200) {
        Write-Host "✅ Nginx health check: OK" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Nginx health check: Failed" -ForegroundColor Yellow
}

try {
    $apiHealth = Invoke-WebRequest -Uri "http://localhost/api/health/" -UseBasicParsing
    if ($apiHealth.StatusCode -eq 200) {
        Write-Host "✅ Backend health check: OK" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Backend health check: Failed" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Useful commands:" -ForegroundColor Cyan
Write-Host "  View logs: docker-compose -f docker-compose.prod.yml logs -f" -ForegroundColor White
Write-Host "  Stop services: docker-compose -f docker-compose.prod.yml down" -ForegroundColor White
Write-Host "  Restart services: docker-compose -f docker-compose.prod.yml restart" -ForegroundColor White
Write-Host ""
