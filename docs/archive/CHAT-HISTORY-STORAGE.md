# Chat History Storage Options

LocalAI Chat now supports two storage modes for your conversation history:

## Storage Modes

### 🖥️ Device Only (Local Storage)
- **Default setting** for privacy and offline access
- Conversations are stored locally on your device using browser localStorage
- Data stays private and never leaves your device
- Works offline without requiring server connectivity
- Limited by browser storage capacity (~5-10MB typically)

### 🌐 LM Studio Server
- Conversations are saved to your LM Studio server
- **Share conversations between multiple devices** connected to the same LM Studio instance
- **Save local storage space** by moving data to the server
- Requires LM Studio server to be running and accessible
- Enables backing up conversations on your server

## How to Switch Storage Modes

1. Open **Settings** (⚙️ icon in the header)
2. Scroll down to **Chat History Storage** section
3. Select your preferred storage mode:
   - **Device Only**: Keep conversations local and private
   - **LM Studio Server**: Store on server for cross-device sync

## Server API Requirements

When using **LM Studio Server** mode, the app expects these endpoints to be available:

```
GET  /api/chat-history       # List all conversations
POST /api/chat-history       # Save/update a conversation
GET  /api/chat-history/{id}  # Load specific conversation
DELETE /api/chat-history/{id} # Delete specific conversation
DELETE /api/chat-history     # Clear all conversations
```

## Migration Between Modes

### From Local to Server
- Your existing local conversations will remain on your device
- New conversations will be saved to the server
- You can manually export/import if needed

### From Server to Local
- Server conversations remain on the server
- New conversations will be saved locally
- The app will only show conversations from the currently selected storage mode

## Benefits of Each Mode

| Feature | Device Only | LM Studio Server |
|---------|-------------|------------------|
| Privacy | ✅ Maximum | ⚠️ Depends on server setup |
| Cross-device sync | ❌ No | ✅ Yes |
| Offline access | ✅ Yes | ❌ Requires server |
| Storage capacity | ⚠️ Limited (~5-10MB) | ✅ Server dependent |
| Backup | ❌ Manual only | ✅ Server-based |

## Technical Notes

- The storage mode setting is itself stored locally on each device
- Switching modes doesn't automatically migrate existing conversations
- Server mode uses the same base URL as your LM Studio chat completions endpoint
- All server communication uses standard REST API calls with JSON payloads

Choose the storage mode that best fits your privacy needs and usage patterns!