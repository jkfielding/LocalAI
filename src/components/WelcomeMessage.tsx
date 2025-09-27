import React from 'react';
import { FiSettings, FiHelpCircle, FiWifi, FiWifiOff } from 'react-icons/fi';
import { useSettings } from '../contexts/SettingsContext';

const WelcomeMessage: React.FC = () => {
  const { connectionStatus, isSetupComplete } = useSettings();

  const getConnectionStatus = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: <FiWifi className="text-green-500" size={24} />,
          text: 'Connected to AI Service',
          color: 'text-green-600 dark:text-green-400'
        };
      case 'connecting':
        return {
          icon: <FiWifi className="text-yellow-500 animate-pulse" size={24} />,
          text: 'Connecting...',
          color: 'text-yellow-600 dark:text-yellow-400'
        };
      case 'error':
        return {
          icon: <FiWifiOff className="text-red-500" size={24} />,
          text: 'Not connected to AI service',
          color: 'text-red-600 dark:text-red-400'
        };
      default:
        return {
          icon: <FiWifiOff className="text-gray-500" size={24} />,
          text: 'Disconnected',
          color: 'text-gray-600 dark:text-gray-400'
        };
    }
  };

  const status = getConnectionStatus();

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 max-w-md w-full">
        {/* Robot Icon */}
        <div className="text-6xl mb-4">🤖</div>
        
        {/* Welcome Text */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome to LocalAI Chat!
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Your private AI assistant powered by local models. All conversations stay on your device.
        </p>

        {/* Features */}
        <div className="grid grid-cols-1 gap-3 mb-6 text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-green-500">🔒</span>
            <span className="text-gray-700 dark:text-gray-300">100% Private & Local</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-blue-500">⚡</span>
            <span className="text-gray-700 dark:text-gray-300">Fast Response Times</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-purple-500">💻</span>
            <span className="text-gray-700 dark:text-gray-300">Works Offline</span>
          </div>
        </div>

        {/* Connection Status */}
        <div className="flex items-center justify-center space-x-2 mb-6 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
          {status.icon}
          <span className={`font-medium ${status.color}`}>
            {status.text}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {!isSetupComplete && (
            <button
              onClick={() => {
                // The main app will handle showing the setup wizard
                window.dispatchEvent(new CustomEvent('showSetupWizard'));
              }}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <FiHelpCircle size={18} />
              <span>Setup Guide</span>
            </button>
          )}
          
          <button
            onClick={() => {
              // The main app will handle showing settings
              window.dispatchEvent(new CustomEvent('showSettings'));
            }}
            className="w-full flex items-center justify-center space-x-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            <FiSettings size={18} />
            <span>Settings</span>
          </button>
        </div>

        {/* Quick Start Tip */}
        {connectionStatus === 'connected' && (
          <div className="mt-6 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-200">
              🎉 Ready to chat! Type your message below to get started.
            </p>
          </div>
        )}

        {connectionStatus === 'error' && (
          <div className="mt-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              💡 Make sure your AI service is running and accessible.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WelcomeMessage;