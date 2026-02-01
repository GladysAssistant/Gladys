const { EVENTS } = require('../../../utils/constants');

/**
 * @description Create MCP server.
 * @returns {Promise} MCP server to expose.
 * @example
 * createServer()
 */
async function createServer() {
  if (!this.server) {
    this.gladys.event.on(EVENTS.DEVICE.CREATE, this.reloadCb);
    this.gladys.event.on(EVENTS.DEVICE.UPDATE, this.reloadCb);
  }

  if (this.server) {
    await this.server.close();
  }

  this.server = new this.mcp.McpServer(
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

  (await this.getAllResources()).map(({ name, uri, config, cb }) => {
    return this.server.registerResource(name, uri, config, cb);
  });
  (await this.getAllTools()).map(({ intent, config, cb }) => {
    return this.server.registerTool(intent.replace('.', '_'), config, cb);
  });
}

module.exports = {
  createServer,
};
