# Network Access Guide - LocalAI Chat

LocalAI Chat is now configured to be accessible from any device on your local network, making it easy to use from phones, tablets and other computers.

## 🌐 Network Configuration

### Default Settings
- **Port**: 5174 (less commonly used, reduces conflicts)
- **Host Binding**: 0.0.0.0 (accepts connections from any IP)
- **Network**: Accessible across your local network

### Finding Your Network IP

**macOS/Linux:**
```bash
# Get your IP address
ifconfig | grep "inet " | grep -v 127.0.0.1

# Or use hostname
hostname -I
```

**Windows:**
```batch
# Get your IP address
ipconfig | findstr "IPv4"
```

**From the companion server output:**
When you start LocalAI Chat, it automatically detects and displays your network IPs:
```
🎉 LocalAI Companion Server is running!

📍 Local: http://localhost:5174
📍 Network: http://192.168.1.102:5174
📍 Network: http://192.168.1.103:5174
🌐 PWA App: Access from any of the above URLs
```

## 📱 Accessing from Different Devices

### Same Computer
```
http://localhost:5174
```

### Other Devices on Network
```
http://[YOUR-IP]:5174

Examples:
http://192.168.1.102:5174
http://10.0.0.15:5174
http://172.16.1.100:5174
```

### Mobile Devices
1. Connect to the same WiFi network
2. Open browser on mobile device
3. Navigate to `http://[YOUR-IP]:5174`
4. App will work like a native mobile app (PWA)

### Tablets and Other Computers
Same as mobile - just use your computer's IP address with port 5174

## 🚀 Deployment Methods

### Standalone Deployment
```bash
# Automatically binds to 0.0.0.0:5174
./start.sh

# Custom port if needed
PORT=5175 ./start.sh
```

### Docker Deployment
```bash
# Automatically exposes port 5174 to network
docker-compose up -d

# Custom port mapping
docker run -p 5175:5174 -v localai-data:/app/server/data localai-chat
```

## 🔒 Network Security

### Local Network Only
- Server only accepts connections from your local network
- No external internet access required
- Data stays on your local infrastructure

### Firewall Considerations
If you can't connect from other devices:

**macOS:**
```bash
# Allow port 5174 through macOS firewall (if enabled)
sudo pfctl -f /etc/pf.conf
```

**Windows:**
```batch
# Allow port 5174 through Windows Firewall
netsh advfirewall firewall add rule name="LocalAI Chat" dir=in action=allow protocol=TCP localport=5174
```

**Linux:**
```bash
# Allow port 5174 through ufw firewall
sudo ufw allow 5174
```

## 🛠️ Troubleshooting

### Can't Access from Other Devices

1. **Check IP Address**: Make sure you're using the correct IP
   ```bash
   # Test if server is running
   curl http://localhost:5174/api/health
   ```

2. **Check Network Connection**: Ensure devices are on same network
   ```bash
   # Ping your computer from mobile device
   ping [YOUR-IP]
   ```

3. **Check Firewall**: Temporarily disable firewall to test
4. **Check Port**: Verify nothing else is using port 5174
   ```bash
   # Check if port is in use
   lsof -i :5174
   ```

### Port Conflicts

If port 5174 is already in use:

**Standalone:**
```bash
PORT=5175 ./start.sh
```

**Docker:**
```bash
docker run -p 5175:5174 localai-chat
```

### Network Discovery

Can't find your IP? The server shows all available network addresses when it starts:

```
📍 Local: http://localhost:5174
📍 Network: http://192.168.1.102:5174  ← Use this IP
📍 Network: http://10.0.0.15:5174      ← Or this one
```

## ✨ Benefits

### Cross-Device Sync
- Chat history stored on companion server
- Access same conversations from any device
- Real-time synchronization

### Mobile Experience
- PWA (Progressive Web App) works like native mobile app
- Can be "installed" on home screen
- Works offline after first load
- Push notifications (future feature)

### Family/Team Usage
- Multiple people can access same LocalAI instance
- Shared chat history (if using companion server storage)
- No need to install software on every device

This network configuration makes LocalAI Chat accessible and convenient for all your devices! 🚀