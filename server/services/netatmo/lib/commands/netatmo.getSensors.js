const { CONFIGURATION } = require('../constants');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

/**
 * @description Get Device.
 * @example
 * netatmo.getSensor();
 */
async function getSensors() {
  return Object.keys(this.sensors).map((sensorId) => this.sensors[sensorId]);
}

module.exports = {
    getSensors,
};
