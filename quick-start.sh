#!/bin/bash

# LocalAI Chat PWA Quick Start Script
# This script starts the container if it exists or builds and starts it

echo "⚡ Quick Starting LocalAI Chat PWA..."

# Navigate to the project directory
cd "$(dirname "$0")"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Check if container exists and start it
if docker compose ps -q | grep -q .; then
    echo "🔄 Starting existing container..."
    docker compose start
else
    echo "🔨 Building and starting new container..."
    docker compose up -d --build
fi

# Wait a moment and check status
sleep 5

if docker compose ps | grep -q "healthy\|Up"; then
    echo "✅ LocalAI Chat PWA is running!"
    echo "📍 Access: http://localhost:5174"
    
    # Open in default browser (macOS)
    if command -v open > /dev/null; then
        open http://localhost:5174
    fi
else
    echo "❌ Container failed to start properly"
    echo "📋 Check logs: docker compose logs"
fi