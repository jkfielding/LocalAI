import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import { 
  FiSettings, 
  FiSend, 
  FiMessageSquare, 
  FiPlus,
  FiWifi,
  FiWifiOff,
  FiArrowDown,
  FiMic,
  FiMicOff
} from 'react-icons/fi';

import { SettingsProvider } from './contexts/SettingsContext';
import { ChatProvider } from './contexts/ChatContext';
import { useSettings } from './hooks/useSettings';
import { useChat } from './hooks/useChat';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';

// Components (we'll create these next)
import MessageBubble from './components/MessageBubble';
import WelcomeMessage from './components/WelcomeMessage';
import SettingsModal from './components/SettingsModal';
import ChatHistoryModal from './components/ChatHistoryModal';
import SetupWizard from './components/SetupWizard';
import LoadingSpinner from './components/LoadingSpinner';
import PWAInstallPrompt from './components/PWAInstallPrompt';

interface AppHeaderProps {
  onShowChatHistory: () => void;
  onShowSettings: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ onShowChatHistory, onShowSettings }) => {
  const { connectionStatus, settings } = useSettings();
  const { newChat } = useChat();

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <FiWifi className="text-green-500" size={16} />;
      case 'connecting':
        return <FiWifi className="text-yellow-500 animate-pulse" size={16} />;
      case 'error':
        return <FiWifiOff className="text-red-500" size={16} />;
      default:
        return <FiWifiOff className="text-gray-500" size={16} />;
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected to AI Service';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Not connected';
      default:
        return 'Disconnected';
    }
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky header-safe z-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-16 py-2">
          {/* Left side - History and New Chat */}
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <button
              onClick={onShowChatHistory}
              className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <FiMessageSquare size={16} />
              <span className="hidden sm:inline">History</span>
            </button>
            <button
              onClick={newChat}
              className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <FiPlus size={16} />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>

          {/* Center - Title and Model */}
          <div className="text-center max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mx-2 flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              LocalAI Chat
            </h1>
            {connectionStatus === 'connected' && settings.modelName && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-words leading-tight px-2">
                {settings.modelName}
              </p>
            )}
          </div>

          {/* Right side - Connection status and Settings */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <div className="flex items-center space-x-2 px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800">
              {getConnectionIcon()}
              <span className="text-xs text-gray-600 dark:text-gray-400 hidden sm:inline">
                {getConnectionText()}
              </span>
            </div>
            <button
              onClick={onShowSettings}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Settings"
            >
              <FiSettings size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

const ChatArea: React.FC = () => {
  const { messages, isLoading } = useChat();
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const initialScrollDone = useRef(false);

  // Check if user is near bottom of chat
  const isNearBottom = useCallback(() => {
    if (!chatAreaRef.current) return false;
    
    const { scrollTop, scrollHeight, clientHeight } = chatAreaRef.current;
    const threshold = 100; // pixels from bottom
    return scrollHeight - scrollTop - clientHeight <= threshold;
  }, []);

  // Scroll to bottom smoothly
  const scrollToBottom = useCallback((smooth: boolean = true) => {
    if (!chatAreaRef.current) return;
    
    chatAreaRef.current.scrollTo({
      top: chatAreaRef.current.scrollHeight,
      behavior: smooth ? 'smooth' : 'instant'
    });
  }, []);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!chatAreaRef.current) return;
    
    const nearBottom = isNearBottom();
    setIsAutoScrolling(nearBottom);
    setShowScrollToBottom(!nearBottom && messages.length > 0);
  }, [isNearBottom, messages.length]);

  // Auto-scroll to bottom when new messages arrive or during streaming
  useEffect(() => {
    if (isAutoScrolling) {
      scrollToBottom(false); // Instant scroll during streaming for smoothness
    }
  }, [messages, isAutoScrolling, scrollToBottom]);

  // Auto-scroll when loading starts (new message being generated)
  useEffect(() => {
    if (isLoading && isAutoScrolling) {
      scrollToBottom(true);
    }
  }, [isLoading, isAutoScrolling, scrollToBottom]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (messages.length === 0) {
      initialScrollDone.current = false;
      return;
    }

    if (!initialScrollDone.current) {
      initialScrollDone.current = true;
      const timeoutId = setTimeout(() => scrollToBottom(false), 100);
      return () => clearTimeout(timeoutId);
    }
  }, [messages.length, scrollToBottom]);

  return (
    <div 
      ref={chatAreaRef}
      className="flex-1 overflow-y-auto px-4 py-6 relative"
      onScroll={handleScroll}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {messages.length === 0 ? (
          <WelcomeMessage />
        ) : (
          messages.map((message, index) => (
            <div
              key={message.id}
              ref={index === messages.length - 1 ? lastMessageRef : null}
            >
              <MessageBubble message={message} />
            </div>
          ))
        )}
      </div>

      {/* Scroll to bottom button */}
      {showScrollToBottom && (
        <button
          onClick={() => {
            setIsAutoScrolling(true);
            scrollToBottom(true);
          }}
          className="fixed bottom-24 right-8 z-40 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-200 flex items-center space-x-2"
          title="Scroll to bottom and resume auto-scroll"
        >
          <FiArrowDown size={20} />
          {isLoading && (
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          )}
        </button>
      )}
    </div>
  );
};

