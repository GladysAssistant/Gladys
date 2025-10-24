const { createServer } = require('./createServer');
const { getAllResources, getAllTools } = require('./buildSchemas');
const { formatValue } = require('./formatValue');
const { proxy } = require('./mcp.proxy');

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
  this.transports = {};
};

MCPHandler.prototype.createServer = createServer;
MCPHandler.prototype.getAllResources = getAllResources;
MCPHandler.prototype.getAllTools = getAllTools;
MCPHandler.prototype.formatValue = formatValue;
MCPHandler.prototype.proxy = proxy;

module.exports = MCPHandler;
