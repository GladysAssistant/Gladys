const { connect } = require('./connect');
const { disconnect } = require('./disconnect');
const { handleMqttMessage } = require('./handleMqttMessage');
const { discoverDevices } = require('./discoverDevices');
const { setValue } = require('./setValue');
const { status } = require('./status');

/**
 * @description Add ability to connect to Zigbee2mqtt devices.
 * @param {Object} gladys - Gladys instance.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const zigbee2mqttHandler = new Zigbee2mqttHandler(gladys, serviceId);
 */
const Zigbee2mqttHandler = function Zigbee2mqttHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.mqttClient = null;
  this.mqttDevices = {};

  this.configured = false;
  this.connected = false;
};

Zigbee2mqttHandler.prototype.connect = connect;
Zigbee2mqttHandler.prototype.disconnect = disconnect;
Zigbee2mqttHandler.prototype.handleMqttMessage = handleMqttMessage;
Zigbee2mqttHandler.prototype.discoverDevices = discoverDevices;
Zigbee2mqttHandler.prototype.setValue = setValue;
Zigbee2mqttHandler.prototype.status = status;

module.exports = Zigbee2mqttHandler;
