const { connect } = require('./nuki.mqtt.connect');
const { disconnect } = require('./nuki.mqtt.disconnect');
const { scan } = require('./nuki.mqtt.scan');
const { getDiscoveredDevices } = require('./nuki.mqtt.getDiscoveredDevices');
const { setValue } = require('./nuki.mqtt.setValue');
const { handleMessage } = require('./nuki.mqtt.handleMessage');
const { convertToDevice } = require('./nuki.mqtt.convertToDevice');
const { subscribeDeviceTopic } = require('./nuki.mqtt.subscribeDeviceTopic');

/**
 * @description Add ability to connect to Nuki MQTT devices.
 * @param {object} nukiHandler - Nuki instance.
 * @example
 * const nukiMQTTHandler = new NukiMQTTHandler(nukiHandler);
 */
const NukiMQTTHandler = function NukiMQTTHandler(nukiHandler) {
  this.nukiHandler = nukiHandler;
  // Gladys MQTT service
  this.mqttService = this.nukiHandler.gladys.service.getService('mqtt');
  // Found devices
  this.discoveredDevices = {};
  // Scan timeout handle
  this.scanTimeout = null;
  // Discovery window duration in ms (can be overridden in tests)
  this.scanTimeoutMs = 60 * 1000; // 1 minute
};

// Commons
NukiMQTTHandler.prototype.connect = connect;
NukiMQTTHandler.prototype.disconnect = disconnect;
NukiMQTTHandler.prototype.scan = scan;
NukiMQTTHandler.prototype.getDiscoveredDevices = getDiscoveredDevices;
NukiMQTTHandler.prototype.setValue = setValue;

// MQTT
NukiMQTTHandler.prototype.handleMessage = handleMessage;
NukiMQTTHandler.prototype.convertToDevice = convertToDevice;
NukiMQTTHandler.prototype.subscribeDeviceTopic = subscribeDeviceTopic;

module.exports = NukiMQTTHandler;
