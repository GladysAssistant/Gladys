const { init } = require('./init');
const { connect } = require('./connect');
const { getConfiguration } = require('./getConfiguration');
const { saveConfiguration } = require('./saveConfiguration');
const { disconnect } = require('./disconnect');
const { handleMqttMessage } = require('./handleMqttMessage');
const { getDiscoveredDevices } = require('./getDiscoveredDevices');
const { findMatchingExpose } = require('./findMatchingExpose');
const { readValue } = require('./readValue');
const { setValue } = require('./setValue');
const { status } = require('./status');
const { isEnabled } = require('./isEnabled');
const { subscribe } = require('./subscribe');
const { installMqttContainer } = require('./installMqttContainer');
const { installZ2mContainer } = require('./installZ2mContainer');
const { setPermitJoin } = require('./setPermitJoin');
const { getPermitJoin } = require('./getPermitJoin');

/**
 * @description Add ability to connect to Zigbee2mqtt devices.
 * @param {Object} gladys - Gladys instance.
 * @param {Object} mqttLibrary - MQTT lib.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const zigbee2mqttManager = new Zigbee2mqttManager(gladys, mqttLibrary, serviceId);
 */
const Zigbee2mqttManager = function Zigbee2mqttManager(gladys, mqttLibrary, serviceId) {
  this.gladys = gladys;
  this.mqttLibrary = mqttLibrary;
  this.serviceId = serviceId;
  this.mqttClient = null;

  this.discoveredDevices = {};
  this.topicBinds = {};
  this.usbConfigured = false;
  this.mqttExist = false;
  this.mqttRunning = false;
  this.mqttContainerRunning = false;
  this.zigbee2mqttExist = false;
  this.zigbee2mqttRunning = false;
  this.gladysConnected = false;
  this.zigbee2mqttConnected = false;
  this.z2mPermitJoin = false;
  this.networkModeValid = true;
  this.dockerBased = true;
};

Zigbee2mqttManager.prototype.init = init;
Zigbee2mqttManager.prototype.connect = connect;
Zigbee2mqttManager.prototype.getConfiguration = getConfiguration;
Zigbee2mqttManager.prototype.saveConfiguration = saveConfiguration;
Zigbee2mqttManager.prototype.disconnect = disconnect;
Zigbee2mqttManager.prototype.handleMqttMessage = handleMqttMessage;
Zigbee2mqttManager.prototype.getDiscoveredDevices = getDiscoveredDevices;
Zigbee2mqttManager.prototype.findMatchingExpose = findMatchingExpose;
Zigbee2mqttManager.prototype.readValue = readValue;
Zigbee2mqttManager.prototype.setValue = setValue;
Zigbee2mqttManager.prototype.status = status;
Zigbee2mqttManager.prototype.isEnabled = isEnabled;
Zigbee2mqttManager.prototype.subscribe = subscribe;
Zigbee2mqttManager.prototype.installMqttContainer = installMqttContainer;
Zigbee2mqttManager.prototype.installZ2mContainer = installZ2mContainer;
Zigbee2mqttManager.prototype.setPermitJoin = setPermitJoin;
Zigbee2mqttManager.prototype.getPermitJoin = getPermitJoin;

module.exports = Zigbee2mqttManager;
