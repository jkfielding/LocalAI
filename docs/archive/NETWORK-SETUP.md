# Network Setup Guide 🌐

## The Problem with Mobile Devices

When you access your LocalAI Chat app from different devices, you need to understand how networking works:

- **On your Mac**: `http://localhost:5174` ✅ Works fine
- **On iPhone/iPad**: `http://localhost:5174` ❌ Won't work (tries to connect to the iPhone itself)
- **On other computers**: `http://localhost:5174` ❌ Won't work

## The Solution

### For Same-Device Access
- **Mac/PC users**: Use `http://localhost:5174`

### For Cross-Device Access (iPhone, iPad, other devices)
- **All devices**: Use your Mac's IP address: `http://192.168.1.102:5174`

## How to Find Your Mac's IP Address

```bash
# Method 1: Command line
ifconfig | grep "inet " | grep -v 127.0.0.1

# Method 2: System Preferences
System Preferences → Network → Select your network → Look for "IP Address"

# Method 3: Quick lookup
ipconfig getifaddr en0
```

Your current Mac IP is: **192.168.1.102**

## Smart URL Detection 🧠

The app now automatically detects the correct companion server URL:

- **Same device**: Uses localhost
- **Remote devices**: Uses the same IP as the web page you're viewing
- **Mixed scenarios**: Automatically adapts

## Setup Instructions

### For iPhone/iPad Users:
1. Make sure your iPhone is on the same WiFi network as your Mac
2. On your iPhone, open Safari
3. Navigate to: `http://192.168.1.102:5174`
4. In Settings, configure:
   - **LM Studio URL**: `http://192.168.1.102:1234`
   - **Chat History Storage**: Can use "LM Studio Server" mode now! 🎉

### For Other Computer Users:
1. Connect to the same WiFi network
2. Open any browser
3. Navigate to: `http://192.168.1.102:5174`
4. Configure the same URLs as above

## Troubleshooting

### "Can't save to companion server" Error
- ✅ **Fixed!** The app now automatically detects the right server URL
- Make sure your Docker container is running: `docker ps`
- Verify the container is healthy: Look for "(healthy)" status

### Network Scanner
- Use the built-in network scanner in the setup wizard
- It will automatically find LM Studio and other AI services on your network
- Works from any device on your network

### Port Conflicts
- **LM Studio**: Port 1234
- **LocalAI Chat**: Port 5174
- Make sure no other apps are using these ports

## Security Notes 🔒

- Your Mac's firewall might block incoming connections
- The app is accessible to anyone on your local network (by design)
- Chat history is stored locally or on your companion server (your choice)
- No data leaves your local network

## Advanced: Dynamic IP

If your Mac's IP changes frequently, consider:
1. Setting a static IP in your router settings
2. Using your Mac's hostname: `http://your-mac-name.local:5174`
3. The network scanner will always find the current IP