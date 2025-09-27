import React from 'react';
import { FiUser, FiCpu, FiAlertCircle } from 'react-icons/fi';
import type { MessageBubbleProps } from '../types';

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
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
        
        <div className="text-xs opacity-60 mt-2">
          {new Date(message.timestamp).toLocaleTimeString()}
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