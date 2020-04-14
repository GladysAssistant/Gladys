const { init } = require('./init.js');
const { connect } = require('./connect');
const { disconnect } = require('./disconnect');
const { handleNewMessage } = require('./handleNewMessage');
const { handleGladysMessage } = require('./handler/handleGladysMessage');
const { publish } = require('./publish');
const { subscribe } = require('./subscribe');
const { unsubscribe } = require('./unsubscribe');
const { status } = require('./status');
const { getConfiguration } = require('./getConfiguration');
const { setValue } = require('./setValue');

/**
 * @description Add ability to connect to a MQTT broker.
 * @param {Object} gladys - Gladys instance.
 * @param {Object} mqttLibrary - MQTT lib.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const mqttHandler = new MqttHandler(gladys, client, serviceId);
 */
const MqttHandler = function MqttHandler(gladys, mqttLibrary, serviceId) {
  this.gladys = gladys;
  this.mqttLibrary = mqttLibrary;
  this.serviceId = serviceId;
  this.mqttClient = null;

  this.topicBinds = {};
  this.configured = false;
  this.connected = false;
};

MqttHandler.prototype.init = init;
MqttHandler.prototype.connect = connect;
MqttHandler.prototype.disconnect = disconnect;
MqttHandler.prototype.handleNewMessage = handleNewMessage;
MqttHandler.prototype.handleGladysMessage = handleGladysMessage;
MqttHandler.prototype.publish = publish;
MqttHandler.prototype.subscribe = subscribe;
MqttHandler.prototype.unsubscribe = unsubscribe;
MqttHandler.prototype.status = status;
MqttHandler.prototype.getConfiguration = getConfiguration;
MqttHandler.prototype.setValue = setValue;

module.exports = MqttHandler;
