# LocalAI Chat PWA - Deployment Guide

LocalAI Chat is a Progressive Web App (PWA) that provides a modern chat interface for LM Studio. It includes a companion server for enhanced features like cross-device chat history synchronization.

## 🚀 Quick Start Options

### Option 1: Standalone Deployment (Recommended)

**macOS/Linux:**
```bash
# Clone or download the project
git clone <repository-url>
cd LocalAI-React

# Run the setup script
./start.sh
```

**Windows:**
```batch
# Clone or download the project
git clone <repository-url>
cd LocalAI-React

# Run the setup script
start.bat
```

**What it does:**
- Automatically installs all dependencies
- Builds the PWA
- Starts the companion server
- Opens the app at `http://localhost:5174`
- Accessible from other devices on your network

### Option 2: Docker Deployment

**Single Container:**
```bash
# Build and run
docker build -t localai-chat .
docker run -p 5174:5174 -v localai-data:/app/server/data localai-chat
```

**Docker Compose (Recommended):**
```bash
# Start with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

**What it includes:**
- Self-contained environment
- Persistent data storage
- Health checks
- Easy scaling and management

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Browser       │    │  Companion       │    │   LM Studio     │
│   (PWA)         │    │  Server          │    │   Server        │
│                 │    │                  │    │                 │
│ • React UI      │◄──►│ • Chat History   │    │ • LLM Models    │
│ • PWA Features  │    │ • REST API       │    │ • Chat API      │
│ • Local Storage │    │ • File Storage   │    │ • Model Mgmt    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
   localhost:5174       localhost:5174/api      localhost:1234
```

## 📋 Prerequisites

### System Requirements
- **Node.js**: Version 16 or higher
- **npm**: Comes with Node.js
- **LM Studio**: Running locally for AI functionality
- **Modern Browser**: Chrome, Firefox, Safari or Edge

### For Docker Deployment
- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher (optional)

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5174` | Port for companion server |
| `HOST` | `0.0.0.0` | Host binding (0.0.0.0 allows external access) |
| `NODE_ENV` | `production` | Node environment |
| `DATA_DIR` | `./server/data` | Directory for chat history storage |
| `STATIC_DIR` | `./dist` | Directory for PWA static files |

### Standalone Configuration
Create a `.env` file in the root directory:
```bash
PORT=5174
HOST=0.0.0.0
DATA_DIR=./server/data
```

### Docker Configuration
Modify `docker-compose.yml` for custom settings:
```yaml
environment:
  - PORT=5174
  - HOST=0.0.0.0
  - NODE_ENV=production
```

## 🔧 Development Setup

### Local Development
```bash
# Install PWA dependencies
npm install

# Start development server (PWA only)
npm run dev

# In another terminal, start companion server
cd server
npm install
npm start
```

### Docker Development
```bash
# Development with live reload
docker-compose -f docker-compose.dev.yml up

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

## 📚 Features

### PWA Features
- ✅ **Offline Support**: Works without internet connection
- ✅ **Installable**: Add to home screen like native app
- ✅ **Responsive**: Works on desktop, tablet and mobile
- ✅ **Fast Loading**: Optimized with service workers

### Chat Features
- ✅ **Real-time Chat**: Streaming responses from LM Studio
- ✅ **Chat History**: Local and server-based storage options
- ✅ **Model Selection**: Dynamic model loading from LM Studio
- ✅ **Custom System Prompts**: Personalize AI behavior
- ✅ **Dark/Light Mode**: Theme switching
- ✅ **Export/Import**: Conversation management

### Companion Server Features
- ✅ **REST API**: Standard endpoints for chat operations
- ✅ **File Storage**: JSON-based chat history storage
- ✅ **CORS Support**: Cross-origin requests enabled
- ✅ **Rate Limiting**: Protection against abuse
- ✅ **Health Checks**: Monitoring and diagnostics

## 🔌 API Endpoints

The companion server provides these endpoints:

### Health & Info
- `GET /api/health` - Server health check
- `GET /api/info` - Server information and available endpoints

