const { createServer } = require('./createServer');
const { getAllTools } = require('./getAllTools');

/**
 * @description Add ability to connect to MCP.
 * @param {object} gladys - Gladys instance.
 * @param {string} serviceId - UUID of the service in DB.
 * @param {object} mcp - MCP library.
 * @example
 * const mcpHandler = new MCPHandler(gladys, serviceId, mcp);
 */
const MCPHandler = function MCPHandler(gladys, serviceId, mcp) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.mcp = mcp;
  this.server = null;
};

MCPHandler.prototype.createServer = createServer;
MCPHandler.prototype.getAllTools = getAllTools;

module.exports = MCPHandler;
