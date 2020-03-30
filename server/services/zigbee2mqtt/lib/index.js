const { connect } = require('./connect');
const { disconnect } = require('./disconnect');
const { handleMqttMessage } = require('./handleMqttMessage');
const { discoverDevices } = require('./discoverDevices');
const { setValue } = require('./setValue');
const { status } = require('./status');
const { subscribe } = require('./subscribe');

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
  this.mqttDevices = {};

  this.topicBinds = {};
  this.usbConfigured = false;
  this.mqttConnected = false;
};

Zigbee2mqttManager.prototype.connect = connect;
Zigbee2mqttManager.prototype.disconnect = disconnect;
Zigbee2mqttManager.prototype.handleMqttMessage = handleMqttMessage;
Zigbee2mqttManager.prototype.discoverDevices = discoverDevices;
Zigbee2mqttManager.prototype.setValue = setValue;
Zigbee2mqttManager.prototype.status = status;
Zigbee2mqttManager.prototype.subscribe = subscribe;

module.exports = Zigbee2mqttManager;
