#!/bin/bash

echo "🧹 Cleaning Docker build cache..."
docker system prune -f

echo ""
echo "🔨 Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🐳 Stopping containers..."
    docker-compose down -v
    
    echo ""
    echo "🐳 Rebuilding Docker container (no cache)..."
    docker-compose build --no-cache
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🐳 Starting containers..."
        docker-compose up -d
        
        echo ""
        echo "✅ Docker container rebuilt successfully!"
        echo ""
        echo "📋 Container status:"
        docker-compose ps
        echo ""
        echo "📋 Container logs:"
        docker-compose logs --tail=20
        echo ""
        echo "🌐 Application: http://localhost:5174"
        echo "🏥 Health check: http://localhost:5174/api/health"
    else
        echo "❌ Docker build failed"
        exit 1
    fi
else
    echo "❌ Build failed"
    exit 1
fi
