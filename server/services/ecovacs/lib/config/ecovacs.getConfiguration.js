const logger = require('../../../../utils/logger');
const { CONFIGURATION } = require('../utils/ecovacs.constants');

/**
 * @description Return Ecovacs status.
 * @returns {any} Null.
 * @example
 * ecovacs.getConfiguration();
 */
async function getConfiguration() {
  logger.debug(`Ecovacs: config`);
  const login = await this.gladys.variable.getValue(CONFIGURATION.ECOVACS_LOGIN_KEY, this.serviceId);
  const password = await this.gladys.variable.getValue(CONFIGURATION.ECOVACS_PASSWORD_KEY, this.serviceId);
  const countryCode = await this.gladys.variable.getValue(CONFIGURATION.ECOVACS_COUNTRY_KEY, this.serviceId);

  return {
    login,
    password,
    countryCode,
  };
}

module.exports = {
  getConfiguration,
};
