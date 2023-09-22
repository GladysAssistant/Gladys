const logger = require('../../../utils/logger');
const { CONFIGURATION } = require('./sunspec.constants');

/**
 * @description Update SunSpec configuration.
 * @param {object} configuration - The configuration data.
 * @param {string} [configuration.ipMasks] - The CIDRs of the SunSpec devices to scan.
 * @param {string} [configuration.bdpvActive] - The host:port of the SunSpec device.
 * @param {string} [configuration.bdpvUsername] - The host:port of the SunSpec device.
 * @param {string} [configuration.bdpvApiKey] - The host:port of the SunSpec device.
 * @example
 * sunspec.updateConfiguration({ ipMasks: ['192.168.1.0/24'] });
 */
async function updateConfiguration({
  ipMasks = undefined,
  bdpvActive = undefined,
  bdpvUsername = undefined,
  bdpvApiKey = undefined,
} = {}) {
  logger.debug(`SunSpec : Updating configuration...`);

  if (ipMasks) {
    await this.gladys.variable.setValue(CONFIGURATION.SUNSPEC_IP_MASKS, JSON.stringify(ipMasks), this.serviceId);
    this.ipMasks = ipMasks;
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
