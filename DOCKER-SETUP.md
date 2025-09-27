# LocalAI Chat PWA - Docker Setup Guide

## 🐋 Docker Desktop Integration

This LocalAI Chat PWA is designed to run seamlessly with Docker Desktop and can be configured to auto-start on system boot.

## 🚀 Quick Start

### Option 1: Manual Start
```bash
# Simple start (recommended)
./quick-start.sh

# Or full rebuild
./start-localai.sh
```

### Option 2: Direct Docker Commands
```bash
# Start existing container
docker compose up -d

# Rebuild and start
docker compose up -d --build

# View logs
docker compose logs -f

# Stop
docker compose down
```

## 🔄 Auto-Startup Setup

### macOS Auto-Startup
```bash
# Install auto-startup service
./install-autostart.sh

# This will:
# - Set up a LaunchAgent to start on boot
# - Check every 5 minutes if the service is running
# - Start automatically if Docker Desktop is running
```

### Windows Auto-Startup
1. Copy `start-localai.bat` to your Windows Startup folder:
   - Press `Win + R`, type `shell:startup`, press Enter
   - Copy the `start-localai.bat` file there
2. The service will start automatically when you log in

## 📊 Container Configuration

### Features
- **Restart Policy**: `unless-stopped` - restarts automatically unless manually stopped
- **Health Checks**: Built-in health monitoring every 30 seconds
- **Resource Limits**: 512MB memory limit, 256MB reserved
- **Persistent Storage**: Chat history saved in Docker volume
- **Network Access**: Available on localhost:5174 and network IP

### Ports
- **5174**: Main application (PWA + API server)

### Volumes
- **localai-chat-data**: Persistent chat history storage

## 🛠️ Management Commands

```bash
# Check status
docker compose ps

# View logs
docker compose logs -f

# Restart service
docker compose restart

# Update and restart
git pull && docker compose up -d --build

# Clean rebuild
docker compose down && docker compose build --no-cache && docker compose up -d

# Remove everything (including data)
docker compose down -v
```

## 🔍 Troubleshooting

### Container Won't Start
```bash
# Check Docker is running
docker info

# Check logs
docker compose logs

# Force rebuild
docker compose down && docker compose build --no-cache && docker compose up -d
```

### Auto-Startup Not Working (macOS)
```bash
# Check if launch agent is loaded
launchctl list | grep com.localai.chat.pwa

# View startup logs
tail -f /tmp/localai-chat-startup.log

# Reload launch agent
launchctl unload ~/Library/LaunchAgents/com.localai.chat.pwa.plist
launchctl load ~/Library/LaunchAgents/com.localai.chat.pwa.plist
```

### Remove Auto-Startup (macOS)
```bash
# Unload and remove
launchctl unload ~/Library/LaunchAgents/com.localai.chat.pwa.plist
rm ~/Library/LaunchAgents/com.localai.chat.pwa.plist
```

## 🌐 Access Points

- **Local**: http://localhost:5174
- **Network**: Check Docker Desktop for container IP
- **Health Check**: http://localhost:5174/api/health
- **API Info**: http://localhost:5174/api/info

## 📱 Docker Desktop Integration

The container appears in Docker Desktop with:
- **Status indicators**: Green when healthy
- **Resource usage**: Memory and CPU monitoring
- **Log streaming**: Real-time log viewing
- **Quick actions**: Start, stop, restart buttons
- **Volume management**: Persistent data handling

## 🔒 Security Notes

- The service binds to `0.0.0.0:5174` for network access
- No authentication required for local network usage
- Chat history is stored locally in Docker volumes
- No external network connections required for operation

## 🎯 Best Practices

1. **Use Docker Desktop**: Recommended for GUI management
2. **Enable Auto-Start**: Use the provided installation scripts
3. **Regular Updates**: Pull updates and rebuild periodically
4. **Monitor Logs**: Check logs for any issues
5. **Backup Data**: Export chat history if needed

## 📈 Performance

- **Memory Usage**: ~100-200MB typical usage
- **CPU Usage**: Minimal when idle
- **Startup Time**: ~10-15 seconds
- **Network**: Local network only, no internet required