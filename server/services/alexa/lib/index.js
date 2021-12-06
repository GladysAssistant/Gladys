const { onDiscovery } = require('./alexa.onDiscovery');

/**
 * @description Add ability to connect to Alexa.
 * @param {Object} gladys - Gladys instance.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const alexaHandler = new AlexaHandler(gladys, serviceId);
 */
const AlexaHandler = function AlexaHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
};

AlexaHandler.prototype.onDiscovery = onDiscovery;

module.exports = AlexaHandler;
