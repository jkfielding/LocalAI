import type { 
  ChatHistoryEntry, 
  SaveChatHistoryRequest,
  SaveChatHistoryResponse,
  LoadChatHistoryResponse,
  ChatHistoryListResponse
} from '../types';
import { STORAGE_KEYS } from '../types';

export class ChatHistoryService {
  private baseUrl: string;
  private storageMode: 'local' | 'server';
  private companionServerUrl: string;

  constructor(baseUrl: string, storageMode: 'local' | 'server' = 'local') {
    // Remove /v1/chat/completions from the end to get base URL
    this.baseUrl = baseUrl.replace(/\/v1\/chat\/completions$/, '');
    this.storageMode = storageMode;
    
    // Determine companion server URL
    this.companionServerUrl = this.getCompanionServerUrl(this.baseUrl);
  }

  private getCompanionServerUrl(baseUrl: string): string {
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
    } catch (error) {
      console.error('Error parsing base URL for companion server:', error);
      // Fallback to current host
      if (typeof window !== 'undefined') {
        return `${window.location.protocol}//${window.location.hostname}:5174`;
      }
      return 'http://localhost:5174';
    }
  }

  setStorageMode(mode: 'local' | 'server') {
    this.storageMode = mode;
  }

  setBaseUrl(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/v1\/chat\/completions$/, '');
    this.companionServerUrl = this.getCompanionServerUrl(this.baseUrl);
  }

  // Save chat history
  async saveChatHistory(entry: ChatHistoryEntry): Promise<boolean> {
    if (this.storageMode === 'local') {
      return this.saveToLocal(entry);
    } else {
      return this.saveToServer(entry);
    }
  }

  // Load chat history list
  async loadChatHistoryList(): Promise<ChatHistoryEntry[]> {
    if (this.storageMode === 'local') {
      return this.loadListFromLocal();
    } else {
      return this.loadListFromServer();
    }
  }

  // Load specific chat history
  // Load specific chat history - checks both storages for cross-device compatibility
  async loadChatHistory(id: string): Promise<ChatHistoryEntry | null> {
    // First try the current storage mode
    if (this.storageMode === 'local') {
      const localChat = this.loadFromLocal(id);
      if (localChat) return localChat;
      
      // If not found locally, try server as fallback
      try {
        return await this.loadFromServer(id);
      } catch (error) {
        console.log('Chat not found in server storage:', error);
        return null;
      }
    } else {
      // Try server first
      try {
        const serverChat = await this.loadFromServer(id);
        if (serverChat) return serverChat;
      } catch (error) {
        console.log('Chat not found in server storage:', error);
      }
      
      // If not found on server, try local as fallback
      return this.loadFromLocal(id);
    }
  }

  // Delete chat history from specific storage
  async deleteChatFromStorage(id: string, storage: 'local' | 'server'): Promise<boolean> {
    if (storage === 'local') {
      return this.deleteFromLocal(id);
    } else {
      return this.deleteFromServer(id);
    }
  }

  // Check if a chat exists in a specific storage
  async chatExistsInStorage(id: string, storage: 'local' | 'server'): Promise<boolean> {
    if (storage === 'local') {
      return this.loadFromLocal(id) !== null;
    } else {
      try {
        const chat = await this.loadFromServer(id);
        return chat !== null;
      } catch (error) {
        return false;
      }
    }
  }

  // Delete chat history
  async deleteChatHistory(id: string): Promise<boolean> {
    if (this.storageMode === 'local') {
      return this.deleteFromLocal(id);
    } else {
      return this.deleteFromServer(id);
    }
  }

  // Clear all chat history
  async clearAllChatHistory(): Promise<boolean> {
    if (this.storageMode === 'local') {
      return this.clearLocalHistory();
    } else {
      return this.clearServerHistory();
    }
  }

  // Local storage methods
  private saveToLocal(entry: ChatHistoryEntry): boolean {
    try {
      const existingHistory = this.loadListFromLocal();
      const existingIndex = existingHistory.findIndex(h => h.id === entry.id);
      
      if (existingIndex >= 0) {
        existingHistory[existingIndex] = entry;
      } else {
        existingHistory.push(entry);
      }
      
      localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(existingHistory));
      return true;
    } catch (error) {
      console.error('Error saving chat history to local storage:', error);
      return false;
    }
  }

  private loadListFromLocal(): ChatHistoryEntry[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading chat history from local storage:', error);
      return [];
    }
  }

  private loadFromLocal(id: string): ChatHistoryEntry | null {
    const history = this.loadListFromLocal();
    return history.find(h => h.id === id) || null;
  }

  private deleteFromLocal(id: string): boolean {
    try {
      const history = this.loadListFromLocal();
      const filtered = history.filter(h => h.id !== id);
      localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error deleting chat history from local storage:', error);
      return false;
    }
  }

  private clearLocalHistory(): boolean {
    try {
      localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
      return true;
    } catch (error) {
      console.error('Error clearing local chat history:', error);
      return false;
    }
  }

  // Server storage methods
  private async saveToServer(entry: ChatHistoryEntry): Promise<boolean> {
    try {
      const request: SaveChatHistoryRequest = {
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

      const result: SaveChatHistoryResponse = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error saving chat history to companion server:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.warn('Network error: Could not connect to companion server. Make sure it is running on port 5174.');
      }
      return false;
    }
  }

  private async loadListFromServer(): Promise<ChatHistoryEntry[]> {
    try {
      const response = await fetch(`${this.companionServerUrl}/api/chat-history`);

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('Companion server not available. Make sure LocalAI companion server is running.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ChatHistoryListResponse = await response.json();
      return result.success && result.data ? result.data : [];
    } catch (error) {
      console.error('Error loading chat history from companion server:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.warn('Network error: Could not connect to companion server. Make sure it is running on port 5174.');
      }
      return [];
    }
  }

  private async loadFromServer(id: string): Promise<ChatHistoryEntry | null> {
    try {
      const url = `${this.companionServerUrl}/api/chat-history/${id}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: LoadChatHistoryResponse = await response.json();
      return result.success && result.data ? result.data : null;
    } catch (error) {
      console.error('Error loading chat history from companion server:', error);
      return null;
    }
  }

  private async deleteFromServer(id: string): Promise<boolean> {
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
    } catch (error) {
      console.error('Error deleting chat history from companion server:', error);
      return false;
    }
  }

  private async clearServerHistory(): Promise<boolean> {
    try {
      const response = await fetch(`${this.companionServerUrl}/api/chat-history`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error clearing companion server chat history:', error);
      return false;
    }
  }

  // Enhanced methods for unified management
  
  // Get both local and server chat histories with accurate source detection
  async loadUnifiedChatHistory(): Promise<{ 
    local: ChatHistoryEntry[], 
    server: ChatHistoryEntry[],
    duplicates: { id: string, inBoth: boolean }[]
  }> {
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
  async getChatStorageLocations(chatId: string): Promise<{ local: boolean, server: boolean }> {
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
  async syncChatToStorage(chatId: string, fromStorage: 'local' | 'server', toStorage: 'local' | 'server'): Promise<boolean> {
    try {
      let chat: ChatHistoryEntry | null = null;
      
      // Load the chat from source storage
      if (fromStorage === 'local') {
        chat = this.loadFromLocal(chatId);
      } else {
        chat = await this.loadFromServer(chatId);
      }

      if (!chat) {
        console.error('Chat not found in source storage');
        return false;
      }

      // Save to destination storage
      if (toStorage === 'local') {
        return this.saveToLocal(chat);
      } else {
        return await this.saveToServer(chat);
      }
    } catch (error) {
      console.error('Error syncing chat between storages:', error);
      return false;
    }
  }

  // Backup all local chats to server
  async backupLocalToServer(): Promise<{ success: number, failed: number }> {
    const localChats = this.loadListFromLocal();
    let success = 0;
    let failed = 0;

    for (const chat of localChats) {
      try {
        const saved = await this.saveToServer(chat);
        if (saved) {
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Failed to backup chat ${chat.id}:`, error);
        failed++;
      }
    }

    return { success, failed };
  }

  // Pull all server chats to local
  async pullServerToLocal(): Promise<{ success: number, failed: number }> {
    try {
      const serverChats = await this.loadListFromServer();
      let success = 0;
      let failed = 0;

      for (const chat of serverChats) {
        try {
          const saved = this.saveToLocal(chat);
          if (saved) {
            success++;
          } else {
            failed++;
          }
        } catch (error) {
          console.error(`Failed to pull chat ${chat.id}:`, error);
          failed++;
        }
      }

      return { success, failed };
    } catch (error) {
      console.error('Error pulling server chats:', error);
      return { success: 0, failed: 0 };
    }
  }

  // Get storage stats
  async getStorageStats(): Promise<{
    local: { count: number, size: string },
    server: { count: number, available: boolean }
  }> {
    const localChats = this.loadListFromLocal();
    const localSize = this.estimateLocalStorageSize();
    
    let serverCount = 0;
    let serverAvailable = false;
    try {
      const serverChats = await this.loadListFromServer();
      serverCount = serverChats.length;
      serverAvailable = true;
    } catch (error) {
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

  private estimateLocalStorageSize(): string {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
      if (!data) return '0 KB';
      
      const bytes = new Blob([data]).size;
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } catch (error) {
      return 'Unknown';
    }
  }
  async checkServerSupport(): Promise<boolean> {
    if (this.storageMode !== 'server') return true;

    try {
      const response = await fetch(`${this.companionServerUrl}/api/health`);
      return response.ok;
    } catch (error) {
      console.warn('Companion server is not available:', error);
      return false;
    }
  }

  // Get a user-friendly status message
  async getServerStatusMessage(): Promise<string> {
    if (this.storageMode === 'local') {
      return 'Using local device storage';
    }

    const isSupported = await this.checkServerSupport();
    if (isSupported) {
      return 'Companion server available';
    } else {
      return 'Companion server not available. Make sure LocalAI companion server is running on port 5174.';
    }
  }
}