const logger = require('../../../utils/logger');
const { CONFIGURATION } = require('./sunspec.constants');

/**
 * @description Update SunSpec configuration.
 * @param {object} configuration - The configuration data.
 * @example
 * sunspec.updateConfiguration({ sunspecUrl: '' });
 */
async function updateConfiguration(configuration) {
  logger.debug(`SunSpec : Updating configuration...`);

  const { sunspecUrl } = configuration;

  if (sunspecUrl) {
    await this.gladys.variable.setValue(CONFIGURATION.SUNSPEC_DEVICE_URL, sunspecUrl, this.serviceId);
  }
}

module.exports = {
  updateConfiguration,
};
