const { connect } = require('./connect');
const { handleNewMessage } = require('./handleNewMessage');

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
};

MqttHandler.prototype.connect = connect;
MqttHandler.prototype.handleNewMessage = handleNewMessage;

module.exports = MqttHandler;
