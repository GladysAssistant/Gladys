const { connect } = require('./connect');
const { disconnect } = require('./disconnect');
const { handleMqttMessage } = require('./handleMqttMessage');
const { getDiscoveredDevices } = require('./getDiscoveredDevices');
const { setValue } = require('./setValue');
const { forceScan } = require('./forceScan');
const { mergeWithExistingDevice } = require('./mergeWithExistingDevice');
const { notifyNewDevice } = require('./notifyNewDevice');

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
  this.pendingMqttDevices = {};
};

TasmotaHandler.prototype.connect = connect;
TasmotaHandler.prototype.disconnect = disconnect;
TasmotaHandler.prototype.handleMqttMessage = handleMqttMessage;
TasmotaHandler.prototype.getDiscoveredDevices = getDiscoveredDevices;
TasmotaHandler.prototype.setValue = setValue;
TasmotaHandler.prototype.forceScan = forceScan;
TasmotaHandler.prototype.mergeWithExistingDevice = mergeWithExistingDevice;
TasmotaHandler.prototype.notifyNewDevice = notifyNewDevice;

module.exports = TasmotaHandler;
