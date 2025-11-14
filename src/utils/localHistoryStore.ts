import type { ChatHistoryEntry } from '../types';
import { STORAGE_KEYS } from '../types';

const DB_NAME = 'localai-chat-history';
const STORE_NAME = 'chats';
const DB_VERSION = 1;

const hasWindow = typeof window !== 'undefined';
const hasIndexedDB = hasWindow && typeof window.indexedDB !== 'undefined';

let dbPromise: Promise<IDBDatabase> | null = null;

const memoryStore = new Map<string, ChatHistoryEntry>();

const getDB = (): Promise<IDBDatabase> => {
  if (!hasIndexedDB) {
    return Promise.reject(new Error('IndexedDB not supported'));
  }

  if (!dbPromise) {
    const openRequest = new Promise<IDBDatabase>((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(request.error ?? new Error('Failed to open IndexedDB'));
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });

    dbPromise = openRequest.then(async (db) => {
      await migrateLegacyLocalStorage(db);
      return db;
    });
  }

  return dbPromise;
};

const requestToPromise = <T>(request: IDBRequest<T>): Promise<T> => {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
};

const txToPromise = (tx: IDBTransaction): Promise<void> => {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction error'));
  });
};

const migrateLegacyLocalStorage = async (db: IDBDatabase): Promise<void> => {
  if (!hasWindow) return;

  try {
    const legacy = window.localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
    if (!legacy) return;

    const parsed: ChatHistoryEntry[] = JSON.parse(legacy);
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    parsed.forEach(entry => {
      store.put(entry);
    });
    await txToPromise(tx);
    window.localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
  } catch (error) {
    console.warn('Legacy chat history migration failed:', error);
  }
};

const memorySave = (entry: ChatHistoryEntry): boolean => {
  memoryStore.set(entry.id, entry);
  return true;
};

const memoryLoadAll = (): ChatHistoryEntry[] => {
  return [...memoryStore.values()];
};

const memoryDelete = (id: string): boolean => {
  return memoryStore.delete(id);
};

const memoryClear = (): boolean => {
  memoryStore.clear();
  return true;
};

const legacySave = (entry: ChatHistoryEntry): boolean => {
  if (!hasWindow) {
    return memorySave(entry);
  }
  try {
    const existing = legacyLoadAll();
    const index = existing.findIndex(chat => chat.id === entry.id);
    if (index >= 0) {
      existing[index] = entry;
    } else {
      existing.push(entry);
    }
    window.localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(existing));
    return true;
  } catch (error) {
    console.error('Legacy localStorage save failed:', error);
    return false;
  }
};

const legacyLoadAll = (): ChatHistoryEntry[] => {
  if (!hasWindow) {
    return memoryLoadAll();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Legacy localStorage load failed:', error);
    return [];
  }
};

const legacyLoad = (id: string): ChatHistoryEntry | null => {
  const all = legacyLoadAll();
  return all.find(chat => chat.id === id) ?? null;
};

const legacyDelete = (id: string): boolean => {
  if (!hasWindow) {
    return memoryDelete(id);
  }
  try {
    const existing = legacyLoadAll();
    const filtered = existing.filter(chat => chat.id !== id);
    window.localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Legacy localStorage delete failed:', error);
    return false;
  }
};

const legacyClear = (): boolean => {
  if (!hasWindow) {
    return memoryClear();
  }
  try {
    window.localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
    return true;
  } catch (error) {
    console.error('Legacy localStorage clear failed:', error);
    return false;
  }
};

export const localHistoryStore = {
  async save(entry: ChatHistoryEntry): Promise<boolean> {
    if (!hasIndexedDB) {
      return legacySave(entry);
    }
    try {
      const db = await getDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(entry);
      await txToPromise(tx);
      return true;
    } catch (error) {
      console.error('IndexedDB save failed, falling back to localStorage:', error);
      return legacySave(entry);
    }
  },

  async loadAll(): Promise<ChatHistoryEntry[]> {
    if (!hasIndexedDB) {
      return legacyLoadAll();
    }
    try {
      const db = await getDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const result = await requestToPromise(tx.objectStore(STORE_NAME).getAll());
      return (result ?? []).sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
    } catch (error) {
      console.error('IndexedDB load failed, falling back to localStorage:', error);
      return legacyLoadAll();
    }
  },

  async load(id: string): Promise<ChatHistoryEntry | null> {
    if (!hasIndexedDB) {
      return legacyLoad(id);
    }
    try {
      const db = await getDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const result = await requestToPromise(tx.objectStore(STORE_NAME).get(id));
      return (result as ChatHistoryEntry) ?? null;
    } catch (error) {
      console.error('IndexedDB load entry failed:', error);
      return legacyLoad(id);
    }
  },

  async delete(id: string): Promise<boolean> {
    if (!hasIndexedDB) {
      return legacyDelete(id);
    }
    try {
      const db = await getDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      await txToPromise(tx);
      return true;
    } catch (error) {
      console.error('IndexedDB delete failed:', error);
      return legacyDelete(id);
    }
  },

  async clear(): Promise<boolean> {
    if (!hasIndexedDB) {
      return legacyClear();
    }
    try {
      const db = await getDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      await txToPromise(tx);
      return true;
    } catch (error) {
      console.error('IndexedDB clear failed:', error);
      return legacyClear();
    }
  },

  async estimateSize(): Promise<string> {
    const entries = await this.loadAll();
    try {
      const serialized = JSON.stringify(entries);
      let bytes = 0;
      if (hasWindow && typeof Blob !== 'undefined') {
        bytes = new Blob([serialized]).size;
      } else {
        bytes = serialized.length;
      }
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } catch {
      return 'Unknown';
    }
  }
};
