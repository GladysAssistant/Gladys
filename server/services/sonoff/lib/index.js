const { connect } = require('./connect');
const { disconnect } = require('./disconnect');
const { handleMqttMessage } = require('./handleMqttMessage');
const { getDiscoveredDevices } = require('./getDiscoveredDevices');
const { setValue } = require('./setValue');

/**
 * @description Add ability to connect to Sonoff devices.
 * @param {Object} gladys - Gladys instance.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const sonoffHandler = new SonoffHandler(gladys, serviceId);
 */
const SonoffHandler = function SonoffHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.mqttService = null;
  this.mqttDevices = {};
};

SonoffHandler.prototype.connect = connect;
SonoffHandler.prototype.disconnect = disconnect;
SonoffHandler.prototype.handleMqttMessage = handleMqttMessage;
SonoffHandler.prototype.getDiscoveredDevices = getDiscoveredDevices;
SonoffHandler.prototype.setValue = setValue;

module.exports = SonoffHandler;
