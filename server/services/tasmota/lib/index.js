const { connect } = require('./connect');
const { disconnect } = require('./disconnect');
const { handleMqttMessage } = require('./handleMqttMessage');
const { getMqttDiscoveredDevices } = require('./getMqttDiscoveredDevices');
const { getHttpDiscoveredDevices } = require('./getHttpDiscoveredDevices');
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
  // MQTT
  this.mqttService = null;
  this.mqttDevices = {};
  this.pendingMqttDevices = {};
  // HTTP
  this.httpDevices = {};
};

TasmotaHandler.prototype.connect = connect;
TasmotaHandler.prototype.disconnect = disconnect;
TasmotaHandler.prototype.handleMqttMessage = handleMqttMessage;
TasmotaHandler.prototype.getMqttDiscoveredDevices = getMqttDiscoveredDevices;
TasmotaHandler.prototype.getHttpDiscoveredDevices = getHttpDiscoveredDevices;
TasmotaHandler.prototype.setValue = setValue;
TasmotaHandler.prototype.forceScan = forceScan;
TasmotaHandler.prototype.mergeWithExistingDevice = mergeWithExistingDevice;
TasmotaHandler.prototype.notifyNewDevice = notifyNewDevice;

module.exports = TasmotaHandler;
