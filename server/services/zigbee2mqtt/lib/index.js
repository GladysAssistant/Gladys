<<<<<<< HEAD
const { init } = require('./init');
const { connect } = require('./connect');
const { getConfiguration } = require('./getConfiguration');
=======
const { connect } = require('./connect');
>>>>>>> Zigbee2mqtt : Server integration
const { disconnect } = require('./disconnect');
const { handleMqttMessage } = require('./handleMqttMessage');
const { discoverDevices } = require('./discoverDevices');
const { setValue } = require('./setValue');
const { status } = require('./status');
const { subscribe } = require('./subscribe');
<<<<<<< HEAD
const { installMqttContainer } = require('./installMqttContainer');
const { installZ2mContainer } = require('./installZ2mContainer');
const { setPermitJoin } = require('./setPermitJoin');
const { getPermitJoin } = require('./getPermitJoin');
const { getHostIP } = require('./getHostIP');
=======
>>>>>>> Zigbee2mqtt : Server integration

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
  this.mqttContainerPresent = false;
  this.z2mContainerPresent = false;
  this.mqttContainerRunning = false;
  this.z2mContainerRunning = false;
  this.mqttConnected = false;
  this.z2mConnected = false;
  this.z2mPermitJoin = false;
};

Zigbee2mqttManager.prototype.init = init;
Zigbee2mqttManager.prototype.connect = connect;
Zigbee2mqttManager.prototype.getConfiguration = getConfiguration;
Zigbee2mqttManager.prototype.disconnect = disconnect;
Zigbee2mqttManager.prototype.handleMqttMessage = handleMqttMessage;
Zigbee2mqttManager.prototype.discoverDevices = discoverDevices;
Zigbee2mqttManager.prototype.setValue = setValue;
Zigbee2mqttManager.prototype.status = status;
Zigbee2mqttManager.prototype.subscribe = subscribe;
Zigbee2mqttManager.prototype.installMqttContainer = installMqttContainer;
Zigbee2mqttManager.prototype.installZ2mContainer = installZ2mContainer;
Zigbee2mqttManager.prototype.setPermitJoin = setPermitJoin;
Zigbee2mqttManager.prototype.getPermitJoin = getPermitJoin;
Zigbee2mqttManager.prototype.getHostIP = getHostIP;

module.exports = Zigbee2mqttManager;
