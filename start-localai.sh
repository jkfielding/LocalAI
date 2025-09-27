#!/bin/bash

# LocalAI Chat PWA Startup Script
# This script ensures the LocalAI Chat PWA runs correctly in Docker Desktop

echo "🚀 Starting LocalAI Chat PWA..."

# Navigate to the project directory
cd "$(dirname "$0")"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Stop any existing containers
echo "🔄 Stopping existing containers..."
docker compose down

# Pull latest images and rebuild
echo "🔨 Building application..."
docker compose build --no-cache

# Start the services
echo "🌟 Starting LocalAI Chat PWA..."
docker compose up -d

# Wait for health check
echo "⏳ Waiting for application to be ready..."
sleep 10

# Check if container is healthy
if docker compose ps | grep -q "healthy"; then
    echo "✅ LocalAI Chat PWA is running successfully!"
    echo "📍 Local access: http://localhost:5174"
    echo "📍 Network access: Check Docker Desktop for container IP"
    echo "🔍 View logs: docker compose logs -f"
    echo "🛑 Stop: docker compose down"
else
    echo "❌ Failed to start LocalAI Chat PWA"
    echo "📋 Check logs: docker compose logs"
    exit 1
fi