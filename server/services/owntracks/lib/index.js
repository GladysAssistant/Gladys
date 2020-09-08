const { connect } = require('./connect');
const { disconnect } = require('./disconnect');
const { handleMqttMessage } = require('./handleMqttMessage');

/**
 * @description Add ability to connect to Tasmota devices.
 * @param {Object} gladys - Gladys instance.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const tasmotaHandler = new TasmotaHandler(gladys, serviceId);
 */
const OwntracksHandler = function OwntracksHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.mqttService = null;
};

OwntracksHandler.prototype.connect = connect;
OwntracksHandler.prototype.disconnect = disconnect;
OwntracksHandler.prototype.handleMqttMessage = handleMqttMessage;


module.exports = OwntracksHandler;
