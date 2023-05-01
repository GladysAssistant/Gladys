const Oauth2Client = require('./oauth2-client');
// COMMANDS
const { initDevices } = require('./withings.initDevices');
const { deleteVar } = require('./withings.deleteVar');
const { deleteDevices } = require('./withings.deleteDevices');
const { poll } = require('./withings.poll');
const { postCreate } = require('./withings.postCreate');
const { getDevices } = require('./utils/withings.getDevices');
const { getMeasures } = require('./utils/withings.getMeasures');
const { matchDeviceInDB } = require('./utils/withings.matchDeviceInDB');
const { buildMapOfMeasures } = require('./utils/withings.buildMapOfMeasures');
const { getAndSaveMeasures } = require('./utils/withings.getAndSaveMeasures');
const { getAndSaveBatteryLevel } = require('./utils/withings.getAndSaveBatteryLevel');

/**
 * @param {object} gladys - The gladys object.
 * @param {string} serviceId - Identification of the service.
 * @description Create all device if not exist by listening.
 * @example
 * const withingsHandler = WithingsHandler(gladys, serviceId)
 */
const WithingsHandler = function WithingsHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.withingsUrl = 'https://wbsapi.withings.net';
  this.oauth2Client = new Oauth2Client(gladys.variable);
};

// COMMANDS
WithingsHandler.prototype.initDevices = initDevices;
WithingsHandler.prototype.deleteVar = deleteVar;
WithingsHandler.prototype.deleteDevices = deleteDevices;
WithingsHandler.prototype.poll = poll;
WithingsHandler.prototype.postCreate = postCreate;
WithingsHandler.prototype.getDevices = getDevices;
WithingsHandler.prototype.getMeasures = getMeasures;
WithingsHandler.prototype.matchDeviceInDB = matchDeviceInDB;
WithingsHandler.prototype.buildMapOfMeasures = buildMapOfMeasures;
WithingsHandler.prototype.getAndSaveMeasures = getAndSaveMeasures;
WithingsHandler.prototype.getAndSaveBatteryLevel = getAndSaveBatteryLevel;

module.exports = WithingsHandler;
