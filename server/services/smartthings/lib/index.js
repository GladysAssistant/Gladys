const { checkClient } = require('./smartthings.checkClient');
const { discoveryRequest } = require('./connector/discoveryRequest');
const { stateRefreshRequest } = require('./connector/stateRefreshRequest');

/**
 * @description Add ability to connect to SmartThings.
 * @param {Object} gladys - Gladys instance.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const smartThingsHandler = new SmartThingsHandler(gladys, ffmpeg, serviceId);
 */
const SmartThingsHandler = function SmartThingsHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
};

SmartThingsHandler.prototype.checkClient = checkClient;
SmartThingsHandler.prototype.discoveryRequest = discoveryRequest;
SmartThingsHandler.prototype.stateRefreshRequest = stateRefreshRequest;

module.exports = SmartThingsHandler;
