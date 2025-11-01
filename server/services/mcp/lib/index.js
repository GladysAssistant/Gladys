const { createServer } = require('./createServer');
const { getAllResources, getAllTools } = require('./buildSchemas');
const { formatValue } = require('./formatValue');
const { proxy } = require('./mcp.proxy');
const { isSensorFeature, isSwitchableFeature } = require('./selectFeature');
const { findBySimilarity } = require('./findBySimilarity');
const { eventFunctionWrapper } = require('../../../utils/functionsWrapper');
const { EVENTS } = require('../../../utils/constants');

/**
 * @description Add ability to connect to MCP.
 * @param {object} gladys - Gladys instance.
 * @param {string} serviceId - UUID of the service in DB.
 * @param {object} mcp - MCP library.
 * @param {object} levenshtein - Levenshtein library.
 * @example
 * const mcpHandler = new MCPHandler(gladys, serviceId, mcp);
 */
const MCPHandler = function MCPHandler(gladys, serviceId, mcp, levenshtein) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.mcp = mcp;
  this.levenshtein = levenshtein;
  this.server = null;
  this.transports = {};

  this.gladys.event.on(EVENTS.DEVICE.CREATE, eventFunctionWrapper(this.createServer.bind(this)));
  this.gladys.event.on(EVENTS.DEVICE.UPDATE, eventFunctionWrapper(this.createServer.bind(this)));
};

MCPHandler.prototype.createServer = createServer;
MCPHandler.prototype.getAllResources = getAllResources;
MCPHandler.prototype.getAllTools = getAllTools;
MCPHandler.prototype.isSensorFeature = isSensorFeature;
MCPHandler.prototype.isSwitchableFeature = isSwitchableFeature;
MCPHandler.prototype.findBySimilarity = findBySimilarity;
MCPHandler.prototype.formatValue = formatValue;
MCPHandler.prototype.proxy = proxy;

module.exports = MCPHandler;
