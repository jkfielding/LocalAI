import type { 
  ChatHistoryEntry, 
  SaveChatHistoryRequest,
  SaveChatHistoryResponse,
  LoadChatHistoryResponse,
  ChatHistoryListResponse,
  ChatHistoryListItem,
  SaveChatHistoryResult,
  DeleteChatHistoryResult,
  ClearChatHistoryResult
} from '../types';
import { localHistoryStore } from '../utils/localHistoryStore';

export class ChatHistoryService {
  private storageMode: 'local' | 'server';
  private companionServerUrl: string;

  constructor(storageMode: 'local' | 'server' = 'local') {
    this.storageMode = storageMode;
    
    // Determine companion server URL
    this.companionServerUrl = this.getCompanionServerUrl();
  }

  private getCompanionServerUrl(): string {
    try {
      // ALWAYS use the window's current hostname for the companion server
      // This ensures it works whether accessed via localhost, 127.0.0.1, or network IP
      if (typeof window !== 'undefined') {
        return `${window.location.protocol}//${window.location.hostname}:5174`;
      }
      
      // Fallback for SSR (shouldn't happen in browser)
      return 'http://localhost:5174';
    } catch (error) {
      console.error('Error determining companion server URL:', error);
      return 'http://localhost:5174';
    }
  }

  setStorageMode(mode: 'local' | 'server') {
    this.storageMode = mode;
  }

  updateCompanionServerUrl() {
    // Refresh companion server URL (useful if window.location changes)
    this.companionServerUrl = this.getCompanionServerUrl();
  }

  // Save chat history (always keeps a local copy, optionally syncs to server)
  async saveChatHistory(entry: ChatHistoryEntry): Promise<SaveChatHistoryResult> {
    const localSaved = await this.saveToLocal(entry);
    let serverSaved = false;

    if (this.storageMode === 'server') {
      serverSaved = await this.saveToServer(entry);
    }

    return { localSaved, serverSaved };
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
      const localChat = await this.loadFromLocal(id);
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
      return (await this.loadFromLocal(id)) !== null;
    } else {
      try {
        const chat = await this.loadFromServer(id);
        return chat !== null;
      } catch {
        return false;
      }
    }
  }

  // Delete chat history (keeps local/server copies in sync)
  async deleteChatHistory(id: string): Promise<DeleteChatHistoryResult> {
    const localDeleted = await this.deleteFromLocal(id);
    let serverDeleted = false;

    if (this.storageMode === 'server') {
      serverDeleted = await this.deleteFromServer(id);
    }

    return { localDeleted, serverDeleted };
  }

  // Clear all chat history
  async clearAllChatHistory(): Promise<ClearChatHistoryResult> {
    const localCleared = await this.clearLocalHistory();
    let serverCleared = false;

    if (this.storageMode === 'server') {
      serverCleared = await this.clearServerHistory();
    }

    return { localCleared, serverCleared };
  }

  // Local storage methods
  private async saveToLocal(entry: ChatHistoryEntry): Promise<boolean> {
    try {
      const result = await localHistoryStore.save(entry);
      return result;
    } catch (error) {
      console.error('Local storage save error:', error);
      return false;
    }
  }

  private async loadListFromLocal(): Promise<ChatHistoryEntry[]> {
    try {
      const result = await localHistoryStore.loadAll();
      return result;
    } catch (error) {
      console.error('Error loading from local storage:', error);
      throw error;
    }
  }

  private async loadFromLocal(id: string): Promise<ChatHistoryEntry | null> {
    return await localHistoryStore.load(id);
  }

  private async deleteFromLocal(id: string): Promise<boolean> {
    return await localHistoryStore.delete(id);
  }

  private async clearLocalHistory(): Promise<boolean> {
    return await localHistoryStore.clear();
  }

  // Server storage methods
  private async saveToServer(entry: ChatHistoryEntry): Promise<boolean> {
    try {
      const request: SaveChatHistoryRequest = {
        id: entry.id,
        summary: entry.summary,
        messages: entry.messages,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${this.companionServerUrl}/api/chat-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('Companion server not available. Make sure it is running on port 5174.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: SaveChatHistoryResponse = await response.json();
      return result.success;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.warn('Server request timed out');
          return false;
        }
      }
      console.error('Error saving to companion server:', error);
      return false;
    }
  }

  private async loadListFromServer(): Promise<ChatHistoryEntry[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${this.companionServerUrl}/api/chat-history`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('Companion server not available. Make sure LocalAI companion server is running.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ChatHistoryListResponse = await response.json();
      const entries = result.success && result.data ? result.data : [];
      return entries.map(entry => this.normalizeServerEntry(entry));
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Server request timeout');
      }
      throw error;
    }
  }

  private async loadFromServer(id: string): Promise<ChatHistoryEntry | null> {
    try {
      const url = `${this.companionServerUrl}/api/chat-history/${id}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: LoadChatHistoryResponse = await response.json();
      if (result.success && result.data) {
        return {
          ...result.data,
          messages: Array.isArray(result.data.messages) ? result.data.messages : []
        };
      }
      return null;
    } catch (error) {
      console.error('Error loading chat history from companion server:', error);
      return null;
    }
  }

  private async deleteFromServer(id: string): Promise<boolean> {
    try {
      const url = `${this.companionServerUrl}/api/chat-history/${id}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        method: 'DELETE',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.companionServerUrl}/api/chat-history`, {
        method: 'DELETE',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

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
    const localChatsPromise = this.loadListFromLocal().catch(() => []);
    const serverChatsPromise = this.loadListFromServer().catch(() => []);
    
    const [localChats, serverChats] = await Promise.all([
      localChatsPromise,
      serverChatsPromise
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
      this.loadFromLocal(chatId).then(chat => chat !== null).catch(() => false),
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
        chat = await this.loadFromLocal(chatId);
      } else {
        chat = await this.loadFromServer(chatId);
      }

      if (!chat) {
        console.error('Chat not found in source storage');
        return false;
      }

      // Save to destination storage
      if (toStorage === 'local') {
        return await this.saveToLocal(chat);
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
    const localChats = await this.loadListFromLocal();
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
          const saved = await this.saveToLocal(chat);
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
    const localChats = await this.loadListFromLocal();
    const localSize = await this.estimateLocalStorageSize();
    
    let serverCount = 0;
    let serverAvailable = false;
    try {
      const serverChats = await this.loadListFromServer();
      serverCount = serverChats.length;
      serverAvailable = true;
    } catch {
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

  private normalizeServerEntry(entry: ChatHistoryListItem): ChatHistoryEntry {
    return {
      id: entry.id,
      summary: entry.summary,
      timestamp: entry.timestamp,
      messageCount: entry.messageCount,
      messages: Array.isArray(entry.messages) ? entry.messages : []
    };
  }

  private async estimateLocalStorageSize(): Promise<string> {
    return await localHistoryStore.estimateSize();
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
