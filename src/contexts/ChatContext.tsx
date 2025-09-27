import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { 
  Message, 
  ChatHistoryEntry, 
  ChatContextType, 
  ChatCompletionRequest, 
  ChatCompletionResponse,
  StreamingChatCompletionResponse
} from '../types';
import { STORAGE_KEYS } from '../types';
import { useSettings } from './SettingsContext';
import { ChatHistoryService } from '../services/chatHistoryService';
import toast from 'react-hot-toast';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { settings, connectionStatus } = useSettings();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatHistoryEntry[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Create chat history service instance
  const [chatHistoryService] = useState(() => 
    new ChatHistoryService(settings.apiEndpoint, settings.chatHistoryStorage)
  );

  // Update service when settings change
  useEffect(() => {
    chatHistoryService.setBaseUrl(settings.apiEndpoint);
    chatHistoryService.setStorageMode(settings.chatHistoryStorage);
  }, [settings.apiEndpoint, settings.chatHistoryStorage, chatHistoryService]);

  // Load data on mount
  useEffect(() => {
    loadChatData();
  }, []);

  // Save messages to storage when they change
  useEffect(() => {
    if (messages.length > 0) {
      saveChatData();
    }
  }, [messages]);

  const loadChatData = async () => {
    try {
      // Always load current messages from localStorage (for active chat)
      const savedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }

      // Load current chat ID
      const savedChatId = localStorage.getItem(STORAGE_KEYS.CURRENT_CHAT_ID);
      if (savedChatId) {
        setCurrentChatId(savedChatId);
      }

      // Load chat history using the service (respects storage mode)
      const history = await chatHistoryService.loadChatHistoryList();
      setChatHistory(history);
    } catch (error) {
      console.error('Error loading chat data:', error);
      toast.error('Failed to load chat history');
    }
  };

  const saveChatData = () => {
    try {
      // Always save current messages to localStorage (for active chat)
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
      if (currentChatId) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_CHAT_ID, currentChatId);
      }
    } catch (error) {
      console.error('Error saving chat data:', error);
    }
  };

  const generateId = (): string => {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const addMessage = useCallback((content: string, role: Message['role']) => {
    const newMessage: Message = {
      id: generateId(),
      content,
      role,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, newMessage]);
  }, []);

  const updateChatHistory = useCallback(async () => {
    if (messages.length === 0) return;

    const chatId = currentChatId || generateId();
    const summary = messages.find(m => m.role === 'user')?.content?.substring(0, 50) + '...' || 'New Chat';

    const historyEntry: ChatHistoryEntry = {
      id: chatId,
      summary,
      timestamp: Date.now(),
      messageCount: messages.length,
      messages: [...messages]
    };

    // Save to service (handles local or server storage)
    const saved = await chatHistoryService.saveChatHistory(historyEntry);
    if (!saved) {
      // Provide different error messages based on storage mode
      if (settings.chatHistoryStorage === 'server') {
        toast.error('Unable to save to companion server. Make sure LocalAI companion server is running on port 5174.');
      } else {
        toast.error('Failed to save chat history locally');
      }
      
      // Continue with local state update even if server save failed
      // This ensures the UI stays consistent
    }

    // Update local state (always update for better UX)
    setChatHistory(prev => {
      const existingIndex = prev.findIndex(chat => chat.id === chatId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = historyEntry;
        return updated;
      } else {
        return [historyEntry, ...prev];
      }
    });

    if (!currentChatId) {
      setCurrentChatId(chatId);
    }
  }, [messages, currentChatId, chatHistoryService]);

  const sendMessage = useCallback(async (content: string) => {
    if (connectionStatus !== 'connected') {
      toast.error('Not connected to AI service');
      return;
    }

    // Add user message immediately
    addMessage(content, 'user');
    setIsLoading(true);

    // Create abort controller for this request
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const apiMessages = messages
        .filter(msg => msg.role !== 'system' && msg.role !== 'error')
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      // Add the new user message
      apiMessages.push({ role: 'user', content });

      // Prepare messages for API with system prompt if provided
      const messagesWithSystem = settings.systemPrompt.trim() 
        ? [{ role: 'system', content: settings.systemPrompt }, ...apiMessages]
        : apiMessages;

      const requestBody: ChatCompletionRequest = {
        model: settings.modelName,
        messages: messagesWithSystem,
        max_tokens: settings.maxTokens,
        temperature: settings.temperature,
        stream: settings.streamingEnabled
      };

      if (settings.streamingEnabled) {
        await handleStreamingResponse(requestBody, controller.signal);
      } else {
        await handleRegularResponse(requestBody, controller.signal);
      }

    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.log('Request was aborted');
          return;
        }
        console.error('Send message error:', error);
        addMessage(`Error: ${error.message}`, 'error');
        toast.error(`Failed to send message: ${error.message}`);
      } else {
        console.error('Unknown error:', error);
        addMessage('An unknown error occurred', 'error');
        toast.error('An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  }, [settings, connectionStatus, messages, addMessage]);

  const handleRegularResponse = async (requestBody: ChatCompletionRequest, signal: AbortSignal) => {
    const response = await fetch(settings.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: ChatCompletionResponse = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const assistantMessage = data.choices[0].message.content || '[Empty response]';
      addMessage(assistantMessage, 'assistant');
    } else {
      throw new Error('Invalid response format');
    }
  };

  const handleStreamingResponse = async (requestBody: ChatCompletionRequest, signal: AbortSignal) => {
    const response = await fetch(settings.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let streamingContent = '';
    const streamingMessageId = generateId();

    // Add initial streaming message
    const streamingMessage: Message = {
      id: streamingMessageId,
      content: '',
      role: 'assistant',
      timestamp: Date.now(),
      isStreaming: true
    };
    setMessages(prev => [...prev, streamingMessage]);

    if (!reader) {
      throw new Error('Response body is not readable');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6).trim();
            
            if (data === '[DONE]') {
              // Finalize the streaming message
              setMessages(prev => prev.map(msg => 
                msg.id === streamingMessageId 
                  ? { ...msg, content: streamingContent, isStreaming: false }
                  : msg
              ));
              return;
            }
            
            try {
              const parsed: StreamingChatCompletionResponse = JSON.parse(data);
              if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                const content = parsed.choices[0].delta.content;
                streamingContent += content;
                
                // Update streaming message
                setMessages(prev => prev.map(msg => 
                  msg.id === streamingMessageId 
                    ? { ...msg, content: streamingContent }
                    : msg
                ));
              }
            } catch {
              // Skip invalid JSON chunks
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Ensure final message is saved
    if (streamingContent) {
      setMessages(prev => prev.map(msg => 
        msg.id === streamingMessageId 
          ? { ...msg, content: streamingContent, isStreaming: false }
          : msg
      ));
    }
  };

  const clearChat = useCallback(() => {
    setMessages([]);
    setCurrentChatId(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.MESSAGES);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_CHAT_ID);
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  }, []);

  const newChat = useCallback(async () => {
    // Save current chat to history if it has messages
    if (messages.length > 0) {
      await updateChatHistory();
    }
    clearChat();
  }, [messages, clearChat, updateChatHistory]);

  const loadChat = useCallback(async (chatId: string) => {
    // Try to load from current storage first
    let chat = chatHistory.find(c => c.id === chatId);
    
    // If not found, try loading directly from service (handles both local and server)
    if (!chat) {
      const loadedChat = await chatHistoryService.loadChatHistory(chatId);
      chat = loadedChat || undefined;
    }
    
    if (chat) {
      setMessages(chat.messages);
      setCurrentChatId(chatId);
    } else {
      toast.error('Chat not found');
    }
  }, [chatHistory, chatHistoryService]);

  const deleteChat = useCallback(async (chatId: string) => {
    const deleted = await chatHistoryService.deleteChatHistory(chatId);
    if (!deleted) {
      toast.error('Failed to delete chat');
      return;
    }

    setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      clearChat();
    }
    toast.success('Chat deleted');
  }, [currentChatId, clearChat, chatHistoryService]);

  const clearHistory = useCallback(async () => {
    const cleared = await chatHistoryService.clearAllChatHistory();
    if (!cleared) {
      toast.error('Failed to clear chat history');
      return;
    }

    // Clear all state and reload to ensure consistency
    setChatHistory([]);
    clearChat(); // Clear current chat if any
    
    // Force reload chat data to ensure no cached data remains
    setTimeout(() => {
      loadChatData();
    }, 100);
    
    toast.success('Chat history cleared');
  }, [chatHistoryService, clearChat, loadChatData]);

  const abortCurrentRequest = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsLoading(false);
      toast.success('Request cancelled');
    }
  }, [abortController]);

  // Update chat history when messages change
  useEffect(() => {
    if (messages.length > 0) {
      // Use setTimeout to avoid blocking the UI
      const timeoutId = setTimeout(() => {
        updateChatHistory().catch(error => {
          console.error('Error updating chat history:', error);
        });
      }, 1000); // Debounce to avoid too frequent saves

      return () => clearTimeout(timeoutId);
    }
  }, [messages, updateChatHistory]);

  const value: ChatContextType = {
    messages,
    chatHistory,
    currentChatId,
    isLoading,
    addMessage,
    sendMessage,
    clearChat,
    newChat,
    loadChat,
    deleteChat,
    clearHistory,
    abortCurrentRequest
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
