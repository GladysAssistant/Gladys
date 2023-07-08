const logger = require('../../../utils/logger');
const { CONFIGURATION } = require('./sunspec.constants');

/**
 * @description Update SunSpec configuration.
 * @param {object} configuration - The configuration data.
 * @param {string} [configuration.sunspecUrl] - The host:port of the SunSpec device.
 * @param {string} [configuration.bdpvActive] - The host:port of the SunSpec device.
 * @param {string} [configuration.bdpvUsername] - The host:port of the SunSpec device.
 * @param {string} [configuration.bdpvApiKey] - The host:port of the SunSpec device.
 * @example
 * sunspec.updateConfiguration({ sunspecUrl: 'localhost:502' });
 */
async function updateConfiguration({
  sunspecUrl = undefined,
  bdpvActive = undefined,
  bdpvUsername = undefined,
  bdpvApiKey = undefined,
} = {}) {
  logger.debug(`SunSpec : Updating configuration...`);

  if (sunspecUrl) {
    await this.gladys.variable.setValue(CONFIGURATION.SUNSPEC_DEVICE_URL, sunspecUrl, this.serviceId);
  }

  if (bdpvActive !== undefined) {
    await this.gladys.variable.setValue(CONFIGURATION.SUNSPEC_BDPV_ACTIVE, bdpvActive ? '1' : '0', this.serviceId);
  }

  if (bdpvUsername) {
    await this.gladys.variable.setValue(CONFIGURATION.SUNSPEC_BDPV_USER_NAME, bdpvUsername, this.serviceId);
  }

  if (bdpvApiKey) {
    await this.gladys.variable.setValue(CONFIGURATION.SUNSPEC_BDPV_API_KEY, bdpvApiKey, this.serviceId);
  }
}

module.exports = {
  updateConfiguration,
};
