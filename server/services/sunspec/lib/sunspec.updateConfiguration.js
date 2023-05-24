const logger = require('../../../utils/logger');
const { CONFIGURATION } = require('./sunspec.constants');

/**
 * @description Update SunSpec configuration.
 * @param {object} configuration - The configuration data.
 * @param {string} [configuration.sunspecUrl] - The host:port of the SunSpec device.
 * @example
 * sunspec.updateConfiguration({ sunspecUrl: 'localhost:502' });
 */
async function updateConfiguration({ sunspecUrl = undefined } = {}) {
  logger.debug(`SunSpec : Updating configuration...`);

  if (sunspecUrl) {
    await this.gladys.variable.setValue(CONFIGURATION.SUNSPEC_DEVICE_URL, sunspecUrl, this.serviceId);
  }
}

module.exports = {
  updateConfiguration,
};
