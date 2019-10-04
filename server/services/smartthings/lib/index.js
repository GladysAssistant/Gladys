const { init } = require('./internal/init');
const { createConnector } = require('./internal/createConnector');
const { checkClient } = require('./internal/checkClient');
const { discoveryHandler } = require('./connector/discoveryHandler');
const { stateRefreshHandler } = require('./connector/stateRefreshHandler');
const { commandHandler } = require('./connector/commandHandler');
const { callbackAccessHandler } = require('./connector/callbackAccessHandler');
const { integrationDeletedHandler } = require('./connector/integrationDeletedHandler');
const { handleHttpCallback } = require('./connector/handleHttpCallback');
const { getDevices } = require('./connector/getDevices');

/**
 * @description Add ability to connect to Samsung SmartThings.
 * @param {Object} gladys - Gladys instance.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const smartThingsHandler = new SmartThingsHandler(gladys, ffmpeg, serviceId);
 */
const SmartThingsHandler = function SmartThingsHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.connector = null;
};

// Internal
SmartThingsHandler.prototype.init = init;
SmartThingsHandler.prototype.createConnector = createConnector;
SmartThingsHandler.prototype.checkClient = checkClient;
// SmartThings connector
SmartThingsHandler.prototype.discoveryHandler = discoveryHandler;
SmartThingsHandler.prototype.stateRefreshHandler = stateRefreshHandler;
SmartThingsHandler.prototype.commandHandler = commandHandler;
SmartThingsHandler.prototype.callbackAccessHandler = callbackAccessHandler;
SmartThingsHandler.prototype.integrationDeletedHandler = integrationDeletedHandler;
SmartThingsHandler.prototype.handleHttpCallback = handleHttpCallback;
SmartThingsHandler.prototype.getDevices = getDevices;

module.exports = SmartThingsHandler;
