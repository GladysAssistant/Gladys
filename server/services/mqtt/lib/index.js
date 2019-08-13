const { init } = require('./init.js');
const { connect } = require('./connect');
const { disconnect } = require('./disconnect');
const { handleNewMessage } = require('./handleNewMessage');
const { handleGladysMessage } = require('./handler/handleGladysMessage');
const { publish } = require('./publish');
const { subscribe } = require('./subscribe');
const { unsubscribe } = require('./unsubscribe');

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
};

MqttHandler.prototype.init = init;
MqttHandler.prototype.connect = connect;
MqttHandler.prototype.disconnect = disconnect;
MqttHandler.prototype.handleNewMessage = handleNewMessage;
MqttHandler.prototype.handleGladysMessage = handleGladysMessage;
MqttHandler.prototype.publish = publish;
MqttHandler.prototype.subscribe = subscribe;
MqttHandler.prototype.unsubscribe = unsubscribe;

module.exports = MqttHandler;
