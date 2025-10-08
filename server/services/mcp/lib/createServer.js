const mcpLocal = require('@modelcontextprotocol/sdk/server/mcp.js');

/**
 * @description Create MCP server.
 * @returns {Promise} MCP server to expose.
 * @example
 * createServer()
 */
async function createServer() {
  const mcpServer = new mcpLocal.McpServer(
    {
      name: 'Gladys',
      title: 'Gladys',
      version: '1.0.O',
    },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
    },
  );

  (await this.getAllResources()).map(({name, uri, config, cb}) => {
    return mcpServer.registerResource(name, uri, config, cb);
  });
  (await this.getAllTools()).map(({ intent, config, cb }) => {
    return mcpServer.registerTool(intent.replace('.', '_'), config, cb);
  });

  this.server = mcpServer;
}

module.exports = {
  createServer,
};
