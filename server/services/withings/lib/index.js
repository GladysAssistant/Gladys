// COMMANDS
const { init } = require('./withings.init');
const { deleteVar } = require('./withings.deleteVar');
const { deleteDevices } = require('./withings.deleteDevices');
const { poll } = require('./withings.poll');
const { postCreate } = require('./withings.postCreate');
const { getDevices } = require('./utils/withings.getDevices');
const { getMeasures } = require('./utils/withings.getMeasures');

/**
 * @param {Object} gladys - The gladys object.
 * @param {string} serviceId - Identification of the service.
 * @description Create all device if not exist by listening
 * @example
 * const withingsHandler = WithingsHandler(gladys, serviceId)
 */
const WithingsHandler = function WithingsHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.withingsUrl = 'https://wbsapi.withings.net';
  this.integrationName = 'withings';
};

// COMMANDS
WithingsHandler.prototype.init = init;
WithingsHandler.prototype.deleteVar = deleteVar;
WithingsHandler.prototype.deleteDevices = deleteDevices;
WithingsHandler.prototype.poll = poll;
WithingsHandler.prototype.postCreate = postCreate;
WithingsHandler.prototype.getDevices = getDevices;
WithingsHandler.prototype.getMeasures = getMeasures;

module.exports = WithingsHandler;
