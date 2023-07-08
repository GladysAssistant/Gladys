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

  const bdpvActiveStr = await this.gladys.variable.getValue(CONFIGURATION.SUNSPEC_BDPV_ACTIVE, this.serviceId);
  const bdpvActive = bdpvActiveStr !== undefined && bdpvActiveStr === '1';
  const bdpvUsername = await this.gladys.variable.getValue(CONFIGURATION.SUNSPEC_BDPV_USER_NAME, this.serviceId);
  const bdpvApiKey = await this.gladys.variable.getValue(CONFIGURATION.SUNSPEC_BDPV_API_KEY, this.serviceId);

  return {
    sunspecUrl,
    bdpvActive,
    bdpvUsername,
    bdpvApiKey,
  };
}

module.exports = {
  getConfiguration,
};
