const { connect } = require('./connect');
const { disconnect } = require('./disconnect');
const { handleMqttMessage } = require('./handleMqttMessage');
const { getDiscoveredDevices } = require('./getDiscoveredDevices');
const { setValue } = require('./setValue');

/**
 * @description Add ability to connect to Tasmota devices.
 * @param {Object} gladys - Gladys instance.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const tasmotaHandler = new TasmotaHandler(gladys, serviceId);
 */
const TasmotaHandler = function TasmotaHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.mqttService = null;
  this.mqttDevices = {};
};

TasmotaHandler.prototype.connect = connect;
TasmotaHandler.prototype.disconnect = disconnect;
TasmotaHandler.prototype.handleMqttMessage = handleMqttMessage;
TasmotaHandler.prototype.getDiscoveredDevices = getDiscoveredDevices;
TasmotaHandler.prototype.setValue = setValue;

module.exports = TasmotaHandler;
