export interface NetworkDevice {
  ip: string;
  port: number;
  service: 'localai' | 'ollama' | 'openai-compatible' | 'unknown';
  modelInfo?: {
    name?: string;
    models?: string[];
  };
  responseTime: number;
}

export interface ScanResult {
  devices: NetworkDevice[];
  scanDuration: number;
}

interface OpenAIModelMeta {
  id: string;
  owned_by?: string;
}

interface OllamaModelMeta {
  name: string;
}

export class NetworkScanner {
  // Prioritized ports - most common first
  private static readonly PRIORITY_PORTS = [
    8080,  // LocalAI default
    11434, // Ollama default  
    1234,  // OpenAI-compatible APIs (common port)
  ];

  // Additional ports for deeper scan
  private static readonly EXTENDED_PORTS = [
    3000,  // Development port
    5000,  // Alternative port
    8000,  // Alternative port
    5174,  // LocalAI companion server
    7860,  // Hugging Face Transformers
    6379,  // Custom AI APIs
  ];

  // Common endpoints to test
  private static readonly TEST_ENDPOINTS = {
    'openai-compatible': ['/v1/models', '/v1/chat/completions'],
    'localai': ['/v1/models', '/api/health'],
    'ollama': ['/api/tags'],
  };

  static async quickScan(): Promise<NetworkDevice[]> {
    const startTime = Date.now();
    const devices: NetworkDevice[] = [];
    
    const currentIP = await this.getCurrentDeviceIP();
    
    const quickCandidates = [
      '127.0.0.1',
      'localhost',
      currentIP,
      ...(currentIP ? [
        currentIP.replace(/\d+$/, '1'),
        currentIP.replace(/\d+$/, '100'),
        currentIP.replace(/\d+$/, '101'),
        currentIP.replace(/\d+$/, '102')
      ] : []),
    ].filter(Boolean) as string[];
    
    const uniqueCandidates = [...new Set(quickCandidates)];

    const promises = uniqueCandidates.flatMap(ip => 
      this.PRIORITY_PORTS.map(port => this.testDevice(ip, port))
    );

    const results = await Promise.allSettled(promises);
    
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        devices.push(result.value);
      }
    });

    console.log(`Quick scan: ${Date.now() - startTime}ms, found ${devices.length} device(s)`);
    
    return devices;
  }

  static async scanNetwork(progressCallback?: (progress: { current: number; total: number; found: number }) => void): Promise<ScanResult> {
    const startTime = Date.now();
    const devices: NetworkDevice[] = [];
    
    const ipCandidates = await this.getSmartIPCandidates();
    const allPorts = [...this.PRIORITY_PORTS, ...this.EXTENDED_PORTS];
    
    const totalRequests = ipCandidates.length * allPorts.length;
    let current = 0;
    const batchSize = 12;

    for (let i = 0; i < ipCandidates.length; i += batchSize) {
      const batch = ipCandidates.slice(i, i + batchSize);
      
      const batchPromises = batch.flatMap(ip => 
        allPorts.map(port => this.testDevice(ip, port))
      );

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach(result => {
        current++;
        if (result.status === 'fulfilled' && result.value) {
          devices.push(result.value);
        }
        
        if (progressCallback) {
          progressCallback({
            current,
            total: totalRequests,
            found: devices.length
          });
        }
      });

      if (i + batchSize < ipCandidates.length) {
        await new Promise(resolve => setTimeout(resolve, 30));
      }
    }

    const scanDuration = Date.now() - startTime;
    console.log(`Network scan: ${scanDuration}ms, ${devices.length} device(s) found`);
    
    return {
      devices,
      scanDuration
    };
  }

  private static async getSmartIPCandidates(): Promise<string[]> {
    try {
      const currentIP = await this.getCurrentDeviceIP();
      if (!currentIP) {
        return this.getFallbackIPs();
      }

      const parts = currentIP.split('.');
      if (parts.length !== 4) {
        return this.getFallbackIPs();
      }

      const baseIP = `${parts[0]}.${parts[1]}.${parts[2]}`;
      const currentLastOctet = parseInt(parts[3]);

      const candidates = new Set<string>();
      
      candidates.add(currentIP);
      candidates.add('127.0.0.1');
      candidates.add('localhost');
      candidates.add(`${baseIP}.1`);
      candidates.add(`${baseIP}.254`);
      
      for (const staticIP of [2, 10, 20, 50, 100, 101, 102, 103, 110, 150, 200, 250]) {
        candidates.add(`${baseIP}.${staticIP}`);
      }
      
      const scanRange = 10;
      for (let i = Math.max(2, currentLastOctet - scanRange); i <= Math.min(253, currentLastOctet + scanRange); i++) {
        candidates.add(`${baseIP}.${i}`);
      }
      
      for (let i = 2; i <= 30; i++) {
        candidates.add(`${baseIP}.${i}`);
      }

      return Array.from(candidates);
    } catch {
      console.warn('Failed to determine network, using fallback IPs');
      return this.getFallbackIPs();
    }
  }

  private static async getCurrentDeviceIP(): Promise<string | null> {
    return new Promise((resolve) => {
      try {
        const pc = new RTCPeerConnection();
        pc.createDataChannel('test');
        
        const timeout = setTimeout(() => {
          pc.close();
          resolve(null);
        }, 1000);

        pc.addEventListener('icecandidate', (event) => {
          if (event.candidate && event.candidate.candidate.includes('typ host')) {
            const ip = event.candidate.candidate.split(' ')[4];
            clearTimeout(timeout);
            pc.close();
            resolve(ip);
          }
        });
        
        pc.createOffer().then(offer => pc.setLocalDescription(offer));
      } catch {
        resolve(null);
      }
    });
  }

  private static getFallbackIPs(): string[] {
    return [
      '127.0.0.1',
      'localhost',
      // Common router IPs
      '192.168.1.1',
      '192.168.0.1',
      '10.0.0.1',
      // Common device IP ranges (Macs often get these)
      '192.168.1.2', '192.168.1.3', '192.168.1.4', '192.168.1.5',
      '192.168.1.10', '192.168.1.20', '192.168.1.100', '192.168.1.101', '192.168.1.102',
      '192.168.0.2', '192.168.0.3', '192.168.0.4', '192.168.0.5',
      '192.168.0.10', '192.168.0.20', '192.168.0.100', '192.168.0.101', '192.168.0.102',
      '10.0.0.2', '10.0.0.3', '10.0.0.4', '10.0.0.5',
      '10.0.0.10', '10.0.0.20', '10.0.0.100', '10.0.0.101', '10.0.0.102',
      // Additional common ranges
      '172.16.0.1', '172.16.0.2', '172.16.0.100',
    ];
  }

  private static async testDevice(ip: string, port: number): Promise<NetworkDevice | null> {
    const startTime = Date.now();
    
    try {
      const service = await this.detectServiceType(ip, port);
      if (!service) return null;

      const responseTime = Date.now() - startTime;
      const device: NetworkDevice = {
        ip,
        port,
        service: service.type,
        responseTime,
        modelInfo: service.modelInfo
      };

      return device;
    } catch {
      return null;
    }
  }

  private static async detectServiceType(ip: string, port: number): Promise<{
    type: NetworkDevice['service'];
    modelInfo?: NetworkDevice['modelInfo'];
  } | null> {
    const baseUrl = `http://${ip}:${port}`;
    const isLocalhost = ip === '127.0.0.1' || ip === 'localhost';
    const timeout = isLocalhost ? 1000 : 2000;
    
    if (port === 1234) {
      try {
        const response = await fetch(`${baseUrl}/v1/models`, {
          method: 'GET',
          signal: AbortSignal.timeout(timeout)
        });
        
        if (response.ok) {
          try {
            const data = await response.json();
            // Check if this is LM Studio by looking for specific patterns
            const isLMStudio = data.data?.some((m: OpenAIModelMeta) => 
              m.id?.includes('lm-studio') || 
              m.owned_by === 'lm-studio' ||
              response.headers.get('server')?.includes('lm-studio')
            );
            
            return {
              type: 'openai-compatible',
              modelInfo: {
                name: isLMStudio ? 'LM Studio' : 'OpenAI-Compatible API',
                models: data.data?.map((m: OpenAIModelMeta) => m.id) || []
              }
            };
          } catch {
            return { 
              type: 'openai-compatible',
              modelInfo: { name: 'LM Studio' } // Port 1234 is typically LM Studio
            };
          }
        }
      } catch {
        // Continue
      }
    }

    if (port === 11434) {
      try {
        const response = await fetch(`${baseUrl}/api/tags`, {
          method: 'GET',
          signal: AbortSignal.timeout(timeout)
        });
        
        if (response.ok) {
          try {
            const data = await response.json();
            return {
              type: 'ollama',
              modelInfo: {
                name: 'Ollama',
                models: data.models?.map((m: OllamaModelMeta) => m.name) || []
              }
            };
          } catch {
            return { type: 'ollama' };
          }
        }
      } catch {
        // Continue
      }
    }

    if (port === 8080 || port === 5174) {
      try {
        const healthResponse = await fetch(`${baseUrl}/api/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(timeout)
        });
        
        if (healthResponse.ok) {
          return { type: 'localai', modelInfo: { name: 'LocalAI' } };
        }
      } catch {
        try {
          const modelsResponse = await fetch(`${baseUrl}/v1/models`, {
            method: 'GET',
            signal: AbortSignal.timeout(timeout)
          });
          
          if (modelsResponse.ok) {
            try {
              const data = await modelsResponse.json();
              return {
                type: 'localai',
                modelInfo: {
                  name: 'LocalAI',
                  models: data.data?.map((m: OpenAIModelMeta) => m.id) || []
                }
              };
            } catch {
              return { type: 'localai' };
            }
          }
        } catch {
          // Continue
        }
      }
    }

    if ([3000, 5000, 8000].includes(port)) {
      try {
        const response = await fetch(`${baseUrl}/v1/models`, {
          method: 'GET',
          signal: AbortSignal.timeout(timeout)
        });
        
        if (response.ok) {
          try {
            const data = await response.json();
            // Try to detect specific services
            let serviceName = 'OpenAI-Compatible API';
            
            // Check headers and response data for service identification
            const serverHeader = response.headers.get('server') || '';
            if (serverHeader.includes('openrouter') || baseUrl.includes('openrouter')) {
              serviceName = 'OpenRouter';
            } else if (serverHeader.includes('together') || baseUrl.includes('together')) {
              serviceName = 'Together AI';
            } else if (data.data?.some((m: OpenAIModelMeta) => m.owned_by?.includes('anthropic'))) {
              serviceName = 'Anthropic API';
            }
            
            return {
              type: 'openai-compatible',
              modelInfo: {
                name: serviceName,
                models: data.data?.map((m: OpenAIModelMeta) => m.id) || []
              }
            };
          } catch {
            return { 
              type: 'openai-compatible',
              modelInfo: { name: 'OpenAI-Compatible API' }
            };
          }
        }
      } catch {
        // Continue
      }
    }

    for (const [serviceType, endpoints] of Object.entries(this.TEST_ENDPOINTS)) {
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${baseUrl}${endpoint}`, {
            method: 'GET',
            signal: AbortSignal.timeout(1000)
          });
          
          if (response.ok) {
            return { 
              type: serviceType as NetworkDevice['service'],
              modelInfo: { name: serviceType === 'openai-compatible' ? 'OpenAI-Compatible API' : serviceType }
            };
          }
        } catch {
          // Continue
        }
      }
    }

    return null;
  }

  static getServiceDisplayName(device: NetworkDevice): string {
    // Use specific name from modelInfo if available
    if (device.modelInfo?.name) {
      return device.modelInfo.name;
    }
    
    // Fallback to service type
    switch (device.service) {
      case 'openai-compatible':
        // Try to detect specific services by port
        if (device.port === 1234) return 'LM Studio';
        if (device.port === 3000) return 'OpenAI-Compatible API';
        return 'OpenAI-Compatible API';
      case 'localai':
        return 'LocalAI';
      case 'ollama':
        return 'Ollama';
      default:
        return 'AI Service';
    }
  }

  static getApiEndpoint(device: NetworkDevice): string {
    const baseUrl = `http://${device.ip}:${device.port}`;
    
    switch (device.service) {
      case 'openai-compatible':
        return `${baseUrl}/v1/chat/completions`;
      case 'localai':
        return `${baseUrl}/v1/chat/completions`;
      case 'ollama':
        return `${baseUrl}/api/chat`;
      default:
        return `${baseUrl}/v1/chat/completions`;
    }
  }
}
