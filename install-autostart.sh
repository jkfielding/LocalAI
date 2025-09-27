#!/bin/bash

# LocalAI Chat PWA Installation Script
# This script sets up auto-startup for the LocalAI Chat PWA

echo "🔧 Setting up LocalAI Chat PWA for auto-startup..."

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLIST_FILE="com.localai.chat.pwa.plist"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"

# Ensure LaunchAgents directory exists
mkdir -p "$LAUNCH_AGENTS_DIR"

# Copy the plist file
echo "📋 Installing launch agent..."
cp "$PROJECT_DIR/$PLIST_FILE" "$LAUNCH_AGENTS_DIR/"

# Update the plist with correct paths
sed -i '' "s|/Volumes/SSD - Fast/LocalAI-React|$PROJECT_DIR|g" "$LAUNCH_AGENTS_DIR/$PLIST_FILE"

# Load the launch agent
echo "🚀 Loading launch agent..."
launchctl unload "$LAUNCH_AGENTS_DIR/$PLIST_FILE" 2>/dev/null || true
launchctl load "$LAUNCH_AGENTS_DIR/$PLIST_FILE"

echo "✅ LocalAI Chat PWA is now set up to auto-start!"
echo ""
echo "📋 Management Commands:"
echo "  Start manually: ./quick-start.sh"
echo "  View logs: tail -f /tmp/localai-chat-startup.log"
echo "  Stop auto-start: launchctl unload ~/Library/LaunchAgents/$PLIST_FILE"
echo "  Remove auto-start: rm ~/Library/LaunchAgents/$PLIST_FILE"
echo ""
echo "🔄 The service will start automatically on boot and check every 5 minutes."
echo "📍 Access the app at: http://localhost:5174"

# Test the service
echo ""
echo "🧪 Testing the service..."
"$PROJECT_DIR/quick-start.sh"