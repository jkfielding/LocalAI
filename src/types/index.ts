// Core message interface
export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system' | 'error';
  timestamp: number;
  isStreaming?: boolean;
  isHistorical?: boolean;
}

// Application settings interface
export interface AppSettings {
  apiEndpoint: string;
  modelName: string;
  maxTokens: number;
  temperature: number;
  streamingEnabled: boolean;
  darkModeEnabled: boolean;
  contextLength: number;
  chatHistoryStorage: 'local' | 'server';
  systemPrompt: string;
  mcpEnabled: boolean;
  mcpServers: MCPServer[];
  voiceInputEnabled: boolean;
  ttsEnabled: boolean;
  ttsAutoPlay: boolean;
  ttsRate: number;
  ttsPitch: number;
  ttsVolume: number;
}

// Chat history entry
export interface ChatHistoryEntry {
  id: string;
  summary: string;
  timestamp: number;
  messageCount: number;
  messages: Message[];
}

export interface SaveChatHistoryResult {
  localSaved: boolean;
  serverSaved: boolean;
}

export interface DeleteChatHistoryResult {
  localDeleted: boolean;
  serverDeleted: boolean;
}

export interface ClearChatHistoryResult {
  localCleared: boolean;
  serverCleared: boolean;
}

// Server responses only include chat metadata, not the full transcript
export interface ChatHistoryListItem {
  id: string;
  summary: string;
  timestamp: number;
  messageCount: number;
  messages?: Message[];
  lastModified?: string;
}

export interface StorageStats {
  local: {
    count: number;
    size: string;
  };
  server: {
    count: number;
    available: boolean;
  };
}

// Connection status types
export type ConnectionStatus = 'connected' | 'connecting' | 'error' | 'disconnected';

// API response interfaces
export interface ModelsResponse {
  object: string;
  data: Array<{
    id: string;
    object: string;
    created?: number;
    owned_by?: string;
  }>;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface StreamingChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason?: string;
  }>;
}

// Request interfaces
export interface ChatCompletionRequest {
  model: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

// MCP (Model Context Protocol) interfaces
export interface MCPServer {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  description?: string;
  type: 'http' | 'websocket' | 'stdio';
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPServerCapabilities {
  tools?: MCPTool[];
  resources?: MCPResource[];
  prompts?: Record<string, unknown>[];
}

// Server-side chat history API interfaces
export interface SaveChatHistoryRequest {
  id?: string;
  summary: string;
  messages: Message[];
}

export interface SaveChatHistoryResponse {
  id: string;
  success: boolean;
  message: string;
}

export interface LoadChatHistoryResponse {
  success: boolean;
  data?: ChatHistoryEntry;
  message: string;
}

export interface ChatHistoryListResponse {
  success: boolean;
  data?: ChatHistoryListItem[];
  message: string;
}

// Component props interfaces
export interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export interface SetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowSetupWizard?: () => void;
}

export interface ChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Context interfaces
export interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  connectionStatus: ConnectionStatus;
  testConnection: () => Promise<boolean>;
  isSetupComplete: boolean;
  markSetupComplete: () => void;
  resetSetup: () => void;
  availableModels: string[];
  fetchAvailableModels: () => Promise<void>;
  isLoadingModels: boolean;
  // MCP methods
  mcpServers: MCPServer[];
  addMCPServer: (server: MCPServer) => void;
  removeMCPServer: (serverId: string) => void;
  updateMCPServer: (serverId: string, updates: Partial<MCPServer>) => void;
  getAvailableMCPTools: () => MCPTool[];
  refreshMCPConnections: () => Promise<void>;
}

export interface ChatContextType {
  messages: Message[];
  chatHistory: ChatHistoryEntry[];
  currentChatId: string | null;
  isLoading: boolean;
  lastAssistantMessageId: string | null;
  lastAssistantMessageTimestamp: number;
  addMessage: (content: string, role: Message['role']) => void;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  newChat: () => void;
  loadChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  clearHistory: () => void;
  abortCurrentRequest: () => void;
}

// Setup wizard step interface
export interface SetupStep {
  id: number;
  title: string;
  icon: string;
  description: string;
  content: React.ReactNode;
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Error types
export interface AppError {
  message: string;
  type: 'connection' | 'api' | 'validation' | 'unknown';
  timestamp: number;
}

// Local storage keys
export const STORAGE_KEYS = {
  SETTINGS: 'localai-settings',
  MESSAGES: 'localai-messages',
  CHAT_HISTORY: 'localai-chat-history',
  SETUP_COMPLETE: 'localai-setup-complete',
  CURRENT_CHAT_ID: 'localai-current-chat-id',
} as const;

// Server API endpoints for chat history
export const CHAT_HISTORY_ENDPOINTS = {
  LIST: '/api/chat-history',
  SAVE: '/api/chat-history',
  LOAD: '/api/chat-history/{id}',
  DELETE: '/api/chat-history/{id}',
} as const;

// Default settings
export const DEFAULT_SETTINGS: AppSettings = {
  apiEndpoint: 'http://localhost:1234/v1/chat/completions',
  modelName: 'llama-2-7b-chat',
  maxTokens: 2048,
  temperature: 0.7,
  streamingEnabled: true,
  darkModeEnabled: false,
  contextLength: 4096,
  chatHistoryStorage: 'local',
  systemPrompt: 'You are a helpful AI assistant. Provide clear, accurate and helpful responses.',
  mcpEnabled: false,
  mcpServers: [],
  voiceInputEnabled: true,
  ttsEnabled: true,
  ttsAutoPlay: false,
  ttsRate: 1.0,
  ttsPitch: 1.0,
  ttsVolume: 1.0,
};

// API endpoints
export const API_ENDPOINTS = {
  CHAT_COMPLETIONS: '/v1/chat/completions',
  MODELS: '/v1/models',
} as const;