### Chat History
- `GET /api/chat-history` - List all conversations
- `POST /api/chat-history` - Save conversation
- `GET /api/chat-history/:id` - Get specific conversation
- `DELETE /api/chat-history/:id` - Delete specific conversation
- `DELETE /api/chat-history` - Clear all conversations

## 🚦 Usage

### First Time Setup
1. **Start LM Studio** and ensure it's running on `localhost:1234`
2. **Deploy LocalAI Chat** using either standalone or Docker method
3. **Open Browser** and navigate to `http://localhost:5174` or your device's IP
4. **Run Setup Wizard** to configure connection to LM Studio
5. **Start Chatting** with your local AI models

### Network Access
The companion server binds to `0.0.0.0` by default, making it accessible from:
- **Same device**: `http://localhost:5174`
- **Other devices**: `http://[YOUR-IP]:5174` (e.g., `http://192.168.1.102:5174`)
- **Mobile devices**: Same network IP address

### Settings Configuration
- **API Endpoint**: LM Studio server URL (default: `http://192.168.1.102:1234/v1/chat/completions`)
- **Model Selection**: Choose from available LM Studio models
- **System Prompt**: Customize AI personality and behavior
- **Chat History Storage**: Choose between local device or companion server
- **Context Length**: Set conversation context window
- **Dark Mode**: Toggle between light and dark themes

### Chat History Options

**Device Only (Local Storage):**
- Stored in browser localStorage
- Private to current device/browser
- ~5-10MB storage limit
- Works offline
- No synchronization between devices

**Companion Server:**
- Stored on companion server
- Synchronized between devices
- Unlimited storage (disk-based)
- Requires companion server running
- Backup and restore capabilities

## 🔒 Security Considerations

### Network Security
- **Local Network**: Designed for local network usage
- **CORS**: Configured for development; restrict in production
- **Rate Limiting**: Basic protection against abuse
- **No Authentication**: Add authentication for production use

### Data Security
- **Local Data**: Chat history stored locally or on companion server
- **No Cloud**: No data sent to external services
- **Privacy**: Conversations remain on your infrastructure

## 🐛 Troubleshooting

### Common Issues

**PWA won't load:**
- Check that companion server is running on port 3030
- Verify PWA was built (`npm run build`)
- Clear browser cache and reload

**Chat history won't save:**
- Check companion server is running for server mode
- Switch to "Device Only" mode if server is unavailable
- Check browser console for error messages

**Can't connect to LM Studio:**
- Verify LM Studio is running and server is started
- Check API endpoint in settings
- Test connection using the connection test button

**Docker issues:**
- Check Docker is running and ports aren't conflicting
- Verify Docker has sufficient resources
- Check logs with `docker-compose logs`

### Port Conflicts
If port 5174 is in use:

**Standalone:**
```bash
PORT=5175 ./start.sh
```

**Docker:**
```bash
docker run -p 5175:5174 -v localai-data:/app/server/data localai-chat
```

### Log Analysis
**Standalone:**
- Server logs appear in terminal
- Browser dev tools for PWA issues

**Docker:**
```bash
# View logs
docker-compose logs -f

# Check container health
docker-compose ps
```

## 🔄 Updates and Maintenance

### Updating Standalone Installation
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
./start.sh
```

### Updating Docker Installation
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up --build -d
```

### Data Backup
**Standalone:**
```bash
# Backup chat data
cp -r server/data/ backup/$(date +%Y%m%d)/
```

**Docker:**
```bash
# Backup Docker volume
docker run --rm -v localai-data:/data -v $(pwd):/backup alpine tar czf /backup/chat-backup-$(date +%Y%m%d).tar.gz -C /data .
```

## 📞 Support

For issues and questions:
1. Check this documentation
2. Review browser console for errors
3. Check companion server logs
4. Verify LM Studio is running and accessible
5. Open GitHub issue with detailed information

## 🎯 Production Deployment

For production use, consider:
- Adding authentication/authorization
- Using HTTPS with proper certificates
- Implementing database storage instead of file storage
- Adding monitoring and logging
- Setting up proper backups
- Restricting CORS to specific origins
- Using a reverse proxy (nginx, Apache)
- Implementing user management

This deployment guide provides everything needed to run LocalAI Chat in various environments!