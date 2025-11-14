#!/bin/bash

echo "🔨 Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🐳 Rebuilding Docker container..."
    docker-compose down
    docker-compose up --build -d
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Docker container rebuilt successfully!"
        echo ""
        echo "📋 Container status:"
        docker-compose ps
        echo ""
        echo "🌐 Application should be available at: http://localhost:5174"
        echo "🏥 Health check: http://localhost:5174/api/health"
        echo ""
        echo "📊 Check browser console for detailed storage logs:"
        echo "   - 💾 Saving chat history"
        echo "   - 📦 ChatHistoryService logs"
        echo "   - 🗄️ IndexedDB logs"
        echo "   - 🌐 Server storage logs"
    else
        echo "❌ Docker rebuild failed"
        exit 1
    fi
else
    echo "❌ Build failed"
    exit 1
fi
