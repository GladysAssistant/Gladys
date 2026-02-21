const logger = require('../../../utils/logger');

const { GLADYS_VARIABLES } = require('./utils/tuya.constants');

/**
 * @description Save Tuya configuration.
 * @param {object} configuration - Configuration to save.
 * @returns {Promise} Tuya configuration.
 * @example
 * await saveConfiguration({ endpoint: '...', accessKey: '...', secretKey: '...'});
 */
async function saveConfiguration(configuration) {
  logger.debug('Saving Tuya configuration...');
  const { endpoint, accessKey, secretKey, appAccountId, appUsername } = configuration;
  await this.gladys.variable.setValue(GLADYS_VARIABLES.ENDPOINT, endpoint, this.serviceId);
  await this.gladys.variable.setValue(GLADYS_VARIABLES.ACCESS_KEY, accessKey, this.serviceId);
  await this.gladys.variable.setValue(GLADYS_VARIABLES.SECRET_KEY, secretKey, this.serviceId);
  await this.gladys.variable.setValue(GLADYS_VARIABLES.APP_ACCOUNT_UID, appAccountId, this.serviceId);
  await this.gladys.variable.setValue(GLADYS_VARIABLES.APP_USERNAME, appUsername, this.serviceId);
  await this.gladys.variable.setValue(GLADYS_VARIABLES.MANUAL_DISCONNECT, 'false', this.serviceId);

  return configuration;
}

module.exports = {
  saveConfiguration,
};
