const logger = require('../../../utils/logger');

const { GLADYS_VARIABLES } = require('./utils/tuya.constants');

/**
 * @description Loads Tuya stored configuration.
 * @returns {Promise} Tuya configuration.
 * @example
 * await getConfiguration();
 */
async function getConfiguration() {
  logger.debug('Loading Tuya configuration...');
  const baseUrl = await this.gladys.variable.getValue(GLADYS_VARIABLES.BASE_URL, this.serviceId);
  const accessKey = await this.gladys.variable.getValue(GLADYS_VARIABLES.ACCESS_KEY, this.serviceId);
  const secretKey = await this.gladys.variable.getValue(GLADYS_VARIABLES.SECRET_KEY, this.serviceId);

  logger.debug(`Tuya configuration: baseUrl='${baseUrl}' accessKey='${accessKey}'`);

  return {
    baseUrl,
    accessKey,
    secretKey,
  };
}

module.exports = {
  getConfiguration,
};
