const { onDiscovery } = require('./alexa.onDiscovery');
const { onExecute } = require('./alexa.onExecute');
const { onReportState } = require('./alexa.onReportState');

/**
 * @description Add ability to connect to Alexa.
 * @param {object} gladys - Gladys instance.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const alexaHandler = new AlexaHandler(gladys, serviceId);
 */
const AlexaHandler = function AlexaHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
};

AlexaHandler.prototype.onDiscovery = onDiscovery;
AlexaHandler.prototype.onExecute = onExecute;
AlexaHandler.prototype.onReportState = onReportState;

module.exports = AlexaHandler;
