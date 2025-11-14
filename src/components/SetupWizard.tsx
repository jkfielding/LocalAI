import React, { useState } from 'react';
import { FiX, FiArrowLeft, FiArrowRight, FiCheckCircle, FiXCircle, FiSearch } from 'react-icons/fi';
import type { SetupWizardProps } from '../types';
import { useSettings } from '../hooks/useSettings';
import LoadingSpinner from './LoadingSpinner';
import NetworkScannerComponent from './NetworkScannerComponent';

const SetupWizard: React.FC<SetupWizardProps> = ({ isOpen, onClose, onComplete }) => {
  const { updateSettings, markSetupComplete } = useSettings();
  const [currentStep, setCurrentStep] = useState(1);
  const [apiUrl, setApiUrl] = useState('http://localhost:1234');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<'idle' | 'success' | 'error'>('idle');
  const [showNetworkScanner, setShowNetworkScanner] = useState(false);

  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionTestResult('idle');
    
    // Prepare the endpoint URL
    const endpoint = apiUrl.includes('/v1/chat/completions') 
      ? apiUrl 
      : `${apiUrl.replace(/\/$/, '')}/v1/chat/completions`;
    
    // Test connection directly with the new endpoint, don't rely on settings state
    try {
      // First try the models endpoint
      const modelsEndpoint = endpoint.replace('/v1/chat/completions', '/v1/models');
      
      const response = await fetch(modelsEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });

      let isConnected = false;

      if (response.ok) {
        isConnected = true;
      } else {
        // If models endpoint fails, try a simple POST to chat completions
        const testRequest = {
          model: 'test-model',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1,
          temperature: 0.1,
          stream: false
        };

        const chatResponse = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testRequest),
          signal: AbortSignal.timeout(10000)
        });

        // AI services return 400 for invalid requests, which still means they're running
        isConnected = chatResponse.ok || chatResponse.status === 400 || chatResponse.status === 422;
      }

      setConnectionTestResult(isConnected ? 'success' : 'error');
      
      // Only update settings if connection is successful
      if (isConnected) {
        updateSettings({ apiEndpoint: endpoint });
      }
      
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionTestResult('error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleFinish = () => {
    markSetupComplete();
    onClose(); // Close first
    onComplete(); // Then call completion handler
  };

  const handleSkip = () => {
    markSetupComplete();
    onClose(); // Close first
    onComplete(); // Then call completion handler
  };

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Welcome to LocalAI Chat!',
      content: (
        <div className="text-center space-y-6">
          <div className="text-6xl">🚀</div>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Let's get you set up!
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              We'll help you connect to your local AI service in just a few steps.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 max-w-sm mx-auto">
            <div className="flex items-center space-x-3 text-left">
              <span className="text-xl">🔒</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">100% Private & Local</span>
            </div>
            <div className="flex items-center space-x-3 text-left">
              <span className="text-xl">⚡</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">Fast Response Times</span>
            </div>
            <div className="flex items-center space-x-3 text-left">
              <span className="text-xl">💻</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">Works Offline</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Start AI Service',
      content: (
        <div className="space-y-6">
          <div className="text-center text-5xl">🛠️</div>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Launch Your Local Server
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Choose and start your preferred AI service:
            </p>
          </div>
          
          {/* OS-Specific Recommendations */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white">OS-Specific Recommendations:</h4>
            
            {/* Mac Recommendation */}
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">🍎</span>
                <div>
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-1">
                    macOS: LM Studio (Recommended)
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    <strong>LM Studio</strong> offers the best Mac experience with native UI, automatic setup and excellent performance.
                  </p>
                  <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                    📱 Download: <span className="font-mono">lmstudio.ai</span> • Default port: <span className="font-mono">1234</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Windows Recommendation */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">🪟</span>
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                    Windows: LM Studio or Ollama
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>LM Studio</strong> for GUI experience or <strong>Ollama</strong> for command-line flexibility. Both work excellent on Windows.
                  </p>
                  <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                    LM Studio: <span className="font-mono">lmstudio.ai</span> (port 1234) • Ollama: <span className="font-mono">ollama.ai</span> (port 11434)
                  </div>
                </div>
              </div>
            </div>

            {/* Linux Recommendation */}
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">🐧</span>
                <div>
                  <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-1">
                    Linux: Ollama or LocalAI
                  </h4>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    <strong>Ollama</strong> for simple setup or <strong>LocalAI</strong> for advanced features. Both offer excellent Linux support.
                  </p>
                  <div className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                    Ollama: <span className="font-mono">curl -fsSL https://ollama.ai/install.sh | sh</span> • LocalAI: <span className="font-mono">Docker or binary</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white">General Setup Steps:</h4>
            <ol className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium">1</span>
                <span>Open your <strong>AI service</strong> (LM Studio, Ollama, LocalAI, etc.)</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium">2</span>
                <span>Load your preferred model</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium">3</span>
                <span>Start the <strong>Local Server</strong> (usually in Server/Chat tab)</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium">4</span>
                <span>Note the port number (typically 1234 for LM Studio, 11434 for Ollama)</span>
              </li>
            </ol>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              <strong>Popular Services by OS:</strong>
            </p>
            <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <div><strong>Mac:</strong> LM Studio (1234), Ollama (11434)</div>
              <div><strong>Windows:</strong> LM Studio (1234), Ollama (11434)</div>
              <div><strong>Linux:</strong> Ollama (11434), LocalAI (8080)</div>
            </div>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start space-x-2">
              <span className="text-yellow-600 dark:text-yellow-400">💡</span>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Cross-Device Usage:</strong> You can run this PWA on your phone/tablet while the AI service runs on your computer. Just use your computer's IP address instead of localhost.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Network Configuration',
      content: (
        <div className="space-y-6">
          <div className="text-center text-5xl">🌐</div>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Configure Network Connection
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Enter your device's IP address where your AI service is running:
            </p>
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              AI Service URL
            </label>
            <div className="flex space-x-2">
              <input
                type="url"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://localhost:1234"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => setShowNetworkScanner(true)}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
                title="Scan network for AI services"
              >
                <FiSearch size={16} />
                <span className="hidden sm:inline">Scan</span>
              </button>
            </div>
            <p className="text-xs text-gray-500">
              💡 Click "Scan" to automatically detect AI services on your network
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Common Services:</span>
                <span className="font-mono text-xs">
                  LM Studio: :1234 | Ollama: :11434 | LocalAI: :8080
                </span>
              </div>
              <div className="flex justify-between">
                <span>Local access:</span>
                <span className="font-mono">localhost or 127.0.0.1</span>
              </div>
              <div className="flex justify-between">
                <span>Network access:</span>
                <span className="font-mono">Your device's IP address</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                💡 <strong>Tip:</strong> Use your device's IP address for network access from other devices
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Test Connection',
      content: (
        <div className="space-y-6">
          <div className="text-center text-5xl">🔍</div>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Verify Your Setup
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Let's test the connection to your AI service:
            </p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Testing URL:</strong>
              <div className="font-mono mt-1 break-all">
                {apiUrl.includes('/v1/chat/completions') ? apiUrl : `${apiUrl.replace(/\/$/, '')}/v1/chat/completions`}
              </div>
            </div>
          </div>

          <button
            onClick={handleTestConnection}
            disabled={isTestingConnection}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            {isTestingConnection ? (
              <LoadingSpinner size="sm" />
            ) : (
              <span>🔍</span>
            )}
            <span>{isTestingConnection ? 'Testing Connection...' : 'Test Connection'}</span>
          </button>

          {connectionTestResult === 'success' && (
            <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <FiCheckCircle className="text-green-500" size={20} />
              <span className="text-green-800 dark:text-green-200 font-medium">
                ✅ Connection successful! You're ready to chat.
              </span>
            </div>
          )}

          {connectionTestResult === 'error' && (
            <div className="flex items-start space-x-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <FiXCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-red-800 dark:text-red-200">
                <div className="font-medium">❌ Connection failed</div>
                <div className="text-sm mt-1">
                  Make sure your AI service is running and accessible.
                </div>
              </div>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-lg w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              LocalAI Setup
            </h2>
            <div className="flex space-x-1">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i + 1 <= currentStep
                      ? 'bg-blue-600'
                      : 'bg-gray-300 dark:bg-gray-600'
                  } transition-colors`}
                />
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="min-h-[300px]">
            {steps[currentStep - 1].content}
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Step {currentStep} of {totalSteps}</span>
            <button
              onClick={handleSkip}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Skip Setup
            </button>
          </div>
          
          <div className="flex space-x-3">
            {currentStep > 1 && (
              <button
                onClick={handlePrevious}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <FiArrowLeft size={16} />
                <span>Previous</span>
              </button>
            )}
            
            {currentStep < totalSteps ? (
              <button
                onClick={handleNext}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>Next</span>
                <FiArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={connectionTestResult !== 'success'}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>🎉 Finish Setup</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Network Scanner Modal */}
      {showNetworkScanner && (
        <NetworkScannerComponent
          onDeviceSelect={(endpoint) => {
            // Only use external AI service endpoints, not our companion server
            const baseUrl = endpoint.replace('/v1/chat/completions', '').replace('/api/chat', '');
            
            // Filter out our own companion server (port 5174)
            if (baseUrl.includes(':5174')) {
              return; // Don't auto-fill with our own companion server
            }
            
            setApiUrl(baseUrl);
            setShowNetworkScanner(false);
          }}
          onClose={() => setShowNetworkScanner(false)}
        />
      )}
    </div>
  );
};

export default SetupWizard;
