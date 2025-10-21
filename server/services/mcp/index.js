const logger = require('../../utils/logger');
const MCPHandler = require('./lib');
const MCPController = require('./api/mcp.controller');

module.exports = function MCPService(gladys, serviceId) {
  const mcp = require('@modelcontextprotocol/sdk/server/mcp.js');

  const mcpHandler = new MCPHandler(gladys, serviceId, mcp);

  /**
   * @public
   * @description This function starts the MCP service and expose devices.
   * @returns {Promise} Empty promise once service is started.
   * @example
   * gladys.services.mcp.start();
   */
  async function start() {
    logger.info('Starting MCP service');

    await mcpHandler.createServer();
  }

  /**
   * @public
   * @description This function stops the MCP service.
   * @example
   * gladys.services.mcp.stop();
   */
  async function stop() {
    logger.info('Stopping MCP service');
  }

  return Object.freeze({
    start,
    stop,
    controllers: MCPController(mcpHandler),
    mcpHandler,
  });
};
