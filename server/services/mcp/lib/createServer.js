const { toolNameFromIntent } = require('./mcpToolsToChatApiFormat');

/**
 * @description Create an MCP server exposing the loaded resources and tools.
 * An MCP server can only be connected to one transport (GHSA-345p-7cg4-v4c7), so a new one is created per request.
 * @returns {object} MCP server to connect to a transport.
 * @example
 * const server = createServer();
 */
function createServer() {
  const server = new this.mcp.McpServer(
    {
      name: 'Gladys',
      title: 'Gladys',
      version: '1.0.0',
    },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
    },
  );

  this.schemas.resources.forEach(({ name, uri, config, cb }) => {
    server.registerResource(name, uri, config, cb);
  });
  this.schemas.tools.forEach(({ intent, config, cb }) => {
    server.registerTool(toolNameFromIntent(intent), config, cb);
  });

  return server;
}

module.exports = {
  createServer,
};
