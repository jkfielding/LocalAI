import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { 
  AppSettings, 
  ConnectionStatus, 
  SettingsContextType, 
  ChatCompletionRequest,
  ModelsResponse,
  MCPServer,
  MCPTool
} from '../types';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../types';
import { MCPService } from '../services/mcpService';

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isSetupComplete, setIsSetupComplete] = useState<boolean>(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);

  // MCP service instance
  const [mcpService] = useState(() => new MCPService());

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setSettings(prev => ({ ...prev, ...parsed }));
        }

        const setupComplete = localStorage.getItem(STORAGE_KEYS.SETUP_COMPLETE);
        setIsSetupComplete(setupComplete === 'true');
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Apply dark mode changes to document
  useEffect(() => {
    const root = document.documentElement;
    if (settings.darkModeEnabled) {
      root.classList.add('dark');
      // Update theme color for PWA
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', '#1a1a1a');
      }
    } else {
      root.classList.remove('dark');
      // Update theme color for PWA
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', '#007acc');
      }
    }
  }, [settings.darkModeEnabled]);

  // Test initial connection
  useEffect(() => {
    if (isSetupComplete) {
      testConnection();
    }
  }, [isSetupComplete, settings.apiEndpoint]);

  // Fetch models when connection is successful
  useEffect(() => {
    if (connectionStatus === 'connected') {
      fetchAvailableModels();
    }
  }, [connectionStatus]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    
    // Ensure endpoint has proper format
    if (newSettings.apiEndpoint && !newSettings.apiEndpoint.includes('/v1/chat/completions')) {
      const baseUrl = newSettings.apiEndpoint.replace(/\/$/, '');
      updatedSettings.apiEndpoint = `${baseUrl}/v1/chat/completions`;
    }
    
    setSettings(updatedSettings);
    
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    } catch (error) {
      console.error('Error removing settings:', error);
    }
  };

  const testConnection = async (): Promise<boolean> => {
    setConnectionStatus('connecting');
    
    try {
      // First try a simple GET request to /v1/models endpoint
      const modelsEndpoint = settings.apiEndpoint.replace('/v1/chat/completions', '/v1/models');
      
      const response = await fetch(modelsEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (response.ok) {
        setConnectionStatus('connected');
        return true;
      } else {
        // If models endpoint fails, try a simple POST to chat completions
        const testRequest: ChatCompletionRequest = {
          model: 'test-model', // Use a generic model name for testing
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1,
          temperature: 0.1,
          stream: false
        };

        const chatResponse = await fetch(settings.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testRequest),
          signal: AbortSignal.timeout(10000)
        });

        // AI services return 400 for invalid requests, which still means they're running
        if (chatResponse.ok || chatResponse.status === 400 || chatResponse.status === 422) {
          setConnectionStatus('connected');
          return true;
        } else {
          throw new Error(`HTTP ${chatResponse.status}: ${chatResponse.statusText}`);
        }
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('error');
      return false;
    }
  };

  const fetchAvailableModels = async (): Promise<void> => {
    setIsLoadingModels(true);
    
    try {
      const modelsEndpoint = settings.apiEndpoint.replace('/v1/chat/completions', '/v1/models');
      
      const response = await fetch(modelsEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const data: ModelsResponse = await response.json();
        const modelIds = data.data?.map(model => model.id) || [];
        setAvailableModels(modelIds);
        
        // If current model isn't in available models and we have models, update to first available
        if (modelIds.length > 0 && !modelIds.includes(settings.modelName)) {
          setSettings(prev => ({ ...prev, modelName: modelIds[0] }));
        }
      } else {
        console.warn('Failed to fetch models:', response.status);
        setAvailableModels([]);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      setAvailableModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const markSetupComplete = () => {
    setIsSetupComplete(true);
    try {
      localStorage.setItem(STORAGE_KEYS.SETUP_COMPLETE, 'true');
    } catch (error) {
      console.error('Error saving setup status:', error);
    }
  };

  const resetSetup = () => {
    setIsSetupComplete(false);
    try {
      localStorage.removeItem(STORAGE_KEYS.SETUP_COMPLETE);
    } catch (error) {
      console.error('Error resetting setup status:', error);
    }
  };

  // MCP methods
  const addMCPServer = (server: MCPServer) => {
    const updatedServers = [...settings.mcpServers, server];
    updateSettings({ mcpServers: updatedServers });
    mcpService.addServer(server);
  };

  const removeMCPServer = (serverId: string) => {
    const updatedServers = settings.mcpServers.filter(s => s.id !== serverId);
    updateSettings({ mcpServers: updatedServers });
    mcpService.removeServer(serverId);
  };

  const updateMCPServer = (serverId: string, updates: Partial<MCPServer>) => {
    const updatedServers = settings.mcpServers.map(s => 
      s.id === serverId ? { ...s, ...updates } : s
    );
    updateSettings({ mcpServers: updatedServers });
    
    // Update the service
    const updatedServer = updatedServers.find(s => s.id === serverId);
    if (updatedServer) {
      mcpService.addServer(updatedServer);
    }
  };

  const getAvailableMCPTools = (): MCPTool[] => {
    return mcpService.getAllAvailableTools();
  };

  const refreshMCPConnections = async (): Promise<void> => {
    await mcpService.refreshAllConnections();
  };

  // Initialize MCP servers when settings change
  useEffect(() => {
    if (settings.mcpEnabled && settings.mcpServers.length > 0) {
      settings.mcpServers.forEach(server => {
        mcpService.addServer(server);
      });
    }
  }, [settings.mcpEnabled, settings.mcpServers]);

  const value: SettingsContextType = {
    settings,
    updateSettings,
    resetSettings,
    connectionStatus,
    testConnection,
    isSetupComplete,
    markSetupComplete,
    resetSetup,
    availableModels,
    fetchAvailableModels,
    isLoadingModels,
    // MCP properties and methods
    mcpServers: settings.mcpServers,
    addMCPServer,
    removeMCPServer,
    updateMCPServer,
    getAvailableMCPTools,
    refreshMCPConnections,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