const ChatInput: React.FC = () => {
  const { sendMessage, isLoading, abortCurrentRequest } = useChat();
  const { connectionStatus, settings } = useSettings();
  const [input, setInput] = useState('');
  const [charCount, setCharCount] = useState(0);
  const maxChars = 4000;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { isListening, isSupported: isSpeechSupported, startListening, stopListening, transcript } = useSpeechRecognition({
    onResult: (text) => {
      setInput(prev => prev + (prev ? ' ' : '') + text);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    },
    onError: (error) => {
      console.error('Speech recognition error:', error);
    }
  });

  useEffect(() => {
    if ((!settings.voiceInputEnabled || connectionStatus !== 'connected') && isListening) {
      stopListening();
    }
  }, [connectionStatus, isListening, settings.voiceInputEnabled, stopListening]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && connectionStatus === 'connected') {
      await sendMessage(input.trim());
      setInput('');
      setCharCount(0);
    }
  };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxChars) {
      setInput(value);
      setCharCount(value.length);
      
      // Auto-resize textarea
      const target = e.target;
      target.style.height = 'auto';
      target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
    }
  };

  const toggleVoiceInput = () => {
    if (!settings.voiceInputEnabled || !isSpeechSupported || connectionStatus !== 'connected') {
      return;
    }
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const canSend = input.trim().length > 0 && connectionStatus === 'connected' && !isLoading;
  const displayValue = isListening
    ? `${input}${transcript ? `${input ? ' ' : ''}${transcript}` : ''}`
    : input;

  return (
    <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 sticky bottom-0">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={displayValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              name="chat-message"
              id="chat-message-input"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              data-gramm="false"
              data-gramm_editor="false"
              data-ms-editor="false"
              enterKeyHint="send"
              placeholder={
                connectionStatus === 'connected' 
                  ? (isListening ? "Listening..." : "Type your message here...") 
                  : "Connect to your AI service to start chatting"
              }
              disabled={connectionStatus !== 'connected'}
              rows={1}
              className="w-full resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 pr-12 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            {settings.voiceInputEnabled && isSpeechSupported && connectionStatus === 'connected' && (
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${
                  isListening 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={isListening ? "Stop listening" : "Start voice input"}
              >
                {isListening ? <FiMicOff size={18} /> : <FiMic size={18} />}
              </button>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {charCount}/{maxChars}
              </span>
              {isLoading && (
                <button
                  type="button"
                  onClick={abortCurrentRequest}
                  className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {isLoading ? (
                <div className="flex items-center space-x-2 text-gray-500">
                  <LoadingSpinner size="sm" />
                  <span className="text-sm">Sending...</span>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={!canSend}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FiSend size={16} />
                  <span className="hidden sm:inline">Send</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { isSetupComplete } = useSettings();
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);

  useEffect(() => {
    // Show setup wizard only on first load when setup is not complete
    if (!isSetupComplete && !showSetupWizard) {
      setShowSetupWizard(true);
    }
    // Hide setup wizard if setup becomes complete
    else if (isSetupComplete && showSetupWizard) {
      setShowSetupWizard(false);
    }

    // Listen for custom events from WelcomeMessage
    const handleShowSetupWizard = () => {
      // Only show setup wizard if setup is not complete
      if (!isSetupComplete) {
        setShowSetupWizard(true);
      }
    };
    const handleShowSettings = () => setShowSettings(true);

    window.addEventListener('showSetupWizard', handleShowSetupWizard);
    window.addEventListener('showSettings', handleShowSettings);

    return () => {
      window.removeEventListener('showSetupWizard', handleShowSetupWizard);
      window.removeEventListener('showSettings', handleShowSettings);
    };
  }, [isSetupComplete, showSetupWizard]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader 
        onShowChatHistory={() => setShowChatHistory(true)}
        onShowSettings={() => setShowSettings(true)}
      />
      <ChatArea />
      <ChatInput />
      
      <SetupWizard 
        isOpen={showSetupWizard} 
        onClose={() => setShowSetupWizard(false)}
        onComplete={() => {
          setShowSetupWizard(false);
          // Force a state update to ensure wizard doesn't reappear
        }}
      />
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        onShowSetupWizard={() => setShowSetupWizard(true)}
      />
      <ChatHistoryModal 
        isOpen={showChatHistory} 
        onClose={() => setShowChatHistory(false)} 
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <SettingsProvider>
      <ChatProvider>
        <AppContent />
        <PWAInstallPrompt />
        <Toaster 
          position="top-right"
          toastOptions={{
            className: 'dark:bg-gray-800 dark:text-white',
            duration: 3000,
          }}
        />
      </ChatProvider>
    </SettingsProvider>
  );
};

export default App;
