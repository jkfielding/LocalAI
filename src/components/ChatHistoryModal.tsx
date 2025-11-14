import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FiX, FiMessageSquare, FiPlus, FiServer, FiSmartphone, FiUpload, FiRefreshCw, FiSettings, FiMoreVertical, FiEye } from 'react-icons/fi';
import type { ChatHistoryModalProps, ChatHistoryEntry, StorageStats } from '../types';
import { useChat } from '../hooks/useChat';
import { useSettings } from '../hooks/useSettings';
import { ChatHistoryService } from '../services/chatHistoryService';
import toast from 'react-hot-toast';

const VIEW_OPTIONS: Array<'unified' | 'local' | 'server'> = ['unified', 'local', 'server'];

const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({ isOpen, onClose }) => {
  const { loadChat, newChat } = useChat();
  const { settings, updateSettings } = useSettings();
  const [currentView, setCurrentView] = useState<'unified' | 'local' | 'server'>('unified');
  const [unifiedHistory, setUnifiedHistory] = useState<{ 
    local: ChatHistoryEntry[], 
    server: ChatHistoryEntry[],
    duplicates: { id: string, inBoth: boolean }[]
  }>({ local: [], server: [], duplicates: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Create service instance
  const chatHistoryService = useMemo(
    () => new ChatHistoryService(settings.chatHistoryStorage),
    [settings.chatHistoryStorage]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        const target = event.target as Element;
        if (!target.closest('.dropdown-menu') && !target.closest('.dropdown-trigger')) {
          setOpenDropdown(null);
        }
      }
    };

    if (openDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown]);

  const loadUnifiedHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const unified = await chatHistoryService.loadUnifiedChatHistory();
      setUnifiedHistory(unified);
    } catch (error) {
      console.error('Error loading unified history:', error);
      toast.error('Failed to load chat history');
    } finally {
      setIsLoading(false);
    }
  }, [chatHistoryService]);

  const loadStorageStats = useCallback(async () => {
    try {
      const stats = await chatHistoryService.getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error('Error loading storage stats:', error);
    }
  }, [chatHistoryService]);

  useEffect(() => {
    if (isOpen) {
      loadUnifiedHistory();
      loadStorageStats();
    }
  }, [isOpen, loadUnifiedHistory, loadStorageStats]);

  const handleLoadChat = (chatId: string) => {
    loadChat(chatId);
    onClose();
  };



  const handleNewChat = () => {
    newChat();
    onClose();
  };

  const handleStorageModeChange = (mode: 'local' | 'server') => {
    updateSettings({ chatHistoryStorage: mode });
    toast.success(`Switched to ${mode} storage mode`);
  };

  const handleSyncChat = async (chatId: string, fromStorage: 'local' | 'server', toStorage: 'local' | 'server') => {
    setIsLoading(true);
    try {
      const success = await chatHistoryService.syncChatToStorage(chatId, fromStorage, toStorage);
      if (success) {
        toast.success(`Chat synced to ${toStorage} storage`);
        await loadUnifiedHistory();
      } else {
        toast.error('Failed to sync chat');
      }
    } catch (error) {
      console.error('Error syncing chat:', error);
      toast.error('Failed to sync chat');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFromStorage = async (chatId: string, storage: 'local' | 'server') => {
    const storageLabel = storage === 'local' ? 'device' : 'server';
    if (confirm(`Are you sure you want to delete this chat from ${storageLabel}?`)) {
      setIsLoading(true);
      try {
        const success = await chatHistoryService.deleteChatFromStorage(chatId, storage);
        if (success) {
          toast.success(`Chat deleted from ${storageLabel}`);
          await loadUnifiedHistory();
          setOpenDropdown(null);
        } else {
          toast.error(`Failed to delete chat from ${storageLabel}`);
        }
      } catch (error) {
        console.error(`Error deleting chat from ${storage}:`, error);
        toast.error(`Failed to delete chat from ${storageLabel}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleOpenChat = (chatId: string) => {
    handleLoadChat(chatId);
    setOpenDropdown(null);
  };



  const handleBackupToServer = async () => {
    setIsLoading(true);
    try {
      const result = await chatHistoryService.backupLocalToServer();
      toast.success(`Backed up ${result.success} chats to server` + (result.failed > 0 ? `, ${result.failed} failed` : ''));
      await loadUnifiedHistory();
      await loadStorageStats();
    } catch (error) {
      console.error('Error backing up to server:', error);
      toast.error('Failed to backup to server');
    } finally {
      setIsLoading(false);
    }
  };



  const getDisplayedChats = () => {
    switch (currentView) {
      case 'local':
        return unifiedHistory.local.map(chat => ({ 
          ...chat, 
          source: 'local' as const,
          inBothStorages: unifiedHistory.duplicates.some(dup => dup.id === chat.id)
        }));
      case 'server':
        return unifiedHistory.server.map(chat => ({ 
          ...chat, 
          source: 'server' as const,
          inBothStorages: unifiedHistory.duplicates.some(dup => dup.id === chat.id)
        }));
      case 'unified':
      default: {
        // For unified view, we need to be smart about duplicates
        const seen = new Set<string>();
        const combined: Array<ChatHistoryEntry & { source: 'local' | 'server' | 'both', inBothStorages: boolean }> = [];
        
        // First, add chats that exist in both storages
        unifiedHistory.duplicates.forEach(({ id }) => {
          const localChat = unifiedHistory.local.find(c => c.id === id);
          const serverChat = unifiedHistory.server.find(c => c.id === id);
          
          if (localChat && serverChat) {
            // Use the newer one, but mark as existing in both
            const newerChat = localChat.timestamp > serverChat.timestamp ? localChat : serverChat;
            combined.push({
              ...newerChat,
              source: 'both' as const,
              inBothStorages: true
            });
            seen.add(id);
          }
        });
        
        // Add local-only chats
        unifiedHistory.local.forEach(chat => {
          if (!seen.has(chat.id)) {
            combined.push({
              ...chat,
              source: 'local' as const,
              inBothStorages: false
            });
            seen.add(chat.id);
          }
        });
        
        // Add server-only chats
        unifiedHistory.server.forEach(chat => {
          if (!seen.has(chat.id)) {
            combined.push({
              ...chat,
              source: 'server' as const,
              inBothStorages: false
            });
            seen.add(chat.id);
          }
        });
        
        return combined.sort((a, b) => b.timestamp - a.timestamp);
      }
    }
  };

  const displayedChats = getDisplayedChats();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
            <FiMessageSquare size={20} />
            <span>Chat History Manager</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Storage Mode & View Controls */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-4">
          {/* Current Storage Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <FiSettings size={16} />
              <span>Storage Mode:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {settings.chatHistoryStorage === 'local' ? 'Device Only' : 'Companion Server'}
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleStorageModeChange('local')}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  settings.chatHistoryStorage === 'local'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Device
              </button>
              <button
                onClick={() => handleStorageModeChange('server')}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  settings.chatHistoryStorage === 'server'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Server
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-600"></div>

          {/* View Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">View Chats:</label>
            <div className="flex space-x-2">
              {VIEW_OPTIONS.map((view) => (
                <button
                  key={view}
                  onClick={() => setCurrentView(view)}
                  className={`flex items-center space-x-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                    currentView === view
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {view === 'local' && <FiSmartphone size={14} />}
                  {view === 'server' && <FiServer size={14} />}
                  {view === 'unified' && <FiRefreshCw size={14} />}
                  <span className="capitalize">{view === 'unified' ? 'All' : view}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleNewChat}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <FiPlus size={16} />
              <span>New Chat</span>
            </button>

            {unifiedHistory.local.length > 0 && (
              <button
                onClick={handleBackupToServer}
                disabled={isLoading}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                <FiUpload size={16} />
                <span>Backup All Chats to Server</span>
              </button>
            )}

            <button
              onClick={loadUnifiedHistory}
              disabled={isLoading}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium disabled:opacity-50"
            >
              <FiRefreshCw size={16} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto overflow-x-visible">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading...</span>
            </div>
          ) : displayedChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <FiMessageSquare className="text-gray-400" size={48} />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4">
                No chat history found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                {currentView === 'unified' 
                  ? 'Your conversations will appear here once you start chatting.'
                  : `No chats found in ${currentView} storage.`
                }
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1" style={{ overflow: 'visible' }}>
              {displayedChats.map((chat) => (
                <div
                  key={`${chat.source}-${chat.id}`}
                  className="group relative p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      {/* Source indicator */}
                      <div className="flex-shrink-0 mt-1">
                        {chat.source === 'both' ? (
                          <div className="flex space-x-1" title="Stored in both locations">
                            <FiSmartphone className="text-blue-500" size={12} />
                            <FiServer className="text-green-500" size={12} />
                          </div>
                        ) : chat.source === 'local' ? (
                          <FiSmartphone className="text-blue-500" size={16} title="Stored locally" />
                        ) : (
                          <FiServer className="text-green-500" size={16} title="Stored on server" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* Chat Summary - Now clickable */}
                        <button
                          onClick={() => handleLoadChat(chat.id)}
                          className="text-left w-full group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                        >
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {chat.summary}
                          </p>
                        </button>
                        
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(chat.timestamp).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {chat.messageCount} messages
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                          <span className={`text-xs font-medium ${
                            chat.source === 'both'
                              ? 'text-purple-600 dark:text-purple-400'
                              : chat.source === 'local' 
                                ? 'text-blue-600 dark:text-blue-400' 
                                : 'text-green-600 dark:text-green-400'
                          }`}>
                            {chat.source === 'both' ? 'Both' : chat.source === 'local' ? 'Device' : 'Server'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-1">
                      {/* Open button - always visible */}
                      <button
                        onClick={() => handleLoadChat(chat.id)}
                        className="p-2 text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                        title="Open chat"
                      >
                        <FiEye size={16} />
                      </button>
                      
                      {/* Quick sync button for unified view */}
                      {currentView === 'unified' && chat.source !== 'both' && (
                        <button
                          onClick={() => {
                            const fromStorage = chat.source === 'local' ? 'local' : 'server';
                            const toStorage = chat.source === 'local' ? 'server' : 'local';
                            handleSyncChat(chat.id, fromStorage, toStorage);
                          }}
                          className="p-2 text-green-500 hover:text-green-700 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                          title={`Sync to ${chat.source === 'local' ? 'server' : 'device'}`}
                        >
                          <FiRefreshCw size={14} />
                        </button>
                      )}

                      {/* Options dropdown */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdown(openDropdown === chat.id ? null : chat.id);
                          }}
                          className="dropdown-trigger p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                          title="More options"
                        >
                          <FiMoreVertical size={16} />
                        </button>
                        
                        {/* Dropdown menu */}
                        {openDropdown === chat.id && (
                          <div className="dropdown-menu absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 rounded-md shadow-xl border border-gray-200 dark:border-gray-700 z-[100]">
                            <div className="py-1">
                              {/* Open */}
                              <button
                                onClick={() => handleOpenChat(chat.id)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                              >
                                <FiEye size={14} />
                                <span>Open Chat</span>
                              </button>
                              
                              {/* Upload to Server (only for local-only chats) */}
                              {(chat.source === 'local') && (
                                <button
                                  onClick={() => {
                                    handleSyncChat(chat.id, 'local', 'server');
                                    setOpenDropdown(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center space-x-2"
                                >
                                  <FiUpload size={14} />
                                  <span>Upload to Server</span>
                                </button>
                              )}
                              
                              {/* Storage-specific delete options */}
                              <div className="border-t border-gray-200 dark:border-gray-600 mt-1 pt-1">
                                {/* Delete Locally (only if stored locally) */}
                                {(chat.source === 'both' || chat.source === 'local') && (
                                  <button
                                    onClick={() => handleDeleteFromStorage(chat.id, 'local')}
                                    className="w-full text-left px-4 py-2 text-sm text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 flex items-center space-x-2"
                                  >
                                    <FiSmartphone size={14} />
                                    <span>Delete Locally</span>
                                  </button>
                                )}
                                
                                {/* Delete from Server (only if stored on server) */}
                                {(chat.source === 'both' || chat.source === 'server') && (
                                  <button
                                    onClick={() => handleDeleteFromStorage(chat.id, 'server')}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                                  >
                                    <FiServer size={14} />
                                    <span>Delete from Server</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Stats */}
        {storageStats && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="flex items-center space-x-2">
                <FiSmartphone className="text-blue-500" size={14} />
                <span className="text-gray-600 dark:text-gray-400">
                  Device: {storageStats.local.count} chats ({storageStats.local.size})
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <FiServer className={storageStats.server.available ? "text-green-500" : "text-red-500"} size={14} />
                <span className="text-gray-600 dark:text-gray-400">
                  Server: {storageStats.server.available ? `${storageStats.server.count} chats` : 'Not available'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHistoryModal;
