# LocalAI Chat

A modern Progressive Web App for chatting with self-hosted AI services such as LM Studio, LocalAI, Ollama, Text Generation Web UI, and any OpenAI-compatible endpoint.

![LocalAI Chat PWA](https://img.shields.io/badge/AI-Local%20Chat-blue)
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![PWA](https://img.shields.io/badge/PWA-Ready-green)
![Docker](https://img.shields.io/badge/Docker-Supported-2496ed)

---

## Features

- **Private-by-default** – chats never leave your device or network.
- **Full PWA experience** – install on iOS/Android/Desktop with offline caching.
- **Cross-device history** – choose between local storage or the bundled companion server.
- **Streaming responses** – real-time assistant output with pause/cancel controls.
- **Guided onboarding** – setup wizard plus intelligent network scanner.
- **Voice-first UX** – optional speech input and TTS playback.
- **Dark mode & responsive UI** – optimized for phones, tablets, and desktops.

---

## Quick Start

### Option 1 – macOS / Linux / Raspberry Pi

```bash
git clone https://github.com/jkfielding/LocalAI.git
cd LocalAI
chmod +x start.sh
./start.sh
```

The script installs dependencies, builds the React PWA, and launches the companion server on **http://0.0.0.0:5174** so any device on your LAN can connect (e.g., `http://192.168.1.50:5174`). Works on macOS, Ubuntu, Debian, Raspberry Pi OS, and other Unix-like systems with Node 16+.

### Option 2 – Windows

```powershell
git clone https://github.com/jkfielding/LocalAI.git
cd LocalAI
start.bat
```

The batch script mirrors the Unix setup flow, binds the server to `0.0.0.0:5174`, and keeps the process running until you close the window.

### Option 3 – Docker / Docker Compose

```bash
git clone https://github.com/jkfielding/LocalAI.git
cd LocalAI
docker-compose up -d
```

Visit **http://localhost:5174** (or replace `localhost` with your computer’s LAN IP) to start chatting and install the app as a PWA.

> Prefer manual control? Run `npm install && npm run build` in the repo root, then `npm run start:server` to serve the built bundle from the companion server.

---

## Supported AI Backends

The UI talks to any OpenAI-compatible `/v1/chat/completions` endpoint. Popular options:

### LM Studio (macOS / Windows / Linux)

1. Download from [lmstudio.ai](https://lmstudio.ai) and install.
2. Load a chat model (e.g., Llama 3, Phi 3, Qwen, Mistral).
3. Open the **Local Server** tab and start the server (default `http://localhost:1234`).
4. In LocalAI Chat, set the API endpoint to `http://localhost:1234/v1/chat/completions`.

### LocalAI (Docker)

```bash
docker run -p 8080:8080 --name localai quay.io/go-skynet/local-ai:latest
```

Use `http://localhost:8080/v1/chat/completions` as the endpoint.

### Ollama

```bash
ollama serve
ollama pull llama3
```

Use `http://localhost:11434/v1/chat/completions`.

> Any other OpenAI-style gateway (FastChat, vLLM, Text Generation WebUI, custom adapters, etc.) will work as long as it exposes `/v1/chat/completions`.

---

## Development Workflow

```bash
git clone https://github.com/jkfielding/LocalAI.git
cd LocalAI
npm install
npm run dev
```

- Dev server: http://localhost:5173 (frontend only).
- Companion server during dev: run `npm run start:server` to serve `dist/` and provide the history API.
- Production build: `npm run build`.
- Full start (build + server): `npm start`.

### Available NPM Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Vite dev server with React Fast Refresh |
| `npm run build` | Type-check + production build + PWA service worker |
| `npm run preview` | Preview the production bundle locally |
| `npm run lint` | ESLint (TypeScript, React Hooks) |
| `npm run start` | Build frontend then start the companion server |
| `npm run start:server` | Start only the companion server (expects an existing `dist/`) |
| `npm run docker:build` / `docker:run` / `docker:up` | Container workflows |

---

## Project Structure

```
LocalAI/
├── src/
│   ├── components/          # UI components (ChatHistoryModal, SettingsModal, etc.)
│   ├── contexts/            # Chat & settings providers
│   ├── hooks/               # Speech recognition, TTS, settings helpers
│   ├── services/            # Chat history service, MCP client
│   ├── utils/               # Network scanner, helpers
│   └── types/               # Shared TypeScript interfaces
├── server/
│   ├── server.js            # Express companion API + static hosting
│   └── data/                # Chat history when using server storage
├── public/                  # Static assets + manifest template
├── dist/                    # Production build output (created via `npm run build`)
└── docker-compose.yml       # PWA + companion server in a single container
```

---

## Docker Deployment

### docker-compose (recommended)

```bash
docker-compose up -d              # start
docker-compose logs -f            # tail logs
docker-compose down               # stop
```

### Manual image

```bash
docker build -t localai-chat .
docker run -d --name localai-chat \
  -p 5174:5174 \
  -v localai-data:/app/server/data \
  localai-chat
```

Bind-mount a local folder instead of `localai-data` if you want to back up chat exports yourself.

---

## PWA & Multi-Device Access

1. Ensure the companion server is bound to `0.0.0.0` (default via start scripts).
2. On another device connected to the same Wi‑Fi, open `http://<your-host-ip>:5174`.
3. When prompted, install the app (Add to Home Screen / Install App).
4. Once installed, the PWA caches assets via Workbox and works offline.

Tips:

- If you change network interfaces, rerun the scanner from the Setup Wizard.
- SSL is required for service workers on the public internet, but local network + localhost work without HTTPS.

---

## Storage Modes & History Sync

Accessible via **Settings → Chat History Storage** or the **History Manager** modal.

| Mode | Description |
| --- | --- |
| Device (default) | Saves chats in an on-device IndexedDB database (with localStorage fallback). Fast, offline-first, private per device. |
| Companion Server | Keeps the local copy **and** automatically syncs to the Node/Express server (`server/data/*.json`) for cross-device access. |

Extra tools inside the History modal:

- View local/server/unified lists.
- Sync individual chats between storage backends.
- “Backup All” (device ➜ server) and "Pull All" (server ➜ device).
- Delete chats per location or clear everything.

---

## Environment Variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `5174` | Companion server port |
| `HOST` | `0.0.0.0` | Host interface; keep `0.0.0.0` for LAN access |
| `DATA_DIR` | `./server/data` | Folder that stores server-side chat JSON files |
| `STATIC_DIR` | `./dist` | Directory served as the PWA bundle |
| `NODE_ENV` | `production` | Controls logging/Express behavior |

Set these before running `start.sh`, `start.bat`, or `npm run start` to customize deployments.

---

## Troubleshooting

| Issue | Fix |
| --- | --- |
| **Cannot reach AI backend** | Confirm the backend is running and reachable from the device running LocalAI Chat; use the network scanner in the setup wizard. |
| **Companion server unreachable from phone** | Ensure the host firewall allows inbound TCP on 5174 and that you’re using the machine’s LAN IP. |
| **Build fails with PWA SW error** | Remove stale `dist/` and rerun `npm run build`; by default the build runs Workbox in `development` SW mode to avoid terser crashes. Set `PWA_SW_MODE=production` if you need minified SW output. |
| **Chats missing after switching storage** | Use the History modal’s sync tools to copy chats between local and server storage. |
| **Browser won’t show Install prompt** | Service workers require HTTPS or `localhost`. On Android/iOS ensure you open the menu (“Add to Home Screen”). |

---

## Privacy & Security

- Zero cloud services – everything runs on your hardware.
- No analytics or tracking scripts.
- You decide where history lives (browser vs. server volume).
- Docker volume (`localai-data`) keeps server-side history across container restarts.

---

## Contributing

1. Fork the repo and create a branch: `git checkout -b feature/my-feature`.
2. Run `npm run lint` and `npm run build` before opening a PR.
3. Include screenshots or recordings if your change affects the UI.

Bug reports and feature requests are welcome in the GitHub issue tracker.

---

## License

MIT © LocalAI Chat contributors. See [LICENSE](LICENSE) for details.
