# LocalAI Chat - React PWA 🚀

A modern, responsive Progressive Web App (PWA) for chatting with local AI services. Compatible with LM Studio, Ollama, LocalAI and any OpenAI-compatible API. Built with React, TypeScript and Tailwind CSS.

![LocalAI Chat PWA](https://img.shields.io/badge/AI-Local%20Chat-blue) 
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)
![PWA](https://img.shields.io/badge/PWA-Ready-green)
![Docker](https://img.shields.io/badge/Docker-Supported-2496ed)

## 🚀 Features

- **🔒 100% Private & Local**: All conversations stay on your device
- **⚡ Fast Response Times**: Direct connection to your local AI service
- **🤖 Multi-Platform Support**: Works with LM Studio, Ollama, LocalAI and more
- **💻 Works Offline**: PWA capabilities for offline usage
- **🌙 Dark Mode**: Built-in light/dark theme toggle
- **📱 Responsive Design**: Works perfectly on desktop, tablet and mobile
- **💬 Chat History**: Save and manage multiple conversations
- **🔄 Streaming Support**: Real-time response streaming
- **⚙️ Easy Setup**: Guided setup wizard with network auto-discovery
- **🎛️ Customizable**: Adjust temperature, max tokens and more
- ** Network Scanner**: Automatically detect AI services on your network

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **PWA**: Vite PWA Plugin
- **Icons**: React Icons (Feather)
- **Notifications**: React Hot Toast

## 🚀 Quick Start (Docker - Recommended)

```bash
git clone https://github.com/jkfielding/localai-chat-react.git
cd localai-chat-react
docker-compose up -d
```

Access at: **http://localhost:5174**

1. **Node.js** (version 16 or higher)

## 🏗️ Setup Your AI Service2. **An AI service** running locally:

   - **LM Studio**: Download from [lmstudio.ai](https://lmstudio.ai) - Default port: 1234

### 🍎 LM Studio (Recommended for Mac)

**LM Studio** is the easiest way to get started on macOS:

```bash
# Download from lmstudio.ai
# 1. Install LM Studio
# 2. Download a model (e.g., Llama 3)
# 3. Go to Local Server tab
# 4. Start server on port 1234

# Default endpoint: http://localhost:1234
```

### 🐋 LocalAI

```bash
# Docker setup
docker run -p 8080:8080 --name local-ai quay.io/go-skynet/local-ai:latest

# Default endpoint: http://localhost:8080
```

### 🦙 Ollama

```bash
# Install and run
ollama serve
ollama pull llama3

# Default endpoint: http://localhost:11434
```

## 🚀 Quick Start

### Option 1: Development Setup

```bash

```bash# Clone the repository

# Install and rungit clone https://github.com/yourusername/localai-chat-react.git

ollama servecd localai-chat-react

ollama pull llama3

# Install dependencies

# Default endpoint: http://localhost:11434npm install

```

# Start development server

### OpenAI-Compatible APIsnpm run dev

Works with any service that implements the OpenAI API standard:```

- Text Generation WebUI

- FastChatThe app will be available at `http://localhost:5173`

- vLLM

- Custom implementations### Option 2: Docker Deployment (Recommended)



## 📱 PWA Installation```bash

# Clone and build

1. Open the app in your browsergit clone https://github.com/yourusername/localai-chat-react.git

2. Look for the install prompt/buttoncd localai-chat-react

3. Click "Install" to add to your device

4. Enjoy native app experience!# Start with Docker Compose

docker-compose up -d

## 🌐 Network Access & Multi-Device

# Or build and run manually

Perfect for accessing your AI from any device on your network:docker build -t localai-chat .

docker run -d --name localai-chat -p 5174:5174 localai-chat

1. **Find your computer's IP**: `192.168.1.100` (example)```

2. **Access from mobile**: `http://192.168.1.100:5174`

3. **Chat history syncs** across all devices automaticallyThe app will be available at `http://localhost:5174`

4. **Install as PWA** on each device for native experience

### Option 3: Standalone Production Build

## ⚙️ Smart Features

```bash

### 🔍 Intelligent Network Scanner# Install and build

- **Quick Scan**: Finds localhost services in <1 secondnpm install

- **Smart Full Scan**: Targets likely IPs, 97% fewer requestsnpm run build

- **Auto-Detection**: Automatically identifies AI service types

- **Progress Tracking**: Real-time scanning progress# Start production server

npm start

### 💬 Advanced Chat Management```

- **Cross-Device Sync**: Chat history available on all devices

- **Smart Storage**: Device-only or companion server storage## ⚙️ Configuration

- **Individual Controls**: Delete, sync or manage each chat

- **Export/Import**: Full chat history portability### Environment Variables



### 🎨 Enhanced UI/UX| Variable | Description | Default |

- **Dark Mode Preview**: See changes before applying|----------|-------------|---------|

- **Smart Dropdowns**: Context-aware menu positioning| `PORT` | Server port | `5174` |

- **Mobile Optimized**: Perfect touch experience| `HOST` | Server host | `0.0.0.0` |

- **Responsive Design**: Adapts to any screen size| `NODE_ENV` | Environment | `production` |

| `DATA_DIR` | Chat history storage | `./server/data` |

## 🔧 Development Setup| `STATIC_DIR` | PWA static files | `./dist` |



```bash### AI Service Setup

# Clone and install

git clone https://github.com/yourusername/localai-chat-react.git#### LM Studio

cd localai-chat-react1. Download and install [LM Studio](https://lmstudio.ai)

npm install2. Load your preferred model

3. Go to **Server** tab → **Start Server**

# Development server4. Default endpoint: `http://localhost:1234/v1/chat/completions`

npm run dev

# Access at: http://localhost:5173#### Ollama  

1. Install [Ollama](https://ollama.ai)

# Production build2. Pull a model: `ollama pull llama2`

npm run build3. Start Ollama service

npm start4. Default endpoint: `http://localhost:11434/api/chat`

# Access at: http://localhost:5174

```#### LocalAI

1. Set up [LocalAI](https://localai.io) server

## 📁 Project Structure2. Configure your models

3. Default endpoint: `http://localhost:8080/v1/chat/completions`

```

src/## 🌐 Network Access

├── components/          # React components

│   ├── ChatHistoryModal.tsx    # Advanced chat managementThe app supports both local and network access:

│   ├── SetupWizard.tsx         # Guided AI service setup  

│   ├── NetworkScannerComponent.tsx # Intelligent network discovery- **Local**: `http://localhost:5174`

│   ├── SettingsModal.tsx       # Configuration with live preview- **Network**: `http://YOUR_IP:5174` (e.g., `http://192.168.1.100:5174`)

│   └── MessageBubble.tsx       # Chat message display

├── contexts/           # State management### Mobile Access

│   ├── ChatContext.tsx         # Chat state and logic

│   └── SettingsContext.tsx     # App settings and preferences1. Ensure your AI service allows network connections

├── services/           # API integrations2. Connect your mobile device to the same WiFi network

│   ├── chatHistoryService.ts   # Cross-device chat sync3. Navigate to `http://YOUR_COMPUTER_IP:5174`

│   └── mcpService.ts           # Model Context Protocol4. Install as PWA for native app experience

├── utils/              # Utilities

│   └── networkScanner.ts      # Optimized AI service discovery## 🏗️ Build Scripts

└── types/              # TypeScript definitions

```bash

server/npm run build

├── server.js           # Express companion server```

├── data/              # Chat history storage

└── package.json       # Server dependenciesThe built files will be in the `dist` folder, ready for deployment.

```

## 📱 PWA Installation

## 🐳 Docker Configuration

The app can be installed as a Progressive Web App:

### Environment Variables

```bash1. Visit the app in your browser

PORT=5174              # Server port2. Look for the "Install" prompt or button

HOST=0.0.0.0          # Network access (0.0.0.0 for all devices)3. Click "Install" to add it to your device

NODE_ENV=production   # Environment mode

DATA_DIR=./server/data # Chat storage directory## ⚙️ Configuration

```

### Default Settings

### Custom Docker Setup

```bash- **API Endpoint**: `http://localhost:1234/v1/chat/completions`

# Build custom image- **Model**: `gpt-3.5-turbo`

docker build -t my-localai-chat .- **Max Tokens**: `2048`

- **Temperature**: `0.7`

# Run with custom port- **Streaming**: `Enabled`

docker run -d --name ai-chat -p 8080:5174 my-localai-chat

### Customization

# With custom data directory

docker run -d --name ai-chat -v ./my-chats:/app/server/data -p 5174:5174 my-localai-chatAll settings can be adjusted through the Settings modal:

```

- **API Endpoint**: Your LM Studio server URL

## 🔐 Privacy & Security- **Model Name**: The model identifier

- **Max Tokens**: Maximum response length (100-8192)

- **Zero External Calls**: No data leaves your local network- **Temperature**: Response creativity (0-2)

- **Local Storage**: Chat history stored on your devices/server only- **Streaming**: Enable/disable real-time responses

- **Network Isolation**: Companion server only accessible on local network- **Dark Mode**: Toggle dark theme

- **No Tracking**: No analytics, telemetry or external dependencies

- **Open Source**: Full transparency, audit-friendly codebase## 🔧 Development



## 🎯 Performance Optimizations### Available Scripts



- **Smart Network Scanning**: 97% reduction in network requests- `npm run dev` - Start development server

- **Efficient Caching**: Minimized API calls and resource usage- `npm run build` - Build for production

- **Batch Processing**: Optimized concurrent operations- `npm run preview` - Preview production build

- **Progressive Loading**: Fast initial load, enhanced features load later- `npm run lint` - Run ESLint

- **Memory Management**: Efficient chat history and state management- `npm start` - Build and start production server

- `npm run docker:build` - Build Docker image  

## 🔧 Configuration- `npm run docker:up` - Start with docker-compose



### AI Service Endpoints### Project Structure

Configure through Setup Wizard or Settings:

```

- **LocalAI**: `http://localhost:8080/v1/chat/completions`src/

- **Ollama**: `http://localhost:11434/api/chat`├── components/          # React components

- **Custom API**: Any OpenAI-compatible endpoint│   ├── MessageBubble.tsx

│   ├── SettingsModal.tsx

### Chat Settings│   ├── SetupWizard.tsx

- **Model Selection**: Choose from available models│   └── NetworkScannerComponent.tsx

- **Temperature**: Control response creativity (0.0-2.0)├── contexts/           # React contexts

- **Max Tokens**: Limit response length (100-8192)│   ├── ChatContext.tsx

- **Streaming**: Enable real-time response display│   └── SettingsContext.tsx

- **System Prompts**: Customize AI behavior├── services/           # API services

│   ├── chatHistoryService.ts

### Storage Options│   └── mcpService.ts

- **Device Only**: Store chats locally on each device├── utils/              # Utility functions

- **Companion Server**: Sync chats across all your devices│   └── networkScanner.ts

├── types/              # TypeScript definitions

## 🌟 Advanced Features│   └── index.ts

└── App.tsx             # Main application

### Model Context Protocol (MCP)

- Integration with MCP servers for enhanced capabilitiesserver/

- Tool calling and function execution└── server.js           # Express companion server

- Extensible architecture for custom integrations```



### Network Discovery## 🐳 Docker Deployment

- Automatic detection of AI services on your network

- Support for multiple service types simultaneously  ### Using Docker Compose

- Smart port scanning with minimal network impact

```bash

### Chat History Management# Start services

- Individual chat controls (delete, sync, export)docker-compose up -d

- Cross-device synchronization

- Backup and restore capabilities# View logs

- Search and filter conversationsdocker-compose logs -f



## 🚨 Troubleshooting# Stop services  

docker-compose down

### Connection Issues```

1. **Check AI service is running**: Verify your AI service is accessible

2. **Use Network Scanner**: Auto-detect services in Setup Wizard### Manual Docker Commands

3. **Verify Network Access**: Ensure services allow remote connections

4. **Check Firewall**: Make sure ports are not blocked```bash

# Build image

### PWA Installation Problemsdocker build -t localai-chat .

1. **HTTPS Required**: Must use HTTPS or localhost

2. **Clear Cache**: Clear browser cache and try again# Run container

3. **Service Workers**: Ensure browser supports service workersdocker run -d --name localai-chat -p 5174:5174 localai-chat

4. **Mobile**: May need to use "Add to Home Screen" from browser menu```



### Cross-Device Chat Sync Issues## 🔍 Network Auto-Discovery

1. **Check Companion Server**: Ensure Docker container is healthy

2. **Network Connectivity**: All devices must be on same networkThe app includes a network scanner that automatically detects AI services:

3. **Storage Mode**: Verify "Companion Server" storage is selected

4. **Port Access**: Ensure port 5174 is accessible from other devices- **LM Studio**: Port 1234

- **Ollama**: Port 11434  

## 📖 Documentation- **LocalAI**: Port 8080



- 📋 **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment optionsAccess via Setup Wizard → "Scan Network" button.

- 🔌 **[MCP Integration](docs/MCP-INTEGRATION.md)** - Model Context Protocol setup

- 📁 **[Archive](docs/archive/)** - Development history and changelog## 📱 Mobile & Cross-Platform



## 🤝 Contributing- **iOS**: Proper safe area handling for iPhone notch/Dynamic Island

- **Android**: Native PWA installation support

We welcome contributions! Please feel free to submit issues, feature requests or pull requests.- **Windows**: Desktop PWA installation

- **macOS**: Full compatibility with all AI services

### Development Guidelines

1. Fork the repository## 🔧 Environment Variables

2. Create feature branch: `git checkout -b feature/amazing-feature`

3. Follow TypeScript best practicesSet these for production deployment:

4. Add tests for new functionality

5. Update documentation as needed```bash

6. Submit pull request with clear descriptionPORT=5174                    # Server port

HOST=0.0.0.0                # Server host (for network access)

## 📄 LicenseNODE_ENV=production         # Environment mode

DATA_DIR=./server/data      # Chat history storage

MIT License - see [LICENSE](LICENSE) file for details.STATIC_DIR=./dist          # PWA static files location

```

## 🙏 Acknowledgments

## 🚀 Production Deployment

- **[React](https://reactjs.org/)** - Powerful UI framework

- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling### Option 1: Standalone Server

- **[Vite](https://vitejs.dev/)** - Lightning-fast build tool

- **[LocalAI](https://localai.io/)** - OpenAI alternative```bash

- **[Ollama](https://ollama.ai/)** - Local AI model runnergit clone https://github.com/yourusername/localai-chat-react.git

cd localai-chat-react

## 🔗 Linksnpm install

npm run build

- 🐛 **[Issues](https://github.com/yourusername/localai-chat-react/issues)** - Report bugsnpm start

- 💬 **[Discussions](https://github.com/yourusername/localai-chat-react/discussions)** - Community chat```

- 📚 **[Wiki](https://github.com/yourusername/localai-chat-react/wiki)** - Documentation

### Option 2: Docker (Recommended)

---

```bash

**Made with ❤️ for the local AI community**git clone https://github.com/yourusername/localai-chat-react.git

cd localai-chat-react

*Keep your AI conversations private, fast and under your control.*docker-compose up -d
```

### Option 3: Static Hosting + Separate API

Deploy `dist/` folder to any static host (Vercel, Netlify) and run the companion server separately.

## 🔒 Security Considerations

- All chat data stays local to your network
- No external API calls or data transmission
- Companion server only accessible on your network
- Chat history stored locally or on your own server

## 🔍 Troubleshooting

### Connection Issues
1. Verify AI service is running and accessible
2. Use network scanner to auto-detect services
3. Check firewall settings
4. Ensure correct IP and port configuration

### PWA Installation Issues
- Must be served over HTTPS or localhost
- Browser must support service workers
- Clear cache if installation fails

### Mobile Connection Problems
- Both devices must be on same WiFi network
- AI service must allow remote connections
- Use device IP address, not localhost

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support & Links

- 🐛 [Issues](https://github.com/yourusername/localai-chat-react/issues)
- 💬 [Discussions](https://github.com/yourusername/localai-chat-react/discussions)  
- 📖 [Wiki](https://github.com/yourusername/localai-chat-react/wiki)

## 🙏 Acknowledgments

- [React 19](https://reactjs.org/) - UI framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first styling
- [Vite](https://vitejs.dev/) - Build tool and dev server
- [LM Studio](https://lmstudio.ai/) - Local LLM hosting
- [Ollama](https://ollama.ai/) - AI model runner
- [LocalAI](https://localai.io/) - OpenAI alternative
│   ├── MessageBubble.tsx
│   ├── WelcomeMessage.tsx
│   ├── SettingsModal.tsx
│   ├── ChatHistoryModal.tsx
│   ├── SetupWizard.tsx
│   └── LoadingSpinner.tsx
├── contexts/            # React contexts
│   ├── ChatContext.tsx
│   └── SettingsContext.tsx
├── types/              # TypeScript type definitions
│   └── index.ts
├── App.tsx             # Main app component
├── main.tsx           # App entry point
└── index.css          # Global styles
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [LM Studio](https://lmstudio.ai/) - For providing an excellent local LLM runtime
- [React](https://reactjs.org/) - For the amazing frontend framework
- [Tailwind CSS](https://tailwindcss.com/) - For the utility-first CSS framework
- [Vite](https://vitejs.dev/) - For the fast build tool

## 🔗 Related Projects

- [LocalAI Chat (Vanilla JS)](https://github.com/yourusername/localai-chat) - Original vanilla JavaScript version

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/localai-chat-react/issues) page
2. Create a new issue if your problem isn't already reported
3. Provide as much detail as possible about your setup and the issue

---

Made with ❤️ for the local AI community
