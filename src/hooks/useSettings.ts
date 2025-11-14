import { useContext } from 'react';
import type { SettingsContextType } from '../types';
import { SettingsContext } from '../contexts/SettingsContextObject';

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
