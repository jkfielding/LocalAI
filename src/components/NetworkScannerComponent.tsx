import React, { useState, useEffect } from 'react';
import { FiSearch, FiWifi, FiServer, FiCheckCircle, FiClock } from 'react-icons/fi';
import { NetworkScanner, type NetworkDevice } from '../utils/networkScanner';

interface NetworkScannerProps {
  onDeviceSelect: (endpoint: string) => void;
  onClose: () => void;
}

const NetworkScannerComponent: React.FC<NetworkScannerProps> = ({ onDeviceSelect, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0, found: 0 });
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [quickScanComplete, setQuickScanComplete] = useState(false);

  useEffect(() => {
    // Start with a quick scan for common configurations
    performQuickScan();
  }, []);

  const performQuickScan = async () => {
    try {
      const quickDevices = await NetworkScanner.quickScan();
      setDevices(quickDevices);
      setQuickScanComplete(true);
    } catch (error) {
      console.error('Quick scan failed:', error);
      setQuickScanComplete(true);
    }
  };

  const performFullScan = async () => {
    setIsScanning(true);
    setScanProgress({ current: 0, total: 0, found: 0 });
    
    try {
      const result = await NetworkScanner.scanNetwork((progress) => {
        setScanProgress(progress);
      });
      
      setDevices(result.devices);
      setQuickScanComplete(true);
    } catch (error) {
      console.error('Full network scan failed:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectDevice = (device: NetworkDevice) => {
    const endpoint = NetworkScanner.getApiEndpoint(device);
    onDeviceSelect(endpoint);
  };

  const getServiceIcon = (device: NetworkDevice) => {
    const serviceName = NetworkScanner.getServiceDisplayName(device);
    
    // Specific icons for known services
    if (serviceName === 'LM Studio') {
      return <FiServer className="text-blue-600" size={20} />;
    }
    if (serviceName === 'Ollama') {
      return <FiServer className="text-purple-500" size={20} />;
    }
    if (serviceName === 'LocalAI') {
      return <FiWifi className="text-green-500" size={20} />;
    }
    
    // Default by service type
    switch (device.service) {
      case 'openai-compatible':
        return <FiServer className="text-blue-500" size={20} />;
      case 'localai':
        return <FiWifi className="text-green-500" size={20} />;
      case 'ollama':
        return <FiServer className="text-purple-500" size={20} />;
      default:
        return <FiServer className="text-gray-500" size={20} />;
    }
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 100) return 'Very Fast';
    if (ms < 500) return 'Fast';
    if (ms < 1000) return 'Good';
    return 'Slow';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Network Scanner
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Automatically detect AI services on your local network
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Quick Scan Results */}
          {quickScanComplete && devices.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <FiCheckCircle className="text-green-500" size={16} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Quick scan found {devices.length} device{devices.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="space-y-2">
                {devices.map((device) => (
                  <div
                    key={`${device.ip}:${device.port}`}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => handleSelectDevice(device)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getServiceIcon(device)}
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {NetworkScanner.getServiceDisplayName(device)}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {device.ip}:{device.port}
                          </div>
                          {device.modelInfo?.name && (
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              {device.modelInfo.name}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <FiClock size={12} />
                          <span>{formatResponseTime(device.responseTime)}</span>
                        </div>
                        {device.modelInfo?.models && device.modelInfo.models.length > 0 && (
                          <div className="text-xs text-gray-400 mt-1">
                            {device.modelInfo.models.length} model{device.modelInfo.models.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Scan Option */}
          {!isScanning && quickScanComplete && (
            <div className="text-center">
              <button
                onClick={performFullScan}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiSearch size={16} />
                <span>Scan Entire Network</span>
              </button>
              <p className="text-xs text-gray-500 mt-2">
                This will scan all devices on your local network (may take 30-60 seconds)
              </p>
            </div>
          )}

          {/* Scanning Progress */}
          {isScanning && (
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Scanning network... {scanProgress.found} service{scanProgress.found !== 1 ? 's' : ''} found
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300 flex items-center justify-center"
                    style={{
                      width: `${scanProgress.total > 0 ? (scanProgress.current / scanProgress.total) * 100 : 0}%`
                    }}
                  >
                    {scanProgress.total > 0 && (
                      <span className="text-xs text-white font-medium px-2">
                        {Math.round((scanProgress.current / scanProgress.total) * 100)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {scanProgress.current} of {scanProgress.total} network locations checked
                </div>
                {scanProgress.found > 0 && (
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    ✓ Found: {scanProgress.found} AI service{scanProgress.found !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          )}
          {quickScanComplete && devices.length === 0 && !isScanning && (
            <div className="text-center py-8">
              <FiWifi className="mx-auto text-gray-400 mb-4" size={48} />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No AI services detected
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Make sure your AI service is running and accessible on the network.
              </p>
              <button
                onClick={performFullScan}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiSearch size={16} />
                <span>Try Full Network Scan</span>
              </button>
            </div>
          )}

          {/* Manual Entry Options */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                📱 Can't find your Mac from iPhone?
              </h4>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800 text-sm">
                <p className="text-yellow-800 dark:text-yellow-200 mb-2">
                  <strong>Quick fix:</strong> Find your Mac's IP address and test it manually:
                </p>
                <ol className="text-yellow-700 dark:text-yellow-300 space-y-1 text-xs">
                  <li>1. On your Mac: System Settings → Network → Wi-Fi → Details</li>
                  <li>2. Note the IP address (e.g., 192.168.1.100)</li>
                  <li>3. Make sure LM Studio server is running on port 1234</li>
                  <li>4. Use the manual entry below</li>
                </ol>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Enter IP Address Manually
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkScannerComponent;