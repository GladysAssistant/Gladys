const logger = require('../../../utils/logger');

const { GLADYS_VARIABLES, TUYA_ENDPOINTS } = require('./utils/tuya.constants');

/**
 * @description Loads Tuya stored configuration.
 * @returns {Promise} Tuya configuration.
 * @example
 * await getConfiguration();
 */
async function getConfiguration() {
  logger.debug('Loading Tuya configuration...');
  const endpoint = await this.gladys.variable.getValue(GLADYS_VARIABLES.ENDPOINT, this.serviceId);
  const accessKey = await this.gladys.variable.getValue(GLADYS_VARIABLES.ACCESS_KEY, this.serviceId);
  const secretKey = await this.gladys.variable.getValue(GLADYS_VARIABLES.SECRET_KEY, this.serviceId);

  logger.debug(`Tuya configuration: baseUrl='${endpoint}' accessKey='${accessKey}'`);
  const baseUrl = TUYA_ENDPOINTS[endpoint] || TUYA_ENDPOINTS.china;

  return {
    baseUrl,
    accessKey,
    secretKey,
  };
}

module.exports = {
  getConfiguration,
};
