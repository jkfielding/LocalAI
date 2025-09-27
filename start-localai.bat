@echo off
REM LocalAI Chat PWA Startup Script for Windows
REM This script ensures the LocalAI Chat PWA runs correctly in Docker Desktop

echo 🚀 Starting LocalAI Chat PWA...

REM Navigate to the project directory
cd /d "%~dp0"

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

REM Stop any existing containers
echo 🔄 Stopping existing containers...
docker compose down

REM Pull latest images and rebuild
echo 🔨 Building application...
docker compose build --no-cache

REM Start the services
echo 🌟 Starting LocalAI Chat PWA...
docker compose up -d

REM Wait for health check
echo ⏳ Waiting for application to be ready...
timeout /t 10 /nobreak >nul

REM Check if container is running
docker compose ps | findstr "healthy" >nul
if %errorlevel% equ 0 (
    echo ✅ LocalAI Chat PWA is running successfully!
    echo 📍 Local access: http://localhost:5174
    echo 📍 Network access: Check Docker Desktop for container IP
    echo 🔍 View logs: docker compose logs -f
    echo 🛑 Stop: docker compose down
) else (
    echo ❌ Failed to start LocalAI Chat PWA
    echo 📋 Check logs: docker compose logs
    pause
    exit /b 1
)

pause