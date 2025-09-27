# Chat History Server Implementation

Since LM Studio doesn't include chat history API endpoints, here's a simple Node.js server you can optionally run alongside LM Studio to enable server-based chat history storage.

## Quick Setup

1. Create a new directory: `mkdir chat-history-server && cd chat-history-server`
2. Initialize npm: `npm init -y`
3. Install dependencies: `npm install express cors fs-extra`
4. Create the server file (below)
5. Run: `node server.js`

## server.js

```javascript
const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3030;
const DATA_DIR = path.join(__dirname, 'chat-data');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Ensure data directory exists
fs.ensureDirSync(DATA_DIR);

// Helper function to get chat file path
const getChatFilePath = (id) => path.join(DATA_DIR, `${id}.json`);
const getIndexFilePath = () => path.join(DATA_DIR, 'index.json');

// Load chat index
const loadIndex = async () => {
  try {
    const indexPath = getIndexFilePath();
    if (await fs.pathExists(indexPath)) {
      return await fs.readJson(indexPath);
    }
    return [];
  } catch (error) {
    console.error('Error loading index:', error);
    return [];
  }
};

// Save chat index
const saveIndex = async (index) => {
  try {
    await fs.writeJson(getIndexFilePath(), index, { spaces: 2 });
  } catch (error) {
    console.error('Error saving index:', error);
  }
};

// API Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'chat-history-server' });
});

// List all chat conversations
app.get('/api/chat-history', async (req, res) => {
  try {
    const index = await loadIndex();
    res.json({
      success: true,
      data: index,
      message: 'Chat history loaded successfully'
    });
  } catch (error) {
    console.error('Error listing chats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load chat history'
    });
  }
});

// Get specific chat conversation
app.get('/api/chat-history/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const chatPath = getChatFilePath(id);
    
    if (!(await fs.pathExists(chatPath))) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }
    
    const chatData = await fs.readJson(chatPath);
    res.json({
      success: true,
      data: chatData,
      message: 'Chat loaded successfully'
    });
  } catch (error) {
    console.error('Error loading chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load chat'
    });
  }
});

// Save chat conversation
app.post('/api/chat-history', async (req, res) => {
  try {
    const { id, summary, messages } = req.body;
    
    if (!id || !messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chat data'
      });
    }

    const chatEntry = {
      id,
      summary: summary || 'Untitled Chat',
      timestamp: Date.now(),
      messageCount: messages.length,
      messages
    };

    // Save chat file
    await fs.writeJson(getChatFilePath(id), chatEntry, { spaces: 2 });
    
    // Update index
    const index = await loadIndex();
    const existingIndex = index.findIndex(chat => chat.id === id);
    
    const indexEntry = {
      id: chatEntry.id,
      summary: chatEntry.summary,
      timestamp: chatEntry.timestamp,
      messageCount: chatEntry.messageCount
    };
    
    if (existingIndex >= 0) {
      index[existingIndex] = indexEntry;
    } else {
      index.unshift(indexEntry); // Add to beginning
    }
    
    await saveIndex(index);
    
    res.json({
      success: true,
      id: chatEntry.id,
      message: 'Chat saved successfully'
    });
  } catch (error) {
    console.error('Error saving chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save chat'
    });
  }
});

// Delete specific chat
app.delete('/api/chat-history/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const chatPath = getChatFilePath(id);
    
    // Remove chat file
    if (await fs.pathExists(chatPath)) {
      await fs.remove(chatPath);
    }
    
    // Update index
    const index = await loadIndex();
    const filteredIndex = index.filter(chat => chat.id !== id);
    await saveIndex(filteredIndex);
    
    res.json({
      success: true,
      message: 'Chat deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete chat'
    });
  }
});

// Clear all chat history
app.delete('/api/chat-history', async (req, res) => {
  try {
    // Remove all chat files
    const files = await fs.readdir(DATA_DIR);
    await Promise.all(
      files.map(file => fs.remove(path.join(DATA_DIR, file)))
    );
    
    res.json({
      success: true,
      message: 'All chat history cleared'
    });
  } catch (error) {
    console.error('Error clearing chat history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear chat history'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Chat History Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Data directory: ${DATA_DIR}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down chat history server...');
  process.exit(0);
});
```

## package.json

```json
{
  "name": "chat-history-server",
  "version": "1.0.0",
  "description": "Simple chat history storage server for LocalAI",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "fs-extra": "^11.1.1"
  }
}
```

## Usage

1. **Start the server**: `npm start`
2. **Update LocalAI settings**: 
   - Set Chat History Storage to "LM Studio Server"
   - Make sure your API endpoint base URL is correct (e.g., `http://192.168.1.102:1234`)
   - The chat history will be saved to `http://192.168.1.102:3030/api/chat-history`

## Configuration

### Different Port
Change the PORT environment variable: `PORT=3031 npm start`

### Different Data Directory
Modify the `DATA_DIR` variable in `server.js`

### Network Access
The server binds to all interfaces by default. For security, you might want to bind to localhost only:

```javascript
app.listen(PORT, 'localhost', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

## Features

- ✅ RESTful API compatible with LocalAI
- ✅ JSON file storage (no database required)
- ✅ CORS enabled for browser access
- ✅ Error handling and validation
- ✅ Automatic data directory creation
- ✅ Index-based chat listing for performance
- ✅ Health check endpoint
- ✅ Graceful shutdown handling

## Data Structure

```
chat-data/
├── index.json          # Quick index of all chats
├── chat-123.json       # Individual chat files
├── chat-456.json
└── ...
```

Each chat file contains:
```json
{
  "id": "chat-123",
  "summary": "Conversation about React",
  "timestamp": 1635724800000,
  "messageCount": 5,
  "messages": [...]
}
```

## Security Notes

- This is a basic implementation for development/personal use
- For production, consider adding authentication
- Validate and sanitize all inputs
- Consider rate limiting
- Use HTTPS in production
- Regular backup of the data directory

This server provides the missing chat history functionality that LM Studio doesn't include natively!