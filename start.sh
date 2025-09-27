#!/bin/bash

# LocalAI Chat PWA - Standalone Deployment Script
# This script sets up and runs the LocalAI Chat PWA with its companion server

set -e

echo "🚀 LocalAI Chat PWA - Standalone Setup"
echo "======================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)

if [ $NODE_MAJOR -lt 16 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 16+ first."
    exit 1
fi

echo "✅ Node.js $NODE_VERSION detected"

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

echo ""
echo "📦 Installing PWA dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "   Dependencies already installed"
fi

echo ""
echo "🏗️  Building PWA..."
npm run build

echo ""
echo "📦 Installing server dependencies..."
cd server
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "   Server dependencies already installed"
fi

# Create data directory if it doesn't exist
mkdir -p data

echo ""
echo "🌟 Setup complete!"
echo ""
echo "Starting LocalAI Chat PWA..."
echo "Press Ctrl+C to stop"
echo ""

# Set environment variables
export NODE_ENV=production
export PORT=${PORT:-5174}
export HOST=${HOST:-0.0.0.0}
export DATA_DIR="$PWD/data"
export STATIC_DIR="$SCRIPT_DIR/dist"

echo ""
echo "🌟 Starting LocalAI Chat on port $PORT..."
echo "📡 Server will be accessible from other devices on your network"
echo "Press Ctrl+C to stop"
echo ""

# Start the server
node server.js