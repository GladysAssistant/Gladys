const logger = require('../../../utils/logger');
const { CONFIGURATION } = require('./sunspec.constants');

/**
 * @description Getting SunSpec information.
 * @returns {Promise<object>} Return Object of information.
 * @example
 * sunspec.getConfiguration();
 */
async function getConfiguration() {
  logger.debug(`SunSpec: Getting informations...`);

  const sunspecUrl = await this.gladys.variable.getValue(CONFIGURATION.SUNSPEC_DEVICE_URL, this.serviceId);

  return {
    sunspecUrl,
  };
}

module.exports = {
  getConfiguration,
};
