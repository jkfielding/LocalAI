import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useSettings } from '../hooks/useSettings';
import { ChatHistoryService } from '../services/chatHistoryService';
import { ChatContext } from './ChatContextObject';
import toast from 'react-hot-toast';

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
  const [lastAssistantMessageId, setLastAssistantMessageId] = useState<string | null>(null);
  const [lastAssistantMessageTimestamp, setLastAssistantMessageTimestamp] = useState<number>(0);

  const chatHistoryService = useMemo(
    () => new ChatHistoryService(settings.chatHistoryStorage),
    [settings.chatHistoryStorage]
  );

  // Update service when settings change
  useEffect(() => {
    chatHistoryService.setStorageMode(settings.chatHistoryStorage);
  }, [chatHistoryService, settings.chatHistoryStorage]);

  const loadChatData = useCallback(async () => {
    try {
      // Always load current messages from localStorage (for active chat)
      const savedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (savedMessages) {
        const parsedMessages: Message[] = JSON.parse(savedMessages).map((msg: Message) => ({
          ...msg,
          isHistorical: true,
        }));
        setMessages(parsedMessages);
        setLastAssistantMessageId(null);
        setLastAssistantMessageTimestamp(0);
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
  }, [chatHistoryService, setLastAssistantMessageId, setLastAssistantMessageTimestamp]);

  // Load data on mount
  useEffect(() => {
    loadChatData();
  }, [loadChatData]);

  // Save messages to storage when they change
  useEffect(() => {
    if (messages.length === 0) {
      return;
    }
    try {
      // Always save current messages to localStorage (for active chat)
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
      if (currentChatId) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_CHAT_ID, currentChatId);
      }
    } catch (error) {
      console.error('Error saving chat data:', error);
    }
  }, [messages, currentChatId]);

  const generateId = useCallback((): string => {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const addMessage = useCallback((content: string, role: Message['role']) => {
    const newMessage: Message = {
      id: generateId(),
      content,
      role,
      timestamp: Date.now(),
      isHistorical: false,
    };

    setMessages(prev => [...prev, newMessage]);
    
    if (role === 'assistant') {
      setLastAssistantMessageId(newMessage.id);
      setLastAssistantMessageTimestamp(newMessage.timestamp);
    }
  }, [generateId, setLastAssistantMessageId, setLastAssistantMessageTimestamp]);

  const updateChatHistory = useCallback(async () => {
    if (messages.length === 0) return;

    const chatId = currentChatId || generateId();
    const latestUserMessage = [...messages]
      .reverse()
      .find(m => m.role === 'user');
    const summary = latestUserMessage?.content
      ? `${latestUserMessage.content.substring(0, 50)}${latestUserMessage.content.length > 50 ? '...' : ''}`
      : 'New Chat';

    const historyEntry: ChatHistoryEntry = {
      id: chatId,
      summary,
      timestamp: Date.now(),
      messageCount: messages.length,
      messages: [...messages]
    };

    try {
      // Save to service (handles local or server storage)
      const { localSaved, serverSaved } = await chatHistoryService.saveChatHistory(historyEntry);

      if (!localSaved) {
        toast.error('Failed to save chat history locally');
      }

      if (settings.chatHistoryStorage === 'server') {
        if (!serverSaved) {
          toast.error('Unable to save to companion server. Make sure LocalAI companion server is running on port 5174.');
        }
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
    } catch (error) {
      console.error('Error updating chat history:', error);
      toast.error('Failed to save chat history');
    }
  }, [messages, currentChatId, chatHistoryService, settings.chatHistoryStorage, generateId]);

  const handleRegularResponse = useCallback(async (requestBody: ChatCompletionRequest, signal: AbortSignal) => {
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
  }, [settings.apiEndpoint, addMessage]);

  const handleStreamingResponse = useCallback(async (requestBody: ChatCompletionRequest, signal: AbortSignal) => {
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
      isStreaming: true,
      isHistorical: false,
    };
    setMessages(prev => [...prev, streamingMessage]);
    setLastAssistantMessageId(streamingMessageId);
    setLastAssistantMessageTimestamp(Date.now());

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
            const dataLine = line.substring(6).trim();
            
            if (dataLine === '[DONE]') {
              // Finalize the streaming message
              setMessages(prev => prev.map(msg => 
                msg.id === streamingMessageId 
                  ? { ...msg, content: streamingContent, isStreaming: false }
                  : msg
              ));
              setLastAssistantMessageTimestamp(Date.now());
              return;
            }
            
            try {
              const parsed: StreamingChatCompletionResponse = JSON.parse(dataLine);
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
      setLastAssistantMessageTimestamp(Date.now());
    }
  }, [settings.apiEndpoint, generateId, setLastAssistantMessageId, setLastAssistantMessageTimestamp]);

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
  }, [settings, connectionStatus, messages, addMessage, handleRegularResponse, handleStreamingResponse]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setCurrentChatId(null);
    setLastAssistantMessageId(null);
    setLastAssistantMessageTimestamp(0);
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
    const needsHydration = !chat || !Array.isArray(chat.messages) || chat.messages.length === 0;

    // Fetch a fresh copy when we don't have the full transcript locally
    if (needsHydration) {
      const loadedChat = await chatHistoryService.loadChatHistory(chatId);
      chat = loadedChat || chat;
    }
    
    if (chat && Array.isArray(chat.messages) && chat.messages.length > 0) {
      const hydratedMessages = chat.messages.map(message => ({
        ...message,
        isHistorical: true,
      }));
      setMessages(hydratedMessages);
      setCurrentChatId(chatId);
      setLastAssistantMessageId(null);
      setLastAssistantMessageTimestamp(0);
      
      // Keep the cached list up to date so subsequent loads do not need another fetch
      setChatHistory(prev => {
        const next = [...prev];
        const index = next.findIndex(item => item.id === chatId);
        const historyEntry: ChatHistoryEntry = {
          ...chat!,
          messages: [...chat!.messages],
          messageCount: chat!.messages.length,
          timestamp: chat!.timestamp ?? chat!.messages[chat!.messages.length - 1]?.timestamp ?? Date.now()
        };
        if (index >= 0) {
          next[index] = historyEntry;
          return next;
        }
        return [historyEntry, ...next];
      });
    } else {
      toast.error('Chat not found');
    }
  }, [chatHistory, chatHistoryService]);

  const deleteChat = useCallback(async (chatId: string) => {
    const { localDeleted, serverDeleted } = await chatHistoryService.deleteChatHistory(chatId);

    if (!localDeleted) {
      toast.error('Failed to delete chat locally');
      return;
    }

    if (settings.chatHistoryStorage === 'server' && !serverDeleted) {
      toast.error('Deleted locally but failed to remove chat from companion server');
    }

    setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      clearChat();
    }
    toast.success('Chat deleted');
  }, [currentChatId, clearChat, chatHistoryService, settings.chatHistoryStorage]);

  const clearHistory = useCallback(async () => {
    const { localCleared, serverCleared } = await chatHistoryService.clearAllChatHistory();

    if (!localCleared) {
      toast.error('Failed to clear local chat history');
      return;
    }

    if (settings.chatHistoryStorage === 'server' && !serverCleared) {
      toast.error('Local history cleared, but failed to clear companion server history');
    }

    // Clear all state and reload to ensure consistency
    setChatHistory([]);
    clearChat(); // Clear current chat if any
    
    // Force reload chat data to ensure no cached data remains
    setTimeout(() => {
      loadChatData();
    }, 100);
    
    toast.success('Chat history cleared');
  }, [chatHistoryService, clearChat, loadChatData, settings.chatHistoryStorage]);

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
    if (messages.length > 0 && !isLoading) {
      // Use setTimeout to avoid blocking the UI
      const timeoutId = setTimeout(() => {
        updateChatHistory().catch(error => {
          console.error('Error updating chat history:', error);
        });
      }, 1000); // Debounce to avoid too frequent saves

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, currentChatId, isLoading, settings.chatHistoryStorage]);

  const value: ChatContextType = {
    messages,
    chatHistory,
    currentChatId,
    isLoading,
    lastAssistantMessageId,
    lastAssistantMessageTimestamp,
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
