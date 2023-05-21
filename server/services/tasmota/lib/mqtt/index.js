const { connect } = require('./tasmota.mqtt.connect');
const { disconnect } = require('./tasmota.mqtt.disconnect');
const { scan } = require('./tasmota.mqtt.scan');
const { getDiscoveredDevices } = require('./tasmota.mqtt.getDiscoveredDevices');
const { setValue } = require('./tasmota.mqtt.setValue');
const { handleMessage } = require('./tasmota.mqtt.handleMessage');
const { status } = require('./tasmota.mqtt.status');
const { subStatus } = require('./tasmota.mqtt.subStatus');

/**
 * @description Add ability to connect to Tasmota MQTT devices.
 * @param {object} tasmotaHandler - Tasmota instance.
 * @example
 * const tasmotaHandler = new TasmotaHandler(tasmotaHandler);
 */
const TasmotaMQTTHandler = function TasmotaMQTTHandler(tasmotaHandler) {
  this.tasmotaHandler = tasmotaHandler;
  // Gladys MQTT service
  this.mqttService = null;
  // Found devices
  this.discoveredDevices = {};
  this.pendingDevices = {};
};

// Commons
TasmotaMQTTHandler.prototype.connect = connect;
TasmotaMQTTHandler.prototype.disconnect = disconnect;
TasmotaMQTTHandler.prototype.scan = scan;
TasmotaMQTTHandler.prototype.getDiscoveredDevices = getDiscoveredDevices;
TasmotaMQTTHandler.prototype.setValue = setValue;

// MQTT
TasmotaMQTTHandler.prototype.handleMessage = handleMessage;
TasmotaMQTTHandler.prototype.status = status;
TasmotaMQTTHandler.prototype.subStatus = subStatus;

module.exports = TasmotaMQTTHandler;
