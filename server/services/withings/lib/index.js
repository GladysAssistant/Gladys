// COMMANDS
const { init } = require('./withings.init');
const { saveVar } = require('./withings.saveVar');
const { deleteVar } = require('./withings.deleteVar');
const { deleteDevices } = require('./withings.deleteDevices');
const { getServiceId } = require('./withings.getServiceId');
const { poll } = require('./withings.poll');

/**
 * @param {Object} gladys - The gladys object.
 * @param {string} serviceId - Identification of the service.
 * @param {string} withingsServerUrl - Withings server url.
 * @param {string} integrationName - [Optional] By default interationName='withings', param used only for test.
 * @description Create all device if not exist by listening
 * @example
 * const kodiManager = KodiManager(gladys, serviceId)
 */
const WithingsHandler = function WithingsHandler(gladys, serviceId, withingsServerUrl, integrationName) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.withingsUrl = withingsServerUrl;
  if (integrationName) {
    this.integrationName = integrationName;
  } else {
    this.integrationName = 'withings';
  }
};

// COMMANDS
WithingsHandler.prototype.init = init;
WithingsHandler.prototype.saveVar = saveVar;
WithingsHandler.prototype.deleteVar = deleteVar;
WithingsHandler.prototype.deleteDevices = deleteDevices;
WithingsHandler.prototype.getServiceId = getServiceId;
WithingsHandler.prototype.poll = poll;

module.exports = WithingsHandler;
