const logger = require('../../../utils/logger');

const { GLADYS_VARIABLES } = require('./utils/tuya.constants');

/**
 * @description Save Tuya configuration.
 * @param {Object} configuration - Configuration to save.
 * @returns {Promise} Tuya configuration.
 * @example
 * await saveConfiguration({ baseUrl: '...', accessKey: '...', secretKey: '...'});
 */
async function saveConfiguration(configuration) {
  logger.debug('Saving Tuya configuration...');
  const { baseUrl, accessKey, secretKey } = configuration;
  await this.gladys.variable.setValue(GLADYS_VARIABLES.BASE_URL, baseUrl, this.serviceId);
  await this.gladys.variable.setValue(GLADYS_VARIABLES.ACCESS_KEY, accessKey, this.serviceId);
  await this.gladys.variable.setValue(GLADYS_VARIABLES.SECRET_KEY, secretKey, this.serviceId);

  return configuration;
}

module.exports = {
  saveConfiguration,
};
