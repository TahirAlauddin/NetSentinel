# PowerShell script to build and push NetSentinel Docker images to Docker Hub
# Usage: .\build-push.ps1 -Version "1.0.0" -DockerHubUsername "yourusername"

param(
    [string]$Version = "latest",
    [string]$DockerHubUsername = $env:DOCKER_HUB_USERNAME
)

if (-not $DockerHubUsername) {
    Write-Host "Error: Docker Hub username is required!" -ForegroundColor Red
    Write-Host "Either set the environment variable DOCKER_HUB_USERNAME or pass -DockerHubUsername parameter" -ForegroundColor Yellow
    exit 1
}

$BackendPath = "src\backend"
$FrontendPath = "src\frontend"

$BackendImage = "${DockerHubUsername}/netsentinel-backend"
$FrontendImage = "${DockerHubUsername}/netsentinel-frontend"

Write-Host "Building and pushing NetSentinel Docker images..." -ForegroundColor Green
Write-Host "Docker Hub Username: $DockerHubUsername" -ForegroundColor Cyan
Write-Host "Version: $Version" -ForegroundColor Cyan

# Build and push backend
Write-Host "`n=== Building Backend ===" -ForegroundColor Yellow
Set-Location $BackendPath
docker build -t ${BackendImage}:${Version} -t ${BackendImage}:latest .
docker push ${BackendImage}:${Version}
docker push ${BackendImage}:latest
Set-Location ..\..

Write-Host "`n[SUCCESS] Backend build and push completed" -ForegroundColor Green

# Build and push frontend
Write-Host "`n=== Building Frontend ===" -ForegroundColor Yellow
Set-Location $FrontendPath
docker build -t ${FrontendImage}:${Version} .
docker tag ${FrontendImage}:${Version} ${FrontendImage}:latest
docker push ${FrontendImage}:${Version}
docker push ${FrontendImage}:latest
Set-Location ..\..

Write-Host "`n[SUCCESS] Frontend build and push completed" -ForegroundColor Green

Write-Host "`n=== Summary ===" -ForegroundColor Green
Write-Host "Backend Image: ${BackendImage}:${Version}" -ForegroundColor Cyan
Write-Host "Frontend Image: ${FrontendImage}:${Version}" -ForegroundColor Cyan
Write-Host "`n[SUCCESS] All images pushed to Docker Hub successfully!" -ForegroundColor Green

