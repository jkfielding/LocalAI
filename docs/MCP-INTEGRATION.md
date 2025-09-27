# Model Context Protocol (MCP) Integration

LocalAI Chat now includes basic support for Model Context Protocol (MCP) servers, allowing you to extend your AI's capabilities with external tools and data sources.

## What is MCP?

Model Context Protocol is an open standard that enables AI applications to connect to external systems, tools and data sources. Think of it as "plugins" for your AI assistant.

## Current Implementation Status

**✅ Implemented:**
- MCP server configuration UI in settings
- Basic HTTP-based MCP server connection
- Server management (add/remove/enable/disable)
- Tool discovery from MCP servers

**⚠️ Limited Support:**
- Browser-based implementation (stdio/WebSocket servers not supported)
- Requires LM Studio to support function calling for full functionality
- Currently displays available tools but cannot execute them directly

## How to Use

### 1. Enable MCP
1. Open Settings (⚙️ icon)
2. Find "Model Context Protocol (MCP)" section
3. Toggle the switch to enable MCP

### 2. Add MCP Servers
1. In the MCP section, fill out the server details:
   - **Server Name**: A friendly name (e.g., "Weather Tools")
   - **Server URL**: HTTP endpoint of your MCP server (e.g., `http://localhost:3001`)
   - **Description**: Optional description of what the server provides

2. Click "Add Server" to add it to your configuration

### 3. Available Server Types
- **HTTP**: Web-based MCP servers with REST API endpoints
- **WebSocket**: Real-time MCP servers (not yet supported in browser)
- **Stdio**: Command-line MCP servers (not supported in browser)

## Example MCP Servers

Here are some example MCP servers you could connect to:

### Weather Service
```
Name: Weather Tools
URL: http://localhost:3001
Description: Get current weather and forecasts
```

### File System
```
Name: File Tools  
URL: http://localhost:3002
Description: Read and write local files
```

### Database Access
```
Name: Database Tools
URL: http://localhost:3003  
Description: Query and update database records
```

## Technical Limitations

### Browser Constraints
- Cannot connect to stdio-based MCP servers (command-line tools)
- WebSocket connections require proper CORS configuration
- Limited to HTTP-based servers for maximum compatibility

### LM Studio Integration
- LM Studio doesn't natively support OpenAI function calling format
- Tools are discovered but cannot be automatically invoked
- Manual tool execution would be required

## Future Enhancements

### Planned Features
1. **Tool Execution**: Direct tool calling when LM Studio supports it
2. **WebSocket Support**: Real-time MCP server connections
3. **Tool Results Integration**: Seamless incorporation of tool outputs
4. **Server Templates**: Pre-configured popular MCP servers
5. **Connection Testing**: Verify server connectivity and capabilities

### Advanced Integration
When LM Studio adds function calling support:
- Automatic tool discovery and registration
- Seamless tool execution during conversations  
- Tool result integration into chat responses
- Error handling for failed tool calls

## Creating Your Own MCP Server

To create a simple HTTP-based MCP server:

```javascript
// server.js
const express = require('express');
const app = express();

app.use(express.json());

// Capability discovery
app.get('/capabilities', (req, res) => {
  res.json({
    tools: [
      {
        name: 'get_time',
        description: 'Get the current time',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      }
    ]
  });
});

// Tool execution
app.post('/tools/get_time/call', (req, res) => {
  res.json({
    content: `Current time: ${new Date().toLocaleTimeString()}`
  });
});

app.listen(3001, () => {
  console.log('MCP server running on http://localhost:3001');
});
```

## Best Practices

### Security
- Only connect to trusted MCP servers
- Use HTTPS when possible
- Validate server certificates
- Be cautious with servers that access sensitive data

### Performance  
- Monitor connection status in settings
- Disable servers that frequently fail
- Use local servers when possible for better performance
- Consider server load and rate limits

### Organization
- Use descriptive server names and descriptions
- Group related servers together
- Regularly review and clean up unused servers
- Document your server configurations

## Troubleshooting

### Server Connection Issues
- Verify the server URL is correct and accessible
- Check that the server supports HTTP requests
- Ensure CORS is properly configured on the server
- Test server connectivity outside the application

### Tool Discovery Problems
- Confirm the server implements `/capabilities` endpoint
- Check server response format matches MCP specification
- Review browser developer console for error messages
- Verify server is running and responsive

This MCP integration provides the foundation for powerful AI extensions. As the ecosystem grows and LM Studio adds function calling support, these features will become even more powerful!