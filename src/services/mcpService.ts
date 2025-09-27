import type { MCPServer, MCPTool, MCPServerCapabilities } from '../types';

export class MCPService {
  private servers: Map<string, MCPServer> = new Map();
  private tools: Map<string, MCPTool[]> = new Map();

  constructor(servers: MCPServer[] = []) {
    servers.forEach(server => this.addServer(server));
  }

  addServer(server: MCPServer) {
    this.servers.set(server.id, server);
    if (server.enabled) {
      this.connectToServer(server);
    }
  }

  removeServer(serverId: string) {
    this.servers.delete(serverId);
    this.tools.delete(serverId);
  }

  getServers(): MCPServer[] {
    return Array.from(this.servers.values());
  }

  getAllAvailableTools(): MCPTool[] {
    const allTools: MCPTool[] = [];
    for (const tools of this.tools.values()) {
      allTools.push(...tools);
    }
    return allTools;
  }

  async connectToServer(server: MCPServer): Promise<boolean> {
    if (!server.enabled) return false;

    try {
      // For HTTP-based MCP servers
      if (server.type === 'http') {
        const capabilities = await this.fetchServerCapabilities(server);
        if (capabilities?.tools) {
          this.tools.set(server.id, capabilities.tools);
        }
        return true;
      }

      // For WebSocket-based MCP servers (if supported)
      if (server.type === 'websocket') {
        // WebSocket implementation would go here
        // This is more complex in a browser environment
        console.warn('WebSocket MCP servers not yet supported in browser');
        return false;
      }

      // stdio is not possible in browser environment
      if (server.type === 'stdio') {
        console.warn('Stdio MCP servers cannot be used in browser');
        return false;
      }

      return false;
    } catch (error) {
      console.error(`Failed to connect to MCP server ${server.name}:`, error);
      return false;
    }
  }

  private async fetchServerCapabilities(server: MCPServer): Promise<MCPServerCapabilities | null> {
    try {
      // Standard MCP capability discovery
      const response = await fetch(`${server.url}/capabilities`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching capabilities from ${server.name}:`, error);
      return null;
    }
  }

  async callTool(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    // Find which server has this tool
    const serverEntry = Array.from(this.tools.entries()).find(([, tools]) =>
      tools.some(tool => tool.name === toolName)
    );

    if (!serverEntry) {
      throw new Error(`Tool '${toolName}' not found in any connected MCP server`);
    }

    const [serverId] = serverEntry;
    const server = this.servers.get(serverId);

    if (!server) {
      throw new Error(`Server for tool '${toolName}' not found`);
    }

    try {
      // Call the tool on the MCP server
      const response = await fetch(`${server.url}/tools/${toolName}/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ args }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`Error calling tool ${toolName} on server ${server.name}:`, error);
      throw error;
    }
  }

  // Convert MCP tools to OpenAI function format for LLM consumption
  getToolsForLLM(): Array<{type: string; function: {name: string; description: string; parameters: Record<string, unknown>}}> {
    const allTools = this.getAllAvailableTools();
    
    return allTools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema
      }
    }));
  }

  // Check if a function call is an MCP tool
  isMCPTool(functionName: string): boolean {
    const allTools = this.getAllAvailableTools();
    return allTools.some(tool => tool.name === functionName);
  }

  async refreshAllConnections(): Promise<void> {
    const connectionPromises = Array.from(this.servers.values())
      .filter(server => server.enabled)
      .map(server => this.connectToServer(server));

    await Promise.allSettled(connectionPromises);
  }

  // Get connection status for all servers
  getConnectionStatus(): { [serverId: string]: boolean } {
    const status: { [serverId: string]: boolean } = {};
    for (const [serverId, server] of this.servers) {
      status[serverId] = server.enabled && this.tools.has(serverId);
    }
    return status;
  }
}