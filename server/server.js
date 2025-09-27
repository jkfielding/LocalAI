const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const rateLimit = require('express-rate-limit');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 5174;
const HOST = process.env.HOST || '0.0.0.0';
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const STATIC_DIR = process.env.STATIC_DIR || path.join(__dirname, '..', 'dist');

console.log('🚀 LocalAI Companion Server Starting...');
console.log(`📁 Data directory: ${DATA_DIR}`);
console.log(`🌐 Static files: ${STATIC_DIR}`);
console.log(`🔗 Binding to: ${HOST}:${PORT}`);
if (HOST === '0.0.0.0') {
  console.log('📡 Server will be accessible from other devices on your network');
}

// Middleware
app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', apiLimiter);

// Ensure data directory exists
fs.ensureDirSync(DATA_DIR);

// Helper functions
const getChatFilePath = (id) => path.join(DATA_DIR, `${id}.json`);
const getIndexFilePath = () => path.join(DATA_DIR, 'index.json');

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

const saveIndex = async (index) => {
  try {
    await fs.writeJson(getIndexFilePath(), index, { spaces: 2 });
  } catch (error) {
    console.error('Error saving index:', error);
  }
};

// Serve static files (PWA) - Set up synchronously
console.log(`🌐 Setting up static files from: ${STATIC_DIR}`);
app.use(express.static(STATIC_DIR));
console.log('✅ Static file middleware configured');

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'localai-companion-server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Get server info
app.get('/api/info', (req, res) => {
  res.json({
    name: 'LocalAI Companion Server',
    version: '1.0.0',
    description: 'Chat history storage API for LocalAI PWA',
    endpoints: {
      health: '/api/health',
      chatHistory: {
        list: 'GET /api/chat-history',
        get: 'GET /api/chat-history/:id',
        save: 'POST /api/chat-history',
        delete: 'DELETE /api/chat-history/:id',
        clear: 'DELETE /api/chat-history'
      }
    }
  });
});

// List all chat conversations
app.get('/api/chat-history', async (req, res) => {
  try {
    const index = await loadIndex();
    res.json({
      success: true,
      data: index.sort((a, b) => b.timestamp - a.timestamp), // Most recent first
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
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid chat ID'
      });
    }

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
        message: 'Invalid chat data. Required: id, messages (array)'
      });
    }

    // Validate message structure
    for (const msg of messages) {
      if (!msg.id || !msg.role || msg.content === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Invalid message structure. Each message must have: id, role, content'
        });
      }
    }

    const chatEntry = {
      id,
      summary: summary || messages.find(m => m.role === 'user')?.content?.substring(0, 50) + '...' || 'Untitled Chat',
      timestamp: Date.now(),
      messageCount: messages.length,
      messages,
      lastModified: new Date().toISOString()
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
      messageCount: chatEntry.messageCount,
      lastModified: chatEntry.lastModified
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
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid chat ID'
      });
    }

    const chatPath = getChatFilePath(id);
    
    // Remove chat file if it exists
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
    // Get all files in data directory
    const files = await fs.readdir(DATA_DIR);
    
    // Remove all JSON files (chat files and index)
    const deletePromises = files
      .filter(file => file.endsWith('.json'))
      .map(file => fs.remove(path.join(DATA_DIR, file)));
      
    await Promise.all(deletePromises);
    
    res.json({
      success: true,
      message: `All chat history cleared (${deletePromises.length} files removed)`
    });
  } catch (error) {
    console.error('Error clearing chat history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear chat history'
    });
  }
});

// Fallback for PWA routing (serve index.html for SPA routes, not static files)
app.get('*', async (req, res) => {
  // Don't serve index.html for static asset requests
  if (req.path.startsWith('/assets/') || 
      req.path.endsWith('.js') || 
      req.path.endsWith('.css') || 
      req.path.endsWith('.png') || 
      req.path.endsWith('.jpg') || 
      req.path.endsWith('.svg') || 
      req.path.endsWith('.ico') ||
      req.path.endsWith('.webmanifest') ||
      req.path.endsWith('.json')) {
    return res.status(404).json({ error: 'Static file not found' });
  }
  
  try {
    const indexPath = path.join(STATIC_DIR, 'index.html');
    if (await fs.pathExists(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({
        error: 'PWA files not found',
        message: 'Please build the PWA first: npm run build'
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
app.listen(PORT, HOST, () => {
  console.log('');
  console.log('🎉 LocalAI Companion Server is running!');
  console.log('');
  
  if (HOST === '0.0.0.0') {
    console.log(`📍 Local: http://localhost:${PORT}`);
    
    // Try to detect network IP
    const interfaces = os.networkInterfaces();
    const networkIPs = [];
    
    Object.keys(interfaces).forEach(name => {
      interfaces[name].forEach(iface => {
        if (iface.family === 'IPv4' && !iface.internal) {
          networkIPs.push(iface.address);
        }
      });
    });
    
    networkIPs.forEach(ip => {
      console.log(`📍 Network: http://${ip}:${PORT}`);
    });
  } else {
    console.log(`📍 Server: http://${HOST}:${PORT}`);
  }
  
  console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
  console.log(`📋 Info: http://localhost:${PORT}/api/info`);
  
  console.log('');
  console.log('📚 Available API Endpoints:');
  console.log('  GET    /api/health');
  console.log('  GET    /api/info');
  console.log('  GET    /api/chat-history');
  console.log('  POST   /api/chat-history');
  console.log('  GET    /api/chat-history/:id');
  console.log('  DELETE /api/chat-history/:id');
  console.log('  DELETE /api/chat-history');
  console.log('');
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n📤 Received ${signal}. Graceful shutdown...`);
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception thrown:', error);
  process.exit(1);
});