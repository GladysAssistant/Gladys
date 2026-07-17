const { send } = require('./message.send');

/**
 * @description Add ability to send Free Mobile SMS.
 * @param {object} gladys - Gladys instance.
 * @param {object} axios - Axios instance.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const messageHandler = new MessageHandler(gladys, axios, serviceId);
 */
const MessageHandler = function MessageHandler(gladys, axios, serviceId) {
  this.gladys = gladys;
  this.axios = axios;
  this.serviceId = serviceId;
};

MessageHandler.prototype.send = send;

module.exports = MessageHandler;
