import { useContext } from 'react';
import type { ChatContextType } from '../types';
import { ChatContext } from '../contexts/ChatContextObject';

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
