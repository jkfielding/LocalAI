"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatHistoryService = void 0;
const types_1 = require("../types");
class ChatHistoryService {
    constructor(baseUrl, storageMode = 'local') {
        // Remove /v1/chat/completions from the end to get base URL
        this.baseUrl = baseUrl.replace(/\/v1\/chat\/completions$/, '');
        this.storageMode = storageMode;
        // Determine companion server URL
        this.companionServerUrl = this.getCompanionServerUrl(this.baseUrl);
    }
    getCompanionServerUrl(baseUrl) {
        try {
            const urlObj = new URL(baseUrl);
            // If we're accessing from the same origin as the web app, use relative path
            if (typeof window !== 'undefined' && window.location.hostname === urlObj.hostname) {
                return `${window.location.protocol}//${window.location.hostname}:5174`;
            }
            // Otherwise, use the same host as the AI service but on port 5174
            // Handle special case where localhost should use actual network IP when accessed remotely
            if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
                // Try to determine if we're accessing this remotely
                if (typeof window !== 'undefined' &&
                    window.location.hostname !== 'localhost' &&
                    window.location.hostname !== '127.0.0.1') {
                    // We're on a remote device, use the same IP as the current page
                    return `${window.location.protocol}//${window.location.hostname}:5174`;
                }
            }
            return `${urlObj.protocol}//${urlObj.hostname}:5174`;
        }
        catch (error) {
            console.error('Error parsing base URL for companion server:', error);
            // Fallback to current host
            if (typeof window !== 'undefined') {
                return `${window.location.protocol}//${window.location.hostname}:5174`;
            }
            return 'http://localhost:5174';
        }
    }
    setStorageMode(mode) {
        this.storageMode = mode;
    }
    setBaseUrl(baseUrl) {
        this.baseUrl = baseUrl.replace(/\/v1\/chat\/completions$/, '');
        this.companionServerUrl = this.getCompanionServerUrl(this.baseUrl);
    }
    // Save chat history (always keeps a local copy, optionally syncs to server)
    async saveChatHistory(entry) {
        const localSaved = this.saveToLocal(entry);
        let serverSaved = false;
        if (this.storageMode === 'server') {
            serverSaved = await this.saveToServer(entry);
        }
        return { localSaved, serverSaved };
    }
    // Load chat history list
    async loadChatHistoryList() {
        if (this.storageMode === 'local') {
            return this.loadListFromLocal();
        }
        else {
            return this.loadListFromServer();
        }
    }
    // Load specific chat history
    // Load specific chat history - checks both storages for cross-device compatibility
    async loadChatHistory(id) {
        // First try the current storage mode
        if (this.storageMode === 'local') {
            const localChat = this.loadFromLocal(id);
            if (localChat)
                return localChat;
            // If not found locally, try server as fallback
            try {
                return await this.loadFromServer(id);
            }
            catch (error) {
                console.log('Chat not found in server storage:', error);
                return null;
            }
        }
        else {
            // Try server first
            try {
                const serverChat = await this.loadFromServer(id);
                if (serverChat)
                    return serverChat;
            }
            catch (error) {
                console.log('Chat not found in server storage:', error);
            }
            // If not found on server, try local as fallback
            return this.loadFromLocal(id);
        }
    }
    // Delete chat history from specific storage
    async deleteChatFromStorage(id, storage) {
        if (storage === 'local') {
            return this.deleteFromLocal(id);
        }
        else {
            return this.deleteFromServer(id);
        }
    }
    // Check if a chat exists in a specific storage
    async chatExistsInStorage(id, storage) {
        if (storage === 'local') {
            return this.loadFromLocal(id) !== null;
        }
        else {
            try {
                const chat = await this.loadFromServer(id);
                return chat !== null;
            }
            catch {
                return false;
            }
        }
    }
    // Delete chat history (keeps local/server copies in sync)
    async deleteChatHistory(id) {
        const localDeleted = this.deleteFromLocal(id);
        let serverDeleted = false;
        if (this.storageMode === 'server') {
            serverDeleted = await this.deleteFromServer(id);
        }
        return { localDeleted, serverDeleted };
    }
    // Clear all chat history
    async clearAllChatHistory() {
        const localCleared = this.clearLocalHistory();
        let serverCleared = false;
        if (this.storageMode === 'server') {
            serverCleared = await this.clearServerHistory();
        }
        return { localCleared, serverCleared };
    }
    // Local storage methods
    saveToLocal(entry) {
        try {
            const existingHistory = this.loadListFromLocal();
            const existingIndex = existingHistory.findIndex(h => h.id === entry.id);
            if (existingIndex >= 0) {
                existingHistory[existingIndex] = entry;
            }
            else {
                existingHistory.push(entry);
            }
            localStorage.setItem(types_1.STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(existingHistory));
            return true;
        }
        catch (error) {
            console.error('Error saving chat history to local storage:', error);
            return false;
        }
    }
    loadListFromLocal() {
        try {
            const saved = localStorage.getItem(types_1.STORAGE_KEYS.CHAT_HISTORY);
            return saved ? JSON.parse(saved) : [];
        }
        catch (error) {
            console.error('Error loading chat history from local storage:', error);
            return [];
        }
    }
    loadFromLocal(id) {
        const history = this.loadListFromLocal();
        return history.find(h => h.id === id) || null;
    }
    deleteFromLocal(id) {
        try {
            const history = this.loadListFromLocal();
            const filtered = history.filter(h => h.id !== id);
            localStorage.setItem(types_1.STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(filtered));
            return true;
        }
        catch (error) {
            console.error('Error deleting chat history from local storage:', error);
            return false;
        }
    }
    clearLocalHistory() {
        try {
            localStorage.removeItem(types_1.STORAGE_KEYS.CHAT_HISTORY);
            return true;
        }
        catch (error) {
            console.error('Error clearing local chat history:', error);
            return false;
        }
    }
    // Server storage methods
    async saveToServer(entry) {
        try {
            const request = {
                id: entry.id,
                summary: entry.summary,
                messages: entry.messages,
            };
            // Use companion server endpoint
            const response = await fetch(`${this.companionServerUrl}/api/chat-history`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn('Companion server not available. Make sure LocalAI companion server is running.');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            return result.success;
        }
        catch (error) {
            console.error('Error saving chat history to companion server:', error);
            if (error instanceof TypeError && error.message.includes('fetch')) {
                console.warn('Network error: Could not connect to companion server. Make sure it is running on port 5174.');
            }
            return false;
        }
    }
    async loadListFromServer() {
        try {
            const response = await fetch(`${this.companionServerUrl}/api/chat-history`);
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn('Companion server not available. Make sure LocalAI companion server is running.');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            const entries = result.success && result.data ? result.data : [];
            return entries.map(entry => this.normalizeServerEntry(entry));
        }
        catch (error) {
            console.error('Error loading chat history from companion server:', error);
            if (error instanceof TypeError && error.message.includes('fetch')) {
                console.warn('Network error: Could not connect to companion server. Make sure it is running on port 5174.');
            }
            return [];
        }
    }
    async loadFromServer(id) {
        try {
            const url = `${this.companionServerUrl}/api/chat-history/${id}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            if (result.success && result.data) {
                return {
                    ...result.data,
                    messages: Array.isArray(result.data.messages) ? result.data.messages : []
                };
            }
            return null;
        }
        catch (error) {
            console.error('Error loading chat history from companion server:', error);
            return null;
        }
    }
    async deleteFromServer(id) {
        try {
            const url = `${this.companionServerUrl}/api/chat-history/${id}`;
            const response = await fetch(url, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            return result.success;
        }
        catch (error) {
            console.error('Error deleting chat history from companion server:', error);
            return false;
        }
    }
    async clearServerHistory() {
        try {
            const response = await fetch(`${this.companionServerUrl}/api/chat-history`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            return result.success;
        }
        catch (error) {
            console.error('Error clearing companion server chat history:', error);
            return false;
        }
    }
    // Enhanced methods for unified management
    // Get both local and server chat histories with accurate source detection
    async loadUnifiedChatHistory() {
        const [localChats, serverChats] = await Promise.all([
            this.loadListFromLocal(),
            this.loadListFromServer().catch(() => []) // Don't fail if server is unavailable
        ]);
        // Detect duplicates (chats that exist in both storages)
        const localIds = new Set(localChats.map(chat => chat.id));
        const serverIds = new Set(serverChats.map(chat => chat.id));
        const duplicates = [...localIds].filter(id => serverIds.has(id)).map(id => ({ id, inBoth: true }));
        return {
            local: localChats,
            server: serverChats,
            duplicates
        };
    }
    // Get the actual storage locations of a chat (where it currently exists)
    async getChatStorageLocations(chatId) {
        const [localExists, serverExists] = await Promise.all([
            Promise.resolve(this.loadFromLocal(chatId) !== null),
            this.loadFromServer(chatId).then(chat => chat !== null).catch(() => false)
        ]);
        return {
            local: localExists,
            server: serverExists
        };
    }
    // Sync a chat from one storage to another
    async syncChatToStorage(chatId, fromStorage, toStorage) {
        try {
            let chat = null;
            // Load the chat from source storage
            if (fromStorage === 'local') {
                chat = this.loadFromLocal(chatId);
            }
            else {
                chat = await this.loadFromServer(chatId);
            }
            if (!chat) {
                console.error('Chat not found in source storage');
                return false;
            }
            // Save to destination storage
            if (toStorage === 'local') {
                return this.saveToLocal(chat);
            }
            else {
                return await this.saveToServer(chat);
            }
        }
        catch (error) {
            console.error('Error syncing chat between storages:', error);
            return false;
        }
    }
    // Backup all local chats to server
    async backupLocalToServer() {
        const localChats = this.loadListFromLocal();
        let success = 0;
        let failed = 0;
        for (const chat of localChats) {
            try {
                const saved = await this.saveToServer(chat);
                if (saved) {
                    success++;
                }
                else {
                    failed++;
                }
            }
            catch (error) {
                console.error(`Failed to backup chat ${chat.id}:`, error);
                failed++;
            }
        }
        return { success, failed };
    }
    // Pull all server chats to local
    async pullServerToLocal() {
        try {
            const serverChats = await this.loadListFromServer();
            let success = 0;
            let failed = 0;
            for (const chat of serverChats) {
                try {
                    const saved = this.saveToLocal(chat);
                    if (saved) {
                        success++;
                    }
                    else {
                        failed++;
                    }
                }
                catch (error) {
                    console.error(`Failed to pull chat ${chat.id}:`, error);
                    failed++;
                }
            }
            return { success, failed };
        }
        catch (error) {
            console.error('Error pulling server chats:', error);
            return { success: 0, failed: 0 };
        }
    }
    // Get storage stats
    async getStorageStats() {
        const localChats = this.loadListFromLocal();
        const localSize = this.estimateLocalStorageSize();
        let serverCount = 0;
        let serverAvailable = false;
        try {
            const serverChats = await this.loadListFromServer();
            serverCount = serverChats.length;
            serverAvailable = true;
        }
        catch {
            // Server not available
        }
        return {
            local: {
                count: localChats.length,
                size: localSize
            },
            server: {
                count: serverCount,
                available: serverAvailable
            }
        };
    }
    normalizeServerEntry(entry) {
        return {
            id: entry.id,
            summary: entry.summary,
            timestamp: entry.timestamp,
            messageCount: entry.messageCount,
            messages: Array.isArray(entry.messages) ? entry.messages : []
        };
    }
    estimateLocalStorageSize() {
        try {
            const data = localStorage.getItem(types_1.STORAGE_KEYS.CHAT_HISTORY);
            if (!data)
                return '0 KB';
            const bytes = new Blob([data]).size;
            if (bytes < 1024)
                return `${bytes} B`;
            if (bytes < 1024 * 1024)
                return `${(bytes / 1024).toFixed(1)} KB`;
            return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        }
        catch {
            return 'Unknown';
        }
    }
    async checkServerSupport() {
        if (this.storageMode !== 'server')
            return true;
        try {
            const response = await fetch(`${this.companionServerUrl}/api/health`);
            return response.ok;
        }
        catch (error) {
            console.warn('Companion server is not available:', error);
            return false;
        }
    }
    // Get a user-friendly status message
    async getServerStatusMessage() {
        if (this.storageMode === 'local') {
            return 'Using local device storage';
        }
        const isSupported = await this.checkServerSupport();
        if (isSupported) {
            return 'Companion server available';
        }
        else {
            return 'Companion server not available. Make sure LocalAI companion server is running on port 5174.';
        }
    }
}
exports.ChatHistoryService = ChatHistoryService;
