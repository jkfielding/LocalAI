"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_ENDPOINTS = exports.DEFAULT_SETTINGS = exports.CHAT_HISTORY_ENDPOINTS = exports.STORAGE_KEYS = void 0;
// Local storage keys
exports.STORAGE_KEYS = {
    SETTINGS: 'localai-settings',
    MESSAGES: 'localai-messages',
    CHAT_HISTORY: 'localai-chat-history',
    SETUP_COMPLETE: 'localai-setup-complete',
    CURRENT_CHAT_ID: 'localai-current-chat-id',
};
// Server API endpoints for chat history
exports.CHAT_HISTORY_ENDPOINTS = {
    LIST: '/api/chat-history',
    SAVE: '/api/chat-history',
    LOAD: '/api/chat-history/{id}',
    DELETE: '/api/chat-history/{id}',
};
// Default settings
exports.DEFAULT_SETTINGS = {
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
exports.API_ENDPOINTS = {
    CHAT_COMPLETIONS: '/v1/chat/completions',
    MODELS: '/v1/models',
};
