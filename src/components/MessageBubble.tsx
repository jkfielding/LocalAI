import React, { useState, useEffect, useRef } from 'react';
import { FiUser, FiCpu, FiAlertCircle, FiVolume2, FiVolumeX, FiPause } from 'react-icons/fi';
import type { MessageBubbleProps } from '../types';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useSettings } from '../hooks/useSettings';
import { useChat } from '../hooks/useChat';

const AUTO_PLAY_WINDOW_MS = 120000; // Only auto-play within the last 2 minutes

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { settings } = useSettings();
  const { lastAssistantMessageId, lastAssistantMessageTimestamp } = useChat();
  const { speak, stop, pause, resume, isSpeaking, isPaused, isSupported } = useTextToSpeech({
    rate: settings.ttsRate,
    pitch: settings.ttsPitch,
    volume: settings.ttsVolume
  });
  const [isThisMessageSpeaking, setIsThisMessageSpeaking] = useState(false);
  const autoPlayTriggeredRef = useRef(false);

  const sanitizeContentForSpeech = (content: string) => {
    if (!content) return '';
    return content
      .replace(/```[\s\S]*?```/g, (block) => block.replace(/```/g, ' '))
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`([^`]*)`/g, '$1')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const handleSpeak = () => {
    if (isThisMessageSpeaking) {
      if (isPaused) {
        resume();
      } else {
        pause();
      }
    } else {
      const textToSpeak = sanitizeContentForSpeech(message.content);
      if (!textToSpeak) return;
      autoPlayTriggeredRef.current = true;
      setIsThisMessageSpeaking(true);
      speak(textToSpeak);
    }
  };

  const handleStop = () => {
    stop();
    setIsThisMessageSpeaking(false);
  };

  const formatContent = (content: string) => {
    // Basic markdown-style formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/\n/g, '<br>');
  };

  const getRoleIcon = () => {
    switch (message.role) {
      case 'user':
        return <FiUser size={16} className="text-white" />;
      case 'assistant':
        return <FiCpu size={16} className="text-gray-600 dark:text-gray-300" />;
      case 'error':
        return <FiAlertCircle size={16} className="text-red-500" />;
      default:
        return null;
    }
  };

  const getRoleStyles = () => {
    switch (message.role) {
      case 'user':
        return {
          container: 'justify-end',
          bubble: 'bg-blue-600 text-white max-w-[85%] sm:max-w-[70%]',
          icon: 'bg-blue-700'
        };
      case 'assistant':
        return {
          container: 'justify-start',
          bubble: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 max-w-[85%] sm:max-w-[70%]',
          icon: 'bg-gray-200 dark:bg-gray-700'
        };
      case 'error':
        return {
          container: 'justify-start',
          bubble: 'bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100 border border-red-200 dark:border-red-800 max-w-[85%] sm:max-w-[70%]',
          icon: 'bg-red-200 dark:bg-red-800'
        };
      case 'system':
        return {
          container: 'justify-center',
          bubble: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 max-w-[90%] text-center',
          icon: 'bg-gray-300 dark:bg-gray-600'
        };
      default:
        return {
          container: 'justify-start',
          bubble: 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100',
          icon: 'bg-gray-300 dark:bg-gray-600'
        };
    }
  };

  const styles = getRoleStyles();

  useEffect(() => {
    if (!isSpeaking) {
      setIsThisMessageSpeaking(false);
    }
  }, [isSpeaking]);

  useEffect(() => {
    if (!settings.ttsEnabled && isThisMessageSpeaking) {
      stop();
      setIsThisMessageSpeaking(false);
    }
  }, [settings.ttsEnabled, isThisMessageSpeaking, stop]);

  useEffect(() => {
    if (autoPlayTriggeredRef.current) {
      return;
    }

    const isLatestAssistantMessage = message.id === lastAssistantMessageId;
    const recentEnough = lastAssistantMessageTimestamp > 0 
      ? Date.now() - lastAssistantMessageTimestamp <= AUTO_PLAY_WINDOW_MS
      : false;

    if (
      message.role === 'assistant' &&
      !message.isStreaming &&
      !message.isHistorical &&
      settings.ttsEnabled &&
      settings.ttsAutoPlay &&
      isSupported &&
      isLatestAssistantMessage &&
      recentEnough
    ) {
      const textToSpeak = sanitizeContentForSpeech(message.content);
      if (!textToSpeak) {
        return;
      }
      autoPlayTriggeredRef.current = true;
      setIsThisMessageSpeaking(true);
      speak(textToSpeak);
    }
  }, [
    isSupported,
    lastAssistantMessageId,
    lastAssistantMessageTimestamp,
    message.content,
    message.id,
    message.isHistorical,
    message.isStreaming,
    message.role,
    settings.ttsAutoPlay,
    settings.ttsEnabled,
    speak
  ]);

  return (
    <div className={`flex items-start space-x-3 ${styles.container}`}>
      {message.role !== 'user' && (
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${styles.icon}`}>
          {getRoleIcon()}
        </div>
      )}
      
      <div className={`rounded-lg px-4 py-3 ${styles.bubble} relative`}>
        <div
          className="prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{
            __html: message.isStreaming 
              ? formatContent(message.content) + '<span class="inline-block w-2 h-4 bg-current animate-pulse align-middle"></span>'
              : formatContent(message.content)
          }}
        />
        
        <div className="flex items-center justify-between mt-2">
          <div className="text-xs opacity-60">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
          
          {message.role === 'assistant' && !message.isStreaming && settings.ttsEnabled && isSupported && (
            <div className="flex items-center space-x-1">
              {isThisMessageSpeaking && isSpeaking && (
                <button
                  onClick={handleStop}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title="Stop"
                >
                  <FiVolumeX size={14} className="opacity-60" />
                </button>
              )}
              <button
                onClick={handleSpeak}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title={isThisMessageSpeaking ? (isPaused ? "Resume" : "Pause") : "Read aloud"}
              >
                {isThisMessageSpeaking && isSpeaking && !isPaused ? (
                  <FiPause size={14} className="opacity-60" />
                ) : (
                  <FiVolume2 size={14} className={isThisMessageSpeaking ? "opacity-100 text-blue-600" : "opacity-60"} />
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {message.role === 'user' && (
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${styles.icon}`}>
          {getRoleIcon()}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
