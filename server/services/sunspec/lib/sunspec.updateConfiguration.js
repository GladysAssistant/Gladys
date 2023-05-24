const logger = require('../../../utils/logger');
const { CONFIGURATION } = require('./sunspec.constants');

/**
 * @description Update SunSpec configuration.
 * @param configuration.sunspecUrl
 * @param {object} configuration - The configuration data.
 * @example
 * sunspec.updateConfiguration({ sunspecUrl: '' });
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
