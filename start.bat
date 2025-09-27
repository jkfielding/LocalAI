@echo off
REM LocalAI Chat PWA - Standalone Deployment Script (Windows)
REM This script sets up and runs the LocalAI Chat PWA with its companion server

echo 🚀 LocalAI Chat PWA - Standalone Setup
echo ======================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ first.
    echo    Visit: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detected

echo.
echo 📦 Installing PWA dependencies...
if not exist "node_modules" (
    npm install
) else (
    echo    Dependencies already installed
)

echo.
echo 🏗️  Building PWA...
call npm run build

echo.
echo 📦 Installing server dependencies...
cd server
if not exist "node_modules" (
    npm install
) else (
    echo    Server dependencies already installed
)

REM Create data directory if it doesn't exist
if not exist "data" mkdir data

echo.
echo 🌟 Setup complete!
echo.
echo Starting LocalAI Chat PWA...
echo Press Ctrl+C to stop
echo.

REM Set environment variables
set NODE_ENV=production
if not defined PORT set PORT=5174
if not defined HOST set HOST=0.0.0.0

echo.
echo 🌟 Starting LocalAI Chat on port %PORT%...
echo 📡 Server will be accessible from other devices on your network
echo Press Ctrl+C to stop
echo.

REM Start the server
node server.js