import React, { useState, useEffect } from 'react';
import { FiX, FiRefreshCw, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import type { SettingsModalProps } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import LoadingSpinner from './LoadingSpinner';

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onShowSetupWizard }) => {
  const { 
    settings, 
    updateSettings, 
    resetSettings, 
    connectionStatus, 
    testConnection, 
    availableModels, 
    fetchAvailableModels, 
    isLoadingModels,
    resetSetup
  } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [originalSettings, setOriginalSettings] = useState(settings); // Store original settings for revert

  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
      setOriginalSettings(settings); // Store the original settings when modal opens
    }
  }, [isOpen, settings]);

  // Effect to apply dark mode changes immediately
  useEffect(() => {
    if (isOpen && localSettings.darkModeEnabled !== settings.darkModeEnabled) {
      // Apply dark mode change immediately (temporary)
      updateSettings({ darkModeEnabled: localSettings.darkModeEnabled });
    }
  }, [localSettings.darkModeEnabled, isOpen]);

  const handleSave = () => {
    updateSettings(localSettings);
    onClose();
  };

  const handleClose = () => {
    // Revert dark mode if it was changed but not saved
    if (localSettings.darkModeEnabled !== originalSettings.darkModeEnabled) {
      updateSettings({ darkModeEnabled: originalSettings.darkModeEnabled });
    }
    onClose();
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      resetSettings();
      setLocalSettings(settings);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    // Update settings temporarily for testing
    updateSettings(localSettings);
    await testConnection();
    setIsTestingConnection(false);
  };

  const handleInputChange = (field: keyof typeof localSettings, value: string | number | boolean | unknown[]) => {
    setLocalSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* API Endpoint */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Endpoint
            </label>
            <input
              type="url"
              value={localSettings.apiEndpoint}
              onChange={(e) => handleInputChange('apiEndpoint', e.target.value)}
              placeholder="http://localhost:1234/v1/chat/completions"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Model Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Model Name
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={localSettings.modelName}
                onChange={(e) => handleInputChange('modelName', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent break-all text-sm"
                disabled={isLoadingModels}
                title={localSettings.modelName} // Show full name on hover
              >
                {availableModels.length > 0 ? (
                  availableModels.map((model) => (
                    <option key={model} value={model} className="break-all">
                      {model}
                    </option>
                  ))
                ) : (
                  <option value={localSettings.modelName} className="break-all">
                    {localSettings.modelName}
                  </option>
                )}
              </select>
              <button
                onClick={fetchAvailableModels}
                disabled={isLoadingModels}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors flex-shrink-0"
                title="Refresh available models"
              >
                <FiRefreshCw className={`${isLoadingModels ? 'animate-spin' : ''}`} size={16} />
              </button>
            </div>
            {availableModels.length === 0 && !isLoadingModels && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Connect to AI service to load available models
              </p>
            )}
            {isLoadingModels && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Loading available models...
              </p>
            )}
          </div>

          {/* Max Tokens */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Max Tokens: {localSettings.maxTokens}
            </label>
            <input
              type="range"
              min="100"
              max="8192"
              step="100"
              value={localSettings.maxTokens}
              onChange={(e) => handleInputChange('maxTokens', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>100</span>
              <span>8192</span>
            </div>
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Temperature: {localSettings.temperature}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={localSettings.temperature}
              onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0 (Focused)</span>
              <span>2 (Creative)</span>
            </div>
          </div>

          {/* Context Length */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Context Length: {localSettings.contextLength}
            </label>
            <input
              type="range"
              min="1024"
              max="32768"
              step="1024"
              value={localSettings.contextLength}
              onChange={(e) => handleInputChange('contextLength', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1K</span>
              <span>32K</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Maximum number of tokens to maintain in conversation context
            </p>
          </div>

          {/* Streaming */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable Streaming
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                ChatGPT-like response streaming
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.streamingEnabled}
                onChange={(e) => handleInputChange('streamingEnabled', e.target.checked)}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full ${localSettings.streamingEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'} transition-colors`}>
                <div className={`dot absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform ${localSettings.streamingEnabled ? 'translate-x-5' : ''}`} />
              </div>
            </label>
          </div>

          {/* Dark Mode */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                🌙 Dark Mode
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Toggle between light and dark themes
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.darkModeEnabled}
                onChange={(e) => handleInputChange('darkModeEnabled', e.target.checked)}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors ${localSettings.darkModeEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
                <div className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform ${localSettings.darkModeEnabled ? 'translate-x-5' : ''}`} />
              </div>
            </label>
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              🤖 System Prompt
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Customize how the AI assistant behaves and responds
            </p>
            <textarea
              value={localSettings.systemPrompt}
              onChange={(e) => handleInputChange('systemPrompt', e.target.value)}
              placeholder="You are a helpful AI assistant. Provide clear, accurate and helpful responses."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            />
            <div className="mt-2 flex items-start space-x-2">
              <div className="flex-shrink-0">
                <span className="text-xs">💡</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <strong>Tips:</strong> Be specific about tone (professional, casual, creative), expertise level, 
                or special behaviors. Example: "You are a senior software developer who explains concepts clearly 
                and provides practical examples."
              </div>
            </div>
          </div>

          {/* MCP (Model Context Protocol) */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  🔌 Model Context Protocol (MCP)
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Connect to MCP servers for enhanced AI capabilities
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.mcpEnabled}
                  onChange={(e) => handleInputChange('mcpEnabled', e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${localSettings.mcpEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  <div className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform ${localSettings.mcpEnabled ? 'translate-x-5' : ''}`} />
                </div>
              </label>
            </div>

            {localSettings.mcpEnabled && (
              <div className="mt-4 space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    <strong>MCP servers</strong> extend your AI with tools, data sources and workflows. 
                    Add HTTP-based MCP servers below. Note: Browser-based clients only support HTTP MCP servers.
                  </p>
                </div>
                
                {localSettings.mcpServers.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    <p className="text-sm">No MCP servers configured</p>
                    <p className="text-xs mt-1">Add a server below to get started</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {localSettings.mcpServers.map((server) => (
                      <div key={server.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">{server.name}</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              server.enabled 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' 
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {server.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{server.url}</p>
                          {server.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{server.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            const updatedServers = localSettings.mcpServers.filter(s => s.id !== server.id);
                            handleInputChange('mcpServers', updatedServers);
                          }}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Add MCP Server</p>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Server Name (e.g., Weather Tools)"
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      id="mcp-server-name"
                    />
                    <input
                      type="url"
                      placeholder="Server URL (e.g., http://localhost:3001)"
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      id="mcp-server-url"
                    />
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      id="mcp-server-description"
                    />
                    <button
                      onClick={() => {
                        const nameInput = document.getElementById('mcp-server-name') as HTMLInputElement;
                        const urlInput = document.getElementById('mcp-server-url') as HTMLInputElement;
                        const descInput = document.getElementById('mcp-server-description') as HTMLInputElement;
                        
                        if (nameInput.value && urlInput.value) {
                          const newServer = {
                            id: `mcp-${Date.now()}`,
                            name: nameInput.value,
                            url: urlInput.value,
                            description: descInput.value,
                            enabled: true,
                            type: 'http' as const
                          };
                          
                          const updatedServers = [...localSettings.mcpServers, newServer];
                          handleInputChange('mcpServers', updatedServers);
                          
                          // Clear inputs
                          nameInput.value = '';
                          urlInput.value = '';
                          descInput.value = '';
                        }
                      }}
                      className="w-full px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Add Server
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Connection Test */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Connection Status
              </span>
              <button
                onClick={handleTestConnection}
                disabled={isTestingConnection}
                className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isTestingConnection ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <FiRefreshCw size={14} />
                )}
                <span>{isTestingConnection ? 'Testing...' : 'Test Connection'}</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              {connectionStatus === 'connected' && (
                <>
                  <FiCheckCircle className="text-green-500" size={16} />
                  <span className="text-sm text-green-600 dark:text-green-400">Connected to AI Service</span>
                </>
              )}
              {connectionStatus === 'connecting' && (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="text-sm text-yellow-600 dark:text-yellow-400">Connecting...</span>
                </>
              )}
              {connectionStatus === 'error' && (
                <>
                  <FiXCircle className="text-red-500" size={16} />
                  <span className="text-sm text-red-600 dark:text-red-400">Connection failed</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              Reset to Defaults
            </button>
            {onShowSetupWizard && (
              <button
                onClick={() => {
                  resetSetup(); // Reset setup completion state
                  onShowSetupWizard(); // Show setup wizard
                  onClose(); // Close settings modal
                }}
                className="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                Run Setup Again
              </button>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;