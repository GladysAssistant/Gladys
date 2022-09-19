const logger = require('../../../../utils/logger');
const { CONFIGURATION } = require('../utils/ecovacs.constants');

/**
 * @description Return Ecovacs status.
 * @param {Object} configuration - Ecovacs configuration.
 * @param {string} [configuration.accountId] - Ecovacs username.
 * @param {string} [configuration.password] - Ecovacs password.
 * @param {string} [configuration.countryCode] - Ecovacs password.
 * @returns {any} Null.
 * @example
 * ecovacs.saveConfiguration();
 */
async function saveConfiguration({ accountId, password, countryCode }) {
  logger.debug(`Ecovacs: save config`);
  logger.debug(
    `Ecovacs: save config with ${CONFIGURATION.ECOVACS_LOGIN_KEY}=${accountId},${CONFIGURATION.ECOVACS_PASSWORD_KEY}=${password}, ${CONFIGURATION.ECOVACS_COUNTRY_KEY}=${countryCode}`,
  );
  await this.gladys.variable.setValue(CONFIGURATION.ECOVACS_LOGIN_KEY, accountId, this.serviceId);

  // The passwordHash is an md5 hash of your Ecovacs password.
  const passwordHash = this.ecovacsLibrary.EcoVacsAPI.md5(password);
  await this.gladys.variable.setValue(CONFIGURATION.ECOVACS_PASSWORD_KEY, passwordHash, this.serviceId);
  await this.gladys.variable.setValue(CONFIGURATION.ECOVACS_COUNTRY_KEY, countryCode, this.serviceId);
}

module.exports = {
  saveConfiguration,
};
